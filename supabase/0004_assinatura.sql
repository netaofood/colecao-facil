-- =====================================================================
-- COLEÇÃO FÁCIL — 0004_assinatura.sql
--
-- Plano único de R$ 29,90 por mês, com controle manual: o super admin
-- registra os pagamentos e a assinatura é estendida mês a mês.
--
-- Quem está vencido continua vendo tudo e marcando o que já tem,
-- mas não cria coleção nova nem cadastra item.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ASSINATURA NO CADASTRO DO USUÁRIO
-- ---------------------------------------------------------------------

alter table public.usuarios
  add column if not exists assinatura_ate date,
  add column if not exists isento boolean not null default false;

comment on column public.usuarios.assinatura_ate is
  'Último dia de acesso pago. Vencido = continua vendo, mas não cadastra.';
comment on column public.usuarios.isento is
  'Não precisa pagar. Usado para o administrador e cortesias.';

-- O super admin não paga
update public.usuarios set isento = true where papel = 'super_admin';

-- Contas que já existem ganham 30 dias a partir de hoje, para ninguém
-- ficar travado no momento em que esta migration rodar.
update public.usuarios
   set assinatura_ate = current_date + 30
 where assinatura_ate is null
   and isento = false;


-- ---------------------------------------------------------------------
-- 2. PAGAMENTOS
-- ---------------------------------------------------------------------

create table if not exists public.pagamentos (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid not null references public.usuarios(id) on delete cascade,
  valor         numeric(10,2) not null default 29.90,
  meses         integer not null default 1,
  pago_em       date not null default current_date,
  -- até quando a assinatura passou a valer depois deste pagamento
  vigencia_ate  date not null,
  forma         text,
  observacao    text,
  registrado_por uuid references public.usuarios(id) on delete set null,
  created_at    timestamptz not null default now(),

  constraint valor_positivo check (valor >= 0),
  constraint meses_validos check (meses between 1 and 36)
);

comment on table public.pagamentos is
  'Histórico de pagamentos. Cada registro estende a assinatura do usuário.';

create index if not exists idx_pagamentos_usuario
  on public.pagamentos(usuario_id, pago_em desc);

alter table public.pagamentos enable row level security;

-- Só o administrador registra e enxerga pagamentos de todos
drop policy if exists pagamentos_admin on public.pagamentos;
create policy pagamentos_admin on public.pagamentos
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

-- O colecionador vê os próprios pagamentos
drop policy if exists pagamentos_proprios on public.pagamentos;
create policy pagamentos_proprios on public.pagamentos
  for select using (usuario_id = auth.uid());


-- ---------------------------------------------------------------------
-- 3. REGISTRAR PAGAMENTO
-- ---------------------------------------------------------------------

-- Estende a assinatura a partir da data que for maior: hoje ou o
-- vencimento atual. Assim quem paga adiantado não perde os dias que
-- ainda tem, e quem paga atrasado recomeça de hoje.
create or replace function public.registrar_pagamento(
  p_usuario_id uuid,
  p_meses      integer default 1,
  p_valor      numeric default 29.90,
  p_forma      text default null,
  p_observacao text default null
)
returns date
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base     date;
  v_nova     date;
begin
  if not public.is_super_admin() then
    raise exception 'Apenas o administrador pode registrar pagamentos.';
  end if;

  if p_meses < 1 or p_meses > 36 then
    raise exception 'Quantidade de meses inválida.';
  end if;

  select greatest(coalesce(assinatura_ate, current_date), current_date)
    into v_base
    from public.usuarios
   where id = p_usuario_id;

  if v_base is null then
    raise exception 'Colecionador não encontrado.';
  end if;

  v_nova := v_base + (p_meses || ' months')::interval;

  update public.usuarios
     set assinatura_ate = v_nova
   where id = p_usuario_id;

  insert into public.pagamentos (
    usuario_id, valor, meses, vigencia_ate, forma, observacao, registrado_por
  )
  values (
    p_usuario_id, p_valor, p_meses, v_nova, p_forma, p_observacao, auth.uid()
  );

  return v_nova;
end;
$$;

revoke all on function public.registrar_pagamento(uuid, integer, numeric, text, text) from public;
grant execute on function public.registrar_pagamento(uuid, integer, numeric, text, text) to authenticated;


-- ---------------------------------------------------------------------
-- 4. A TRAVA
-- ---------------------------------------------------------------------

create or replace function public.assinatura_ativa()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios
     where id = auth.uid()
       and ativo = true
       and (isento = true or assinatura_ate >= current_date)
  );
$$;

revoke all on function public.assinatura_ativa() from public;
grant execute on function public.assinatura_ativa() to authenticated;

comment on function public.assinatura_ativa is
  'Vencido continua lendo e marcando o que tem; só não cadastra coisa nova.';

-- Criar coleção exige assinatura em dia
drop policy if exists colecoes_cria on public.colecoes;
create policy colecoes_cria on public.colecoes
  for insert with check (
    dono_id = auth.uid() and public.assinatura_ativa()
  );

-- Cadastrar item também
drop policy if exists itens_escreve on public.itens;
create policy itens_escreve on public.itens
  for all using (
    exists (select 1 from public.colecoes c
             where c.id = itens.colecao_id and c.dono_id = auth.uid())
  )
  with check (
    exists (select 1 from public.colecoes c
             where c.id = itens.colecao_id and c.dono_id = auth.uid())
    and public.assinatura_ativa()
  );

-- E subdivisões
drop policy if exists subdivisoes_escreve on public.subdivisoes;
create policy subdivisoes_escreve on public.subdivisoes
  for all using (
    exists (select 1 from public.colecoes c
             where c.id = subdivisoes.colecao_id and c.dono_id = auth.uid())
  )
  with check (
    exists (select 1 from public.colecoes c
             where c.id = subdivisoes.colecao_id and c.dono_id = auth.uid())
    and public.assinatura_ativa()
  );

-- Marcar tenho, falta e repetida continua liberado para quem venceu:
-- é uso do que já existe, não cadastro. A política de itens_usuario
-- permanece como está.


-- ---------------------------------------------------------------------
-- 5. NOVAS CONTAS
-- ---------------------------------------------------------------------

-- Conta criada pelo administrador nasce com 7 dias de cortesia.
-- Para mudar o prazo, altere o número abaixo e rode de novo.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta  jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_super boolean := lower(new.email) = 'netaosushibar@gmail.com';
begin
  insert into public.usuarios (
    id, email, nome, papel, isento, assinatura_ate
  )
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(v_meta->>'nome', '')), ''),
    case when v_super then 'super_admin'::public.papel_usuario
         else 'colecionador'::public.papel_usuario end,
    v_super,
    case when v_super then null else current_date + 7 end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 6. CONFERÊNCIA
-- ---------------------------------------------------------------------

-- select email, papel, isento, assinatura_ate,
--        (isento or assinatura_ate >= current_date) as em_dia
--   from public.usuarios;
