-- =====================================================================
-- COLEÇÃO FÁCIL — 0002_convites_termos_privacidade.sql
--
-- Decisões incorporadas:
--   11. Perfil público vira escolha explícita do colecionador
--   14. Termos de uso aceitos no cadastro (o app não medeia trocas)
--   16. Cadastro só por convite gerado pelo super admin
--   17. Idade mínima de 18 anos
--
-- Rode no SQL Editor DEPOIS do 0001_init.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. NOVAS COLUNAS EM usuarios
-- ---------------------------------------------------------------------

alter table public.usuarios
  add column if not exists perfil_publico    boolean     not null default false,
  add column if not exists nascimento        date,
  add column if not exists termos_aceitos_em timestamptz,
  add column if not exists termos_versao     text;

comment on column public.usuarios.perfil_publico is
  'Item 11: o colecionador decide se aparece nas buscas. Independente do apelido.';
comment on column public.usuarios.nascimento is
  'Item 17: idade mínima de 18 anos, validada no cadastro.';
comment on column public.usuarios.termos_aceitos_em is
  'Item 14: o app não medeia trocas. Registro de quando o usuário aceitou os termos.';

-- O super admin já existe e não passou por esse fluxo — libera ele.
update public.usuarios
   set termos_aceitos_em = coalesce(termos_aceitos_em, now()),
       termos_versao     = coalesce(termos_versao, '1.0')
 where papel = 'super_admin';


-- ---------------------------------------------------------------------
-- 2. TABELA DE CONVITES
-- ---------------------------------------------------------------------

create table if not exists public.convites (
  id         uuid primary key default gen_random_uuid(),
  codigo     text not null unique,
  email      text,                        -- opcional: trava o convite num e-mail
  observacao text,                        -- ex: "grupo do álbum da Copa"
  criado_por uuid not null references public.usuarios(id) on delete cascade,
  usado_por  uuid references public.usuarios(id) on delete set null,
  usado_em   timestamptz,
  expira_em  timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

comment on table public.convites is
  'Item 16: cadastro fechado. O super admin gera o código e compartilha o link.';

create index if not exists idx_convites_codigo on public.convites(codigo);
create index if not exists idx_convites_abertos on public.convites(expira_em)
  where usado_em is null;

alter table public.convites enable row level security;

-- Só o super admin enxerga e administra convites
drop policy if exists convites_admin on public.convites;
create policy convites_admin on public.convites
  for all using (public.is_super_admin())
  with check (public.is_super_admin());


-- ---------------------------------------------------------------------
-- 3. VALIDAÇÃO DO CONVITE (usada pela tela antes de criar a conta)
-- ---------------------------------------------------------------------

create or replace function public.convite_valido(p_codigo text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.convites
     where codigo = upper(trim(p_codigo))
       and usado_em is null
       and expira_em > now()
  );
$$;

revoke all on function public.convite_valido(text) from public;
grant execute on function public.convite_valido(text) to anon, authenticated;

comment on function public.convite_valido is
  'Só devolve sim/não. Não expõe nenhum dado do convite.';


-- ---------------------------------------------------------------------
-- 4. NOVO handle_new_user — com as travas de convite, idade e termos
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta       jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_codigo     text  := upper(trim(coalesce(v_meta->>'convite', '')));
  v_nascimento date;
  v_convite    public.convites%rowtype;
  v_super      boolean;
begin
  v_super := lower(new.email) = 'netaosushibar@gmail.com';

  -- O super admin entra sem convite (é quem gera os convites)
  if not v_super then

    -- 4.1 Convite obrigatório
    if v_codigo = '' then
      raise exception 'CONVITE_OBRIGATORIO'
        using hint = 'O cadastro no Coleção Fácil é feito por convite.';
    end if;

    select * into v_convite
      from public.convites
     where codigo = v_codigo
       and usado_em is null
       and expira_em > now()
     for update;

    if not found then
      raise exception 'CONVITE_INVALIDO'
        using hint = 'Convite inexistente, já usado ou vencido.';
    end if;

    -- Convite preso a um e-mail específico
    if v_convite.email is not null
       and lower(v_convite.email) <> lower(new.email) then
      raise exception 'CONVITE_OUTRO_EMAIL'
        using hint = 'Este convite foi enviado para outro e-mail.';
    end if;

    -- 4.2 Idade mínima de 18 anos
    begin
      v_nascimento := (v_meta->>'nascimento')::date;
    exception when others then
      v_nascimento := null;
    end;

    if v_nascimento is null then
      raise exception 'NASCIMENTO_OBRIGATORIO'
        using hint = 'Informe sua data de nascimento.';
    end if;

    if v_nascimento > (current_date - interval '18 years') then
      raise exception 'IDADE_MINIMA'
        using hint = 'É necessário ter 18 anos ou mais.';
    end if;

    -- 4.3 Aceite dos termos
    if coalesce(v_meta->>'termos_aceitos', 'false') <> 'true' then
      raise exception 'TERMOS_NAO_ACEITOS'
        using hint = 'É preciso aceitar os termos de uso.';
    end if;
  end if;

  -- 4.4 Cria o perfil
  insert into public.usuarios (
    id, email, nome, papel, nascimento, termos_aceitos_em, termos_versao
  )
  values (
    new.id,
    new.email,
    coalesce(v_meta->>'nome', split_part(new.email, '@', 1)),
    case when v_super then 'super_admin'::public.papel_usuario
         else 'colecionador'::public.papel_usuario end,
    v_nascimento,
    now(),
    coalesce(v_meta->>'termos_versao', '1.0')
  )
  on conflict (id) do nothing;

  -- 4.5 Queima o convite
  if not v_super then
    update public.convites
       set usado_por = new.id,
           usado_em  = now()
     where id = v_convite.id;
  end if;

  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 5. PRIVACIDADE — perfil só aparece se o colecionador quiser
-- ---------------------------------------------------------------------

-- Antes bastava ter apelido. Agora exige o interruptor ligado.
drop policy if exists usuarios_le_publico on public.usuarios;

drop policy if exists itens_usuario_le_publico on public.itens_usuario;
create policy itens_usuario_le_publico on public.itens_usuario
  for select using (
    status = 'repetida'
    and exists (
      select 1 from public.usuarios u
      where u.id = itens_usuario.usuario_id
        and u.perfil_publico = true
        and u.apelido is not null
        and u.ativo = true
    )
  );

-- View pública: só colunas seguras.
-- E-mail e data de nascimento NUNCA saem daqui.
-- O WhatsApp só aparece se o colecionador tiver marcado como público.
create or replace view public.perfis_publicos as
select
  u.id,
  u.apelido,
  u.nome,
  u.cidade,
  u.estado,
  u.foto_url,
  case when u.whatsapp_publico then u.whatsapp end as whatsapp,
  u.created_at
from public.usuarios u
where u.perfil_publico = true
  and u.apelido is not null
  and u.ativo = true;

grant select on public.perfis_publicos to anon, authenticated;

comment on view public.perfis_publicos is
  'Única porta de entrada para dados de outros colecionadores. Nunca expõe e-mail nem nascimento.';
