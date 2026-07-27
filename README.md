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

### Escopo

O app é de organização pessoal. Cada colecionador é dono das próprias
coleções; não existe adoção, catálogo compartilhado nem perfil público.

O compartilhamento acontece só pelos botões de WhatsApp e copiar.

### Perfis de acesso

| Perfil | Quem é |
|---|---|
| `super_admin` | Definido por e-mail no trigger de signup. Publica coleções oficiais e modera. |
| `colecionador` | Todo o resto. Dono das próprias coleções. |

> As tabelas `colecoes_usuario`, `trocas` e `trocas_itens` continuam no banco,
> mas não são mais usadas pelo app. Ficaram para não exigir migration de
> remoção; podem ser derrubadas quando não houver dúvida sobre o rumo.

## Estrutura

```
src/
├── components/     Layout responsivo e componentes padrão da casa
├── hooks/          useDispositivo (breakpoint), useInstallPrompt (PWA)
├── lib/            supabase, auth, mensagens (templates de WhatsApp)
├── pages/          Telas
└── theme.ts        Design tokens (T, TS)
```

### Manual

O ícone **?** ao lado do botão de tema abre a ajuda **da tela em que o usuário está**.
A rota decide o texto (`src/lib/ajuda.ts`), e rota sem texto próprio cai no manual do início.

Para editar o manual, mexa só em `src/lib/ajuda.ts`. Nenhuma tela precisa ser tocada.
Formatação aceita: `## título`, `- lista`, `**negrito**`.

### Temas

Claro e escuro, com as cores em variáveis CSS (`src/index.css`).
O `theme.ts` só aponta para elas, então trocar de tema não re-renderiza nada.

A escolha fica no `localStorage`; sem escolha salva, segue a preferência do sistema.
Um script inline no `index.html` aplica o tema antes da primeira pintura, para não piscar.

No claro o azul escurece de `#00B4FF` para `#0074CC`, senão o contraste sobre branco fica ilegível.

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
| 9. Trocas (lista para compartilhar) | ✅ |
| 11. Painel Super Admin | ✅ |
| 12. Relatórios | ✅ |
| 13. Infra | ✅ |

## Migrations

Rodar em ordem no SQL Editor do Supabase:

- `0000_reset.sql` — derruba tudo. Só para recriar do zero.
- `0001_init.sql` — schema completo.
- `0002_convites_termos_privacidade.sql` — idade mínima, termos, perfil público.
- `0003_cadastro_pelo_admin.sql` — cadastro só pelo super admin, aceite no primeiro acesso.

> **Depois do 0003:** desligue o autocadastro em Supabase → Authentication →
> Sign In / Providers → Email → desmarcar "Allow new users to sign up".
> Sem isso, qualquer pessoa ainda cria conta pela API.

## Edge Functions

`supabase/functions/criar-colecionador` cria as contas. Existe porque isso exige
a chave `service_role`, que **não pode ficar no navegador**.

```bash
supabase link --project-ref cezdpszraznufpotucgr
supabase functions deploy criar-colecionador
```

## Pendências conhecidas

- Termos de uso em `src/lib/termos.ts` são **rascunho** e precisam de revisão jurídica.
- Domínio `colecao.netao.app.br` a apontar na Vercel.
- Nada foi testado contra o banco de produção: build e tipos passam, mas
  gravação, leitura e RLS estreiam no primeiro uso real.
