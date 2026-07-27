-- =====================================================================
-- COLEÇÃO FÁCIL — 0000_reset.sql
-- Apaga TUDO do schema public e recomeça do zero.
-- Rode este arquivo APENAS se quiser recriar o banco inteiro.
-- NÃO apaga os usuários do auth.users (isso se faz pelo painel).
-- =====================================================================

-- Remove o trigger de signup antes de derrubar as funções
drop trigger if exists on_auth_user_created on auth.users;

-- Tabelas (ordem inversa das dependências)
drop table if exists public.trocas_itens cascade;
drop table if exists public.trocas cascade;
drop table if exists public.itens_usuario cascade;
drop table if exists public.colecoes_usuario cascade;
drop table if exists public.itens cascade;
drop table if exists public.subdivisoes cascade;
drop table if exists public.colecoes cascade;
drop table if exists public.usuarios cascade;

-- Funções
drop function if exists public.is_super_admin() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;

-- Tipos
drop type if exists public.papel_usuario cascade;
drop type if exists public.visibilidade_colecao cascade;
drop type if exists public.status_item cascade;
drop type if exists public.status_troca cascade;
drop type if exists public.direcao_item_troca cascade;

-- Bucket de imagens
delete from storage.objects where bucket_id = 'colecao-imagens';
delete from storage.buckets where id = 'colecao-imagens';
