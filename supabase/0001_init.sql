-- =====================================================================
-- COLEÇÃO FÁCIL — 0001_init.sql
-- Schema inicial completo: tipos, tabelas, índices, RLS, triggers, storage.
-- Rode no SQL Editor do Supabase depois do 0000_reset.sql (se necessário).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TIPOS
-- ---------------------------------------------------------------------

create type public.papel_usuario as enum ('super_admin', 'colecionador');
create type public.visibilidade_colecao as enum ('privada', 'publica');
create type public.status_item as enum ('falta', 'tenho', 'repetida');
create type public.status_troca as enum ('aberta', 'aceita', 'recusada', 'concluida', 'cancelada');
create type public.direcao_item_troca as enum ('oferecido', 'pedido');


-- ---------------------------------------------------------------------
-- 2. TABELAS
-- ---------------------------------------------------------------------

-- 2.1 usuarios ---------------------------------------------------------
create table public.usuarios (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null unique,
  nome            text,
  apelido         text unique,
  cidade          text,
  estado          text,
  whatsapp        text,
  whatsapp_publico boolean not null default false,
  foto_url        text,
  papel           public.papel_usuario not null default 'colecionador',
  ativo           boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- apelido: minúsculo, sem espaço, 3 a 30 chars (vira URL do perfil público)
  constraint apelido_formato check (
    apelido is null or apelido ~ '^[a-z0-9_.-]{3,30}$'
  )
);

comment on table public.usuarios is 'Perfil do colecionador. 1:1 com auth.users.';
comment on column public.usuarios.apelido is 'Único. Usado na URL do perfil público /u/{apelido}.';
comment on column public.usuarios.whatsapp_publico is 'Padrão false: WhatsApp só é revelado dentro de troca aceita.';


