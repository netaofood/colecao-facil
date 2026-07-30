// =====================================================================
// Edge Function: editar-colecionador
//
// Altera e-mail e senha de um colecionador. Só o super admin consegue.
//
// Existe porque e-mail e senha vivem em auth.users, e mexer lá exige a
// chave service_role — que ignora toda a RLS e NÃO pode ficar no
// navegador. Aqui ela vive no servidor do Supabase.
//
// Nome da função no painel: editar-colecionador
// =====================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// O navegador faz uma verificação prévia (OPTIONS) antes do POST e recusa
// a chamada se algum cabeçalho enviado não estiver listado aqui.
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

function responder(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

const SUPER_ADMIN = 'netaosushibar@gmail.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return responder({ erro: 'Método não aceito.' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // ---- 1. Quem está chamando? ----
  const autorizacao = req.headers.get('Authorization') ?? '';
  if (!autorizacao.startsWith('Bearer ')) {
    return responder({ erro: 'Não autenticado.' }, 401);
  }

  const comoUsuario = createClient(url, anon, {
    global: { headers: { Authorization: autorizacao } },
  });

  const { data: sessao } = await comoUsuario.auth.getUser();
  if (!sessao?.user) return responder({ erro: 'Não autenticado.' }, 401);

  const { data: quem } = await comoUsuario
    .from('usuarios')
    .select('papel, ativo')
    .eq('id', sessao.user.id)
    .maybeSingle();

  if (quem?.papel !== 'super_admin' || quem?.ativo !== true) {
    return responder({ erro: 'Apenas o administrador pode fazer isso.' }, 403);
  }

  // ---- 2. Dados recebidos ----
  let corpo: { id?: string; email?: string; senha?: string };
  try {
    corpo = await req.json();
  } catch {
    return responder({ erro: 'Corpo inválido.' }, 400);
  }

  const id = (corpo.id ?? '').trim();
  const email = corpo.email?.trim().toLowerCase();
  const senha = corpo.senha;

  if (!id) return responder({ erro: 'Colecionador não informado.' }, 400);
  if (!email && !senha) {
    return responder({ erro: 'Nada para alterar.' }, 400);
  }

  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return responder({ erro: 'E-mail inválido.' }, 400);
  }
  if (senha !== undefined && senha.length < 8) {
    return responder({ erro: 'A senha precisa ter pelo menos 8 caracteres.' }, 400);
  }

  const comoAdmin = createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ---- 3. Proteções ----
  const { data: alvo, error: erroAlvo } = await comoAdmin
    .from('usuarios')
    .select('email, papel')
    .eq('id', id)
    .maybeSingle();

  if (erroAlvo) return responder({ erro: erroAlvo.message }, 400);
  if (!alvo) return responder({ erro: 'Colecionador não encontrado.' }, 404);

  // O e-mail do super admin é a chave da regra no banco: mudar tranca
  // o administrador fora da própria conta.
  if (email && alvo.email.toLowerCase() === SUPER_ADMIN) {
    return responder(
      { erro: 'O e-mail do administrador não pode ser alterado por aqui.' },
      403
    );
  }

  // Trocar para o e-mail do super admin daria papel de admin a outra conta
  if (email === SUPER_ADMIN) {
    return responder({ erro: 'Este e-mail é reservado.' }, 403);
  }

  // ---- 4. Altera no auth ----
  const mudancas: { email?: string; password?: string; email_confirm?: boolean } = {};
  if (email) {
    mudancas.email = email;
    mudancas.email_confirm = true; // já nasce confirmado, sem e-mail de aviso
  }
  if (senha) mudancas.password = senha;

  const { error } = await comoAdmin.auth.admin.updateUserById(id, mudancas);

  if (error) {
    const jaExiste = /already|registered|duplicate/i.test(error.message);
    return responder(
      { erro: jaExiste ? 'Já existe uma conta com este e-mail.' : error.message },
      jaExiste ? 409 : 400
    );
  }

  // ---- 5. Mantém a tabela usuarios em sincronia ----
  if (email) {
    const { error: erroPerfil } = await comoAdmin
      .from('usuarios')
      .update({ email })
      .eq('id', id);

    if (erroPerfil) {
      return responder(
        {
          erro:
            'O e-mail de acesso mudou, mas o cadastro não foi atualizado: ' +
            erroPerfil.message,
        },
        500
      );
    }
  }

  return responder({ ok: true, email: email ?? alvo.email }, 200);
});
