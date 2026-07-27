# Coleção Fácil

Organize suas coleções, controle o que falta e ache suas trocas.

Parte do **Netão Apps** · `netao.app.br`

---

## Stack

| Camada | Ferramenta |
|---|---|
| Front-end | React 19 + TypeScript + Vite |
| Rotas | react-router-dom |
| Banco / Auth / Storage | Supabase |
| Deploy | Vercel |
| Ícones | lucide-react |

## Rodando localmente

```bash
npm install
cp .env.example .env    # preencha com os dados do Supabase
npm run dev
```

## Variáveis de ambiente

Ficam em `.env` (nunca versionado) e nas Environment Variables da Vercel:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

> A chave `service_role` **não entra neste repositório** em hipótese alguma.
> Ela ignora toda a RLS. A proteção real dos dados é a RLS definida nas migrations.

## Banco de dados

As migrations ficam em `supabase/`, na ordem:

- `0000_reset.sql` — derruba tudo. Só para recriar do zero.
- `0001_init.sql` — schema completo: tipos, tabelas, índices, RLS, triggers e storage.

Rode pelo SQL Editor do painel do Supabase.

### Perfis de acesso

| Perfil | Quem é |
|---|---|
| `super_admin` | Definido por e-mail no trigger de signup. Publica coleções oficiais e modera. |
| `colecionador` | Todo o resto. Dono das próprias coleções. |

## Estrutura

```
src/
├── components/     Layout responsivo e componentes padrão da casa
├── hooks/          useDispositivo (breakpoint), useInstallPrompt (PWA)
├── lib/            supabase, auth, mensagens (templates de WhatsApp)
├── pages/          Telas
└── theme.ts        Design tokens (T, TS)
```

### Layout responsivo

Um único breakpoint em **1024px**, definido em `theme.ts` e lido por `useDispositivo`.
O componente `Layout` decide sozinho o que renderizar:

- **Desktop** — menu lateral fixo, colapsável
- **Celular** — bottom navigation com 5 destinos

Nada de tela duplicada.

## Status de implementação

| Item do plano | Status |
|---|---|
| 1. Identidade e base | ✅ |
| 2. Layout responsivo | ✅ |
| 3. Botões WhatsApp e copiar link | ✅ |
| 4. Perfis de acesso | ✅ |
| 5. Autenticação, perfil e convites | ✅ |
| 6. Coleções | ✅ |
| 7. Catálogo de itens | ✅ |
| 8. Minha coleção (tenho/falta/repetida) | ✅ |
| 9. Trocas | ✅ |
| 10. Perfil público e descoberta | ✅ |
| 11. Painel Super Admin | ✅ |
| 12. Relatórios | ✅ |
| 13. Infra | ✅ |

## Migrations

Rodar em ordem no SQL Editor do Supabase:

- `0000_reset.sql` — derruba tudo. Só para recriar do zero.
- `0001_init.sql` — schema completo.
- `0002_convites_termos_privacidade.sql` — convites, idade mínima, termos, perfil público.

## Rotas públicas

`/u/{apelido}` — página pública do colecionador, acessível sem login.
Só aparece se o colecionador tiver ligado "Aparecer nas buscas" no perfil.

## Pendências conhecidas

- Termos de uso em `src/lib/termos.ts` são **rascunho** e precisam de revisão jurídica.
- Domínio `colecao.netao.app.br` a apontar na Vercel.
- Nada foi testado contra o banco de produção: build e tipos passam, mas
  gravação, leitura e RLS estreiam no primeiro uso real.