-- 2.2 colecoes ---------------------------------------------------------
create table public.colecoes (
  id                uuid primary key default gen_random_uuid(),
  dono_id           uuid not null references public.usuarios(id) on delete cascade,
  nome              text not null,
  descricao         text,
  capa_url          text,
  categoria         text,
  ano               integer,
  oficial           boolean not null default false,
  visibilidade      public.visibilidade_colecao not null default 'privada',
  arquivada         boolean not null default false,
  colecao_origem_id uuid references public.colecoes(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint nome_nao_vazio check (length(trim(nome)) > 0),
  constraint ano_valido check (ano is null or (ano between 1800 and 2200))
);

comment on table public.colecoes is 'Catálogo. Se oficial=true, foi publicada pelo Super Admin e pode ser adotada por qualquer colecionador.';
comment on column public.colecoes.colecao_origem_id is 'Preenchido quando a coleção foi duplicada de outra.';

-- Coleção oficial é sempre pública (regra de negócio do item 6.3)
create index idx_colecoes_dono on public.colecoes(dono_id) where arquivada = false;
create index idx_colecoes_oficial on public.colecoes(oficial) where oficial = true and arquivada = false;
create index idx_colecoes_publicas on public.colecoes(visibilidade) where visibilidade = 'publica' and arquivada = false;


-- 2.3 subdivisoes ------------------------------------------------------
create table public.subdivisoes (
  id          uuid primary key default gen_random_uuid(),
  colecao_id  uuid not null references public.colecoes(id) on delete cascade,
  nome        text not null,
  ordem       integer not null default 0,
  created_at  timestamptz not null default now()
);

comment on table public.subdivisoes is 'Páginas, séries ou temporadas dentro de uma coleção.';

create index idx_subdivisoes_colecao on public.subdivisoes(colecao_id, ordem);


-- 2.4 itens ------------------------------------------------------------
create table public.itens (
  id            uuid primary key default gen_random_uuid(),
  colecao_id    uuid not null references public.colecoes(id) on delete cascade,
  subdivisao_id uuid references public.subdivisoes(id) on delete set null,
  numero        text,
  nome          text not null,
  categoria     text,
  raridade      text,
  foto_url      text,
  observacao    text,
  ordem         integer not null default 0,
  created_at    timestamptz not null default now(),

  constraint item_nome_nao_vazio check (length(trim(nome)) > 0)
);

comment on table public.itens is 'Catálogo de itens de uma coleção. numero é texto para aceitar 001, 12A, etc.';

create index idx_itens_colecao on public.itens(colecao_id, ordem);
create index idx_itens_subdivisao on public.itens(subdivisao_id);
-- Busca por nome/numero
create index idx_itens_busca on public.itens using gin (
  to_tsvector('portuguese', coalesce(nome,'') || ' ' || coalesce(numero,''))
);
-- Número único dentro da coleção (quando informado)
create unique index idx_itens_numero_unico on public.itens(colecao_id, numero)
  where numero is not null;


-- 2.5 colecoes_usuario (adoção) ---------------------------------------
create table public.colecoes_usuario (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  colecao_id uuid not null references public.colecoes(id) on delete cascade,
  favorita   boolean not null default false,
  created_at timestamptz not null default now(),

  unique (usuario_id, colecao_id)
);

comment on table public.colecoes_usuario is 'Coleções que o usuário adotou (item 6.4). Não duplica o catálogo, só o vínculo.';

create index idx_colecoes_usuario_usuario on public.colecoes_usuario(usuario_id);
create index idx_colecoes_usuario_colecao on public.colecoes_usuario(colecao_id);


-- 2.6 itens_usuario (tenho / falta / repetida) ------------------------
create table public.itens_usuario (
  id                   uuid primary key default gen_random_uuid(),
  usuario_id           uuid not null references public.usuarios(id) on delete cascade,
  item_id              uuid not null references public.itens(id) on delete cascade,
  status               public.status_item not null default 'falta',
  quantidade_repetida  integer not null default 0,
  updated_at           timestamptz not null default now(),

  unique (usuario_id, item_id),
  constraint qtd_repetida_coerente check (
    (status = 'repetida' and quantidade_repetida >= 1)
    or (status <> 'repetida' and quantidade_repetida = 0)
  )
);

comment on table public.itens_usuario is 'Estado de cada item para cada colecionador. Linha só existe se o usuário mexeu no item; ausência = falta.';

create index idx_itens_usuario_usuario on public.itens_usuario(usuario_id);
create index idx_itens_usuario_item on public.itens_usuario(item_id);
-- Índice-chave do motor de trocas: quem tem repetida de qual item
create index idx_itens_usuario_repetidas on public.itens_usuario(item_id, usuario_id)
  where status = 'repetida';
create index idx_itens_usuario_faltantes on public.itens_usuario(item_id, usuario_id)
  where status = 'falta';


-- 2.7 trocas -----------------------------------------------------------
create table public.trocas (
  id              uuid primary key default gen_random_uuid(),
  solicitante_id  uuid not null references public.usuarios(id) on delete cascade,
  destinatario_id uuid not null references public.usuarios(id) on delete cascade,
  status          public.status_troca not null default 'aberta',
  mensagem        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint troca_partes_distintas check (solicitante_id <> destinatario_id)
);

comment on table public.trocas is 'Proposta de troca entre dois colecionadores.';

create index idx_trocas_solicitante on public.trocas(solicitante_id, status);
create index idx_trocas_destinatario on public.trocas(destinatario_id, status);


-- 2.8 trocas_itens -----------------------------------------------------
create table public.trocas_itens (
  id       uuid primary key default gen_random_uuid(),
  troca_id uuid not null references public.trocas(id) on delete cascade,
  item_id  uuid not null references public.itens(id) on delete cascade,
  direcao  public.direcao_item_troca not null,

  unique (troca_id, item_id, direcao)
);

comment on table public.trocas_itens is 'Itens de uma troca. oferecido = vai do solicitante para o destinatário.';

create index idx_trocas_itens_troca on public.trocas_itens(troca_id);


-- ---------------------------------------------------------------------
-- 3. FUNÇÕES
-- ---------------------------------------------------------------------

-- 3.1 Única função SECURITY DEFINER do projeto.
-- Existe para quebrar a recursão: as policies de `usuarios` precisam saber
-- se quem consulta é super admin, e essa checagem lê a própria `usuarios`.
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid() and papel = 'super_admin' and ativo = true
  );
