-- =====================================================================
-- CLONAR AS MARCAÇÕES (tenho / falta / repetida)
--
-- Copia o progresso de um colecionador para as coleções que já foram
-- clonadas para outro. Rode DEPOIS do clonar-colecao.sql.
--
-- Os itens da cópia têm identificadores novos, então a ligação é feita
-- pelo número do item — e, quando o número está vazio, pelo nome.
-- =====================================================================


-- ---------------------------------------------------------------------
-- PASSO 1 — Conferir o que será copiado
-- ---------------------------------------------------------------------

with origem as (
  select id from public.usuarios where lower(email) = lower('netaosushibar@gmail.com')
),
destino as (
  select id from public.usuarios where lower(email) = lower('leonan@netao.app.br')
),
pares as (
  select nova.nome as colecao,
         velho.id   as item_velho,
         novo.id    as item_novo
    from public.colecoes nova
    join destino on destino.id = nova.dono_id
    join public.colecoes velha on velha.id = nova.colecao_origem_id
    join public.itens velho on velho.colecao_id = velha.id
    join public.itens novo
      on novo.colecao_id = nova.id
     and (
          (velho.numero is not null and novo.numero = velho.numero)
       or (velho.numero is null and novo.numero is null and novo.nome = velho.nome)
     )
)
select p.colecao,
       iu.status,
       count(*) as itens
  from pares p
  join origem on true
  join public.itens_usuario iu
    on iu.item_id = p.item_velho
   and iu.usuario_id = origem.id
 group by p.colecao, iu.status
 order by p.colecao, iu.status;


-- ---------------------------------------------------------------------
-- PASSO 2 — Copiar
--
-- Pode rodar mais de uma vez: marcação já existente é atualizada,
-- não duplicada.
-- ---------------------------------------------------------------------

do $$
declare
  -- >>> AJUSTE AQUI <<<
  v_email_origem  text := 'netaosushibar@gmail.com';
  v_email_destino text := 'leonan@netao.app.br';

  v_origem  uuid;
  v_destino uuid;
  v_copiadas integer;
begin
  select id into v_origem
    from public.usuarios where lower(email) = lower(v_email_origem);
  select id into v_destino
    from public.usuarios where lower(email) = lower(v_email_destino);

  if v_origem is null or v_destino is null then
    raise exception 'Usuário de origem ou destino não encontrado.';
  end if;

  insert into public.itens_usuario (
    usuario_id, item_id, status, quantidade_repetida
  )
  select v_destino,
         novo.id,
         iu.status,
         iu.quantidade_repetida
    from public.colecoes nova
    join public.colecoes velha on velha.id = nova.colecao_origem_id
    join public.itens velho on velho.colecao_id = velha.id
    join public.itens novo
      on novo.colecao_id = nova.id
     and (
          (velho.numero is not null and novo.numero = velho.numero)
       or (velho.numero is null and novo.numero is null and novo.nome = velho.nome)
     )
    join public.itens_usuario iu
      on iu.item_id = velho.id
     and iu.usuario_id = v_origem
   where nova.dono_id = v_destino
     and iu.status <> 'falta'
  on conflict (usuario_id, item_id) do update
    set status = excluded.status,
        quantidade_repetida = excluded.quantidade_repetida,
        updated_at = now();

  get diagnostics v_copiadas = row_count;

  raise notice 'Marcações copiadas: %', v_copiadas;
end $$;


-- ---------------------------------------------------------------------
-- PASSO 3 — Comparar os dois lados
-- Os números de cada coleção devem bater entre origem e destino.
-- ---------------------------------------------------------------------

select u.email,
       c.nome as colecao,
       count(i.id) as total_itens,
       count(iu.id) filter (where iu.status <> 'falta') as tenho,
       count(iu.id) filter (where iu.status = 'repetida') as repetidas
  from public.colecoes c
  join public.usuarios u on u.id = c.dono_id
  left join public.itens i on i.colecao_id = c.id
  left join public.itens_usuario iu
         on iu.item_id = i.id and iu.usuario_id = c.dono_id
 where lower(u.email) in ('netaosushibar@gmail.com', 'leonan@netao.app.br')
 group by u.email, c.nome
 order by c.nome, u.email;


-- =====================================================================
-- DESFAZER
-- Apaga só as marcações do destino nas coleções clonadas.
-- =====================================================================

--   delete from public.itens_usuario iu
--    using public.itens i, public.colecoes c, public.usuarios u
--    where iu.item_id = i.id
--      and i.colecao_id = c.id
--      and c.dono_id = u.id
--      and u.email = 'leonan@netao.app.br'
--      and c.colecao_origem_id is not null
--      and iu.usuario_id = u.id;
