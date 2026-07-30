-- =====================================================================
-- CLONAR COLEÇÃO ENTRE COLECIONADORES
--
-- Copia uma coleção inteira — subdivisões e itens — de um usuário para
-- outro. Serve para testes: o destinatário recebe o catálogo em branco,
-- sem nenhuma marcação de tenho, falta ou repetida.
--
-- Rode no SQL Editor do Supabase.
-- =====================================================================


-- ---------------------------------------------------------------------
-- PASSO 1 — Descobrir quem é quem
-- Rode isto primeiro e confirme os e-mails antes de clonar.
-- ---------------------------------------------------------------------

select u.email,
       u.nome,
       count(c.id) as colecoes
  from public.usuarios u
  left join public.colecoes c on c.dono_id = u.id
 group by u.email, u.nome
 order by u.nome;


-- ---------------------------------------------------------------------
-- PASSO 2 — Ver as coleções da origem
-- ---------------------------------------------------------------------

select c.id,
       c.nome,
       c.categoria,
       c.ano,
       (select count(*) from public.itens i where i.colecao_id = c.id) as itens,
       (select count(*) from public.subdivisoes s where s.colecao_id = c.id) as subdivisoes
  from public.colecoes c
  join public.usuarios u on u.id = c.dono_id
 where u.email = 'netaosushibar@gmail.com'   -- <<< ORIGEM
 order by c.created_at;


-- ---------------------------------------------------------------------
-- PASSO 3 — Clonar
--
-- Ajuste as três linhas marcadas com <<< e rode.
-- Pode rodar mais de uma vez: cada execução cria uma cópia nova.
-- ---------------------------------------------------------------------

do $$
declare
  -- >>> AJUSTE AQUI <<<
  v_email_origem  text := 'netaosushibar@gmail.com';   -- <<< de quem copia
  v_email_destino text := 'leonan@netao.app.br';       -- <<< para quem vai
  v_nome_colecao  text := 'Legends - Usa 2026';        -- <<< qual coleção
  -- Deixe vazio para manter o mesmo nome da original
  v_novo_nome     text := '';

  v_dono_origem   uuid;
  v_dono_destino  uuid;
  v_colecao_velha uuid;
  v_colecao_nova  uuid;
  v_qtd_subs      integer := 0;
  v_qtd_itens     integer := 0;
begin
  -- 1. Encontrar os dois usuários
  select id into v_dono_origem
    from public.usuarios where lower(email) = lower(v_email_origem);

  if v_dono_origem is null then
    raise exception 'Não achei o usuário de origem: %', v_email_origem;
  end if;

  select id into v_dono_destino
    from public.usuarios where lower(email) = lower(v_email_destino);

  if v_dono_destino is null then
    raise exception
      'Não achei o usuário de destino: %. Crie a conta primeiro pelo painel.',
      v_email_destino;
  end if;

  if v_dono_origem = v_dono_destino then
    raise exception 'Origem e destino são a mesma pessoa.';
  end if;

  -- 2. Encontrar a coleção
  select id into v_colecao_velha
    from public.colecoes
   where dono_id = v_dono_origem
     and nome = v_nome_colecao
   order by created_at
   limit 1;

  if v_colecao_velha is null then
    raise exception 'Não achei a coleção "%" para %',
      v_nome_colecao, v_email_origem;
  end if;

  -- 3. Criar a coleção no destino.
  -- colecao_origem_id registra de onde veio, que é para isso que o
  -- campo existe.
  insert into public.colecoes (
    dono_id, nome, descricao, capa_url, categoria, ano,
    visibilidade, arquivada, colecao_origem_id
  )
  select v_dono_destino,
         coalesce(nullif(trim(v_novo_nome), ''), nome),
         descricao,
         capa_url,
         categoria,
         ano,
         visibilidade,
         false,
         v_colecao_velha
    from public.colecoes
   where id = v_colecao_velha
  returning id into v_colecao_nova;

  -- 4. Copiar as subdivisões
  insert into public.subdivisoes (colecao_id, nome, ordem)
  select v_colecao_nova, nome, ordem
    from public.subdivisoes
   where colecao_id = v_colecao_velha;

  select count(*) into v_qtd_subs
    from public.subdivisoes where colecao_id = v_colecao_nova;

  -- 5. Copiar os itens, ligando cada um à subdivisão equivalente.
  -- A ligação é feita pelo nome da subdivisão, já que os identificadores
  -- são novos.
  insert into public.itens (
    colecao_id, subdivisao_id, numero, nome,
    categoria, raridade, foto_url, observacao, ordem
  )
  select v_colecao_nova,
         nova_sub.id,
         i.numero,
         i.nome,
         i.categoria,
         i.raridade,
         i.foto_url,
         i.observacao,
         i.ordem
    from public.itens i
    left join public.subdivisoes velha_sub
           on velha_sub.id = i.subdivisao_id
    left join public.subdivisoes nova_sub
           on nova_sub.colecao_id = v_colecao_nova
          and nova_sub.nome = velha_sub.nome
   where i.colecao_id = v_colecao_velha;

  select count(*) into v_qtd_itens
    from public.itens where colecao_id = v_colecao_nova;

  -- 6. Nenhuma marcação é copiada: o catálogo chega em branco, para o
  -- destinatário marcar o que ele tem.

  raise notice 'Coleção clonada com sucesso.';
  raise notice '  destino     : %', v_email_destino;
  raise notice '  nova coleção: %', v_colecao_nova;
  raise notice '  subdivisões : %', v_qtd_subs;
  raise notice '  itens       : %', v_qtd_itens;
end $$;


-- ---------------------------------------------------------------------
-- PASSO 4 — Conferir
-- ---------------------------------------------------------------------

select u.email,
       c.nome as colecao,
       coalesce(s.nome, 'sem subdivisão') as subdivisao,
       count(i.id) as itens
  from public.colecoes c
  join public.usuarios u on u.id = c.dono_id
  left join public.itens i on i.colecao_id = c.id
  left join public.subdivisoes s on s.id = i.subdivisao_id
 where c.colecao_origem_id is not null
 group by u.email, c.nome, s.nome
 order by u.email, s.nome;


-- =====================================================================
-- VARIAÇÕES
-- =====================================================================

-- Clonar TODAS as coleções de uma pessoa: troque o passo 3 por um laço.
-- No lugar da linha que busca uma coleção só, use:
--
--   for v_colecao_velha in
--     select id from public.colecoes where dono_id = v_dono_origem
--   loop
--     ... (o restante do bloco) ...
--   end loop;


-- Desfazer o clone. Apaga TODAS as coleções que vieram de cópia deste
-- usuário. Confira a lista antes de rodar o delete.
--
--   select c.id, c.nome
--     from public.colecoes c
--     join public.usuarios u on u.id = c.dono_id
--    where u.email = 'leonan@netao.app.br'
--      and c.colecao_origem_id is not null;
--
--   delete from public.colecoes c
--    using public.usuarios u
--    where u.id = c.dono_id
--      and u.email = 'leonan@netao.app.br'
--      and c.colecao_origem_id is not null;
--
-- Subdivisões e itens vão junto, por causa do "on delete cascade".