$$;

revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;


-- 3.2 updated_at automático
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- 3.3 Cria o perfil no signup.
-- O super admin é definido por e-mail — único usuário com esse papel.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, email, nome, papel)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    case
      when lower(new.email) = 'netaosushibar@gmail.com' then 'super_admin'::public.papel_usuario
      else 'colecionador'::public.papel_usuario
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 4. TRIGGERS
-- ---------------------------------------------------------------------

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger trg_usuarios_updated
  before update on public.usuarios
  for each row execute function public.set_updated_at();

create trigger trg_colecoes_updated
  before update on public.colecoes
  for each row execute function public.set_updated_at();

create trigger trg_itens_usuario_updated
  before update on public.itens_usuario
  for each row execute function public.set_updated_at();

create trigger trg_trocas_updated
  before update on public.trocas
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------

alter table public.usuarios          enable row level security;
alter table public.colecoes          enable row level security;
alter table public.subdivisoes       enable row level security;
alter table public.itens             enable row level security;
alter table public.colecoes_usuario  enable row level security;
alter table public.itens_usuario     enable row level security;
alter table public.trocas            enable row level security;
alter table public.trocas_itens      enable row level security;


-- 5.1 usuarios ---------------------------------------------------------
create policy usuarios_le_proprio on public.usuarios
  for select using (id = auth.uid());

-- Perfis com apelido são públicos (item 10.1)
create policy usuarios_le_publico on public.usuarios
  for select using (apelido is not null and ativo = true);

create policy usuarios_le_admin on public.usuarios
  for select using (public.is_super_admin());

create policy usuarios_edita_proprio on public.usuarios
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy usuarios_admin_tudo on public.usuarios
  for all using (public.is_super_admin()) with check (public.is_super_admin());


-- 5.2 colecoes ---------------------------------------------------------
create policy colecoes_le_propria on public.colecoes
  for select using (dono_id = auth.uid());

create policy colecoes_le_publica on public.colecoes
  for select using (visibilidade = 'publica' and arquivada = false);

create policy colecoes_le_adotada on public.colecoes
  for select using (
    exists (
      select 1 from public.colecoes_usuario cu
      where cu.colecao_id = colecoes.id and cu.usuario_id = auth.uid()
    )
  );

create policy colecoes_cria on public.colecoes
  for insert with check (
    dono_id = auth.uid()
    -- só o super admin publica coleção oficial
    and (oficial = false or public.is_super_admin())
  );

create policy colecoes_edita on public.colecoes
  for update using (dono_id = auth.uid())
  with check (dono_id = auth.uid() and (oficial = false or public.is_super_admin()));

create policy colecoes_apaga on public.colecoes
  for delete using (dono_id = auth.uid());

create policy colecoes_admin_tudo on public.colecoes
  for all using (public.is_super_admin()) with check (public.is_super_admin());


-- 5.3 subdivisoes ------------------------------------------------------
create policy subdivisoes_le on public.subdivisoes
  for select using (
    exists (
      select 1 from public.colecoes c
      where c.id = subdivisoes.colecao_id
        and (c.dono_id = auth.uid()
             or (c.visibilidade = 'publica' and c.arquivada = false))
    )
  );

create policy subdivisoes_escreve on public.subdivisoes
  for all using (
    exists (select 1 from public.colecoes c
            where c.id = subdivisoes.colecao_id and c.dono_id = auth.uid())
  )
  with check (
    exists (select 1 from public.colecoes c
            where c.id = subdivisoes.colecao_id and c.dono_id = auth.uid())
  );

