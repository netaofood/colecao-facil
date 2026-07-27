-- =====================================================================
-- COLEÇÃO FÁCIL — 0003_cadastro_pelo_admin.sql
--
-- O cadastro deixa de ser feito pelo próprio usuário. Só o super admin
-- cria contas. Data de nascimento e aceite dos termos passam a ser
-- pedidos no primeiro acesso da pessoa.
--
-- IMPORTANTE — depois de rodar este arquivo, desligue o autocadastro:
--   Supabase → Authentication → Sign In / Providers → Email
--   → desmarcar "Allow new users to sign up"
-- Sem isso, qualquer pessoa ainda consegue criar conta pela API.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TRIGGER DE CRIAÇÃO DE PERFIL
-- ---------------------------------------------------------------------

-- Sai a exigência de convite, nascimento e termos no momento da criação:
-- a conta agora nasce pela mão do super admin, e os dados que faltam são
-- pedidos à pessoa no primeiro acesso.
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
  insert into public.usuarios (id, email, nome, papel)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(v_meta->>'nome', '')), ''),
    case when v_super then 'super_admin'::public.papel_usuario
         else 'colecionador'::public.papel_usuario end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 2. PRIMEIRO ACESSO
-- ---------------------------------------------------------------------

-- Marca quem já passou pela tela de boas-vindas.
-- Quem tem nascimento e termos preenchidos já está resolvido.
alter table public.usuarios
  add column if not exists primeiro_acesso_em timestamptz;

comment on column public.usuarios.primeiro_acesso_em is
  'Quando a pessoa completou o primeiro acesso, informando nascimento e aceitando os termos.';

-- O super admin não precisa passar por isso
update public.usuarios
   set primeiro_acesso_em = coalesce(primeiro_acesso_em, now())
 where papel = 'super_admin';

-- Quem já tinha os dados (contas criadas no fluxo antigo) também não precisa
update public.usuarios
   set primeiro_acesso_em = coalesce(primeiro_acesso_em, created_at)
 where nascimento is not null
   and termos_aceitos_em is not null;

-- Trava de idade também no banco, não só na tela
alter table public.usuarios
  drop constraint if exists usuarios_maior_de_idade;

alter table public.usuarios
  add constraint usuarios_maior_de_idade check (
    nascimento is null
    or nascimento <= (current_date - interval '18 years')
  );


-- ---------------------------------------------------------------------
-- 3. CONVITES SAEM DE CENA
-- ---------------------------------------------------------------------

-- A tabela fica no banco por precaução, mas ninguém mais valida convite.
drop function if exists public.convite_valido(text);

comment on table public.convites is
  'Sem uso desde a migration 0003. O cadastro passou a ser feito pelo super admin.';


-- ---------------------------------------------------------------------
-- 4. RESQUÍCIOS DA ÁREA PÚBLICA
-- ---------------------------------------------------------------------

drop view if exists public.perfis_publicos;

drop policy if exists itens_usuario_le_publico on public.itens_usuario;

alter table public.usuarios drop column if exists perfil_publico;

-- Coleção oficial era do modelo de adoção, que não existe mais.
-- Duas políticas citam essa coluna, então precisam ser refeitas antes.
drop policy if exists colecoes_cria on public.colecoes;
drop policy if exists colecoes_edita on public.colecoes;

alter table public.colecoes drop column if exists oficial;

create policy colecoes_cria on public.colecoes
  for insert with check (dono_id = auth.uid());

create policy colecoes_edita on public.colecoes
  for update using (dono_id = auth.uid())
  with check (dono_id = auth.uid());


-- ---------------------------------------------------------------------
-- 5. CONFERÊNCIA
-- ---------------------------------------------------------------------

-- Depois de rodar, esta consulta deve mostrar seu usuário com
-- primeiro_acesso_em preenchido:
--
--   select email, papel, nascimento, termos_aceitos_em, primeiro_acesso_em
--     from public.usuarios;
