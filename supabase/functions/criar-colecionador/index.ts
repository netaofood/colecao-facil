// =====================================================================
// Edge Function: criar-colecionador
//
// Cria a conta de um colecionador. Só o super admin consegue chamar.
//
// A chave service_role fica AQUI, no servidor, e nunca no navegador.
// Ela ignora toda a RLS — por isso a primeira coisa que a função faz é
// conferir quem está chamando.
//
// Publicar:
//   supabase functions deploy criar-colecionador
//
// As variáveis SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY
// já vêm preenchidas pelo próprio Supabase.
// =====================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function responder(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

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

  // ---- 2. É super admin? ----
  const { data: quem } = await comoUsuario
    .from('usuarios')
    .select('papel, ativo')
    .eq('id', sessao.user.id)
    .maybeSingle();

  if (quem?.papel !== 'super_admin' || quem?.ativo !== true) {
    return responder({ erro: 'Apenas o administrador pode criar contas.' }, 403);
  }

  // ---- 3. Dados recebidos ----
  let corpo: { email?: string; senha?: string; nome?: string };
  try {
    corpo = await req.json();
  } catch {
    return responder({ erro: 'Corpo inválido.' }, 400);
  }

  const email = (corpo.email ?? '').trim().toLowerCase();
  const senha = corpo.senha ?? '';
  const nome = (corpo.nome ?? '').trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return responder({ erro: 'E-mail inválido.' }, 400);
  }
  if (senha.length < 8) {
    return responder({ erro: 'A senha precisa ter pelo menos 8 caracteres.' }, 400);
  }

  // ---- 4. Cria a conta ----
  const comoAdmin = createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await comoAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true, // conta já nasce liberada
    user_metadata: { nome },
  });

  if (error) {
    const jaExiste =
      error.message.toLowerCase().includes('already') ||
      error.message.toLowerCase().includes('registered');
    return responder(
      { erro: jaExiste ? 'Já existe uma conta com este e-mail.' : error.message },
      jaExiste ? 409 : 400
    );
  }

  return responder({ id: data.user?.id, email: data.user?.email }, 201);
});