create policy subdivisoes_admin on public.subdivisoes
  for all using (public.is_super_admin()) with check (public.is_super_admin());


-- 5.4 itens ------------------------------------------------------------
create policy itens_le on public.itens
  for select using (
    exists (
      select 1 from public.colecoes c
      where c.id = itens.colecao_id
        and (c.dono_id = auth.uid()
             or (c.visibilidade = 'publica' and c.arquivada = false)
             or exists (select 1 from public.colecoes_usuario cu
                        where cu.colecao_id = c.id and cu.usuario_id = auth.uid()))
    )
  );

create policy itens_escreve on public.itens
  for all using (
    exists (select 1 from public.colecoes c
            where c.id = itens.colecao_id and c.dono_id = auth.uid())
  )
  with check (
    exists (select 1 from public.colecoes c
            where c.id = itens.colecao_id and c.dono_id = auth.uid())
  );

create policy itens_admin on public.itens
  for all using (public.is_super_admin()) with check (public.is_super_admin());


-- 5.5 colecoes_usuario -------------------------------------------------
create policy colecoes_usuario_proprio on public.colecoes_usuario
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy colecoes_usuario_admin on public.colecoes_usuario
  for select using (public.is_super_admin());


-- 5.6 itens_usuario ----------------------------------------------------
create policy itens_usuario_proprio on public.itens_usuario
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- O motor de trocas precisa enxergar as repetidas alheias de perfis públicos
create policy itens_usuario_le_publico on public.itens_usuario
  for select using (
    status = 'repetida'
    and exists (
      select 1 from public.usuarios u
      where u.id = itens_usuario.usuario_id
        and u.apelido is not null and u.ativo = true
    )
  );

create policy itens_usuario_admin on public.itens_usuario
  for select using (public.is_super_admin());


-- 5.7 trocas -----------------------------------------------------------
create policy trocas_le_parte on public.trocas
  for select using (solicitante_id = auth.uid() or destinatario_id = auth.uid());

create policy trocas_cria on public.trocas
  for insert with check (solicitante_id = auth.uid());

-- Ambas as partes podem mudar status (aceitar, recusar, concluir)
create policy trocas_atualiza on public.trocas
  for update using (solicitante_id = auth.uid() or destinatario_id = auth.uid())
  with check (solicitante_id = auth.uid() or destinatario_id = auth.uid());

create policy trocas_admin on public.trocas
  for select using (public.is_super_admin());


-- 5.8 trocas_itens -----------------------------------------------------
create policy trocas_itens_le on public.trocas_itens
  for select using (
    exists (select 1 from public.trocas t
            where t.id = trocas_itens.troca_id
              and (t.solicitante_id = auth.uid() or t.destinatario_id = auth.uid()))
  );

create policy trocas_itens_escreve on public.trocas_itens
  for all using (
    exists (select 1 from public.trocas t
            where t.id = trocas_itens.troca_id and t.solicitante_id = auth.uid())
  )
  with check (
    exists (select 1 from public.trocas t
            where t.id = trocas_itens.troca_id and t.solicitante_id = auth.uid())
  );


-- ---------------------------------------------------------------------
-- 6. STORAGE
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('colecao-imagens', 'colecao-imagens', true)
on conflict (id) do nothing;

create policy "imagens leitura publica"
  on storage.objects for select
  using (bucket_id = 'colecao-imagens');

create policy "imagens upload autenticado"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'colecao-imagens');

create policy "imagens dono atualiza"
  on storage.objects for update to authenticated
  using (bucket_id = 'colecao-imagens' and owner = auth.uid());

create policy "imagens dono apaga"
  on storage.objects for delete to authenticated
  using (bucket_id = 'colecao-imagens' and owner = auth.uid());
