import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type Papel = 'super_admin' | 'colecionador';

export interface Perfil {
  id: string;
  email: string;
  nome: string | null;
  apelido: string | null;
  cidade: string | null;
  estado: string | null;
  whatsapp: string | null;
  whatsapp_publico: boolean;
  foto_url: string | null;
  papel: Papel;
  ativo: boolean;
  nascimento: string | null;
  termos_aceitos_em: string | null;
  termos_versao: string | null;
  primeiro_acesso_em: string | null;
}

export interface NovaConta {
  nome: string;
  email: string;
  senha: string;
}

interface AuthContextValue {
  session: Session | null;
  perfil: Perfil | null;
  carregando: boolean;
  ehSuperAdmin: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  criarColecionador: (dados: NovaConta) => Promise<void>;
  completarPrimeiroAcesso: (nascimento: string, termosVersao: string) => Promise<void>;
  recuperarSenha: (email: string) => Promise<void>;
  sair: () => Promise<void>;
  recarregarPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function buscarPerfil(userId: string) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar perfil:', error.message);
      setPerfil(null);
      return;
    }
    setPerfil(data as Perfil | null);
  }

  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!ativo) return;
      setSession(data.session);
      if (data.session?.user) await buscarPerfil(data.session.user.id);
      if (ativo) setCarregando(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_evento, novaSessao) => {
        if (!ativo) return;
        setSession(novaSessao);
        if (novaSessao?.user) {
          await buscarPerfil(novaSessao.user.id);
        } else {
          setPerfil(null);
        }
        setCarregando(false);
      }
    );

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const valor: AuthContextValue = {
    session,
    perfil,
    carregando,
    ehSuperAdmin: perfil?.papel === 'super_admin',

    async entrar(email, senha) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha,
      });
      if (error) throw new Error(traduzErro(error.message));
    },

    async criarColecionador(dados) {
      // Chamada direta, sem functions.invoke: assim eu leio o status e o
      // corpo da resposta sem depender do formato de erro do SDK.
      const { data: sessao } = await supabase.auth.getSession();
      const token = sessao.session?.access_token;
      if (!token) throw new Error('Sessão expirada. Entre novamente.');

      const base = import.meta.env.VITE_SUPABASE_URL;

      let resposta: Response;
      try {
        // Só os dois cabeçalhos que a função autoriza na verificação prévia.
        // Mandar qualquer outro faz o navegador barrar antes de sair.
        resposta = await fetch(`${base}/functions/v1/criar-colecionador`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome: dados.nome.trim(),
            email: dados.email.trim().toLowerCase(),
            senha: dados.senha,
          }),
        });
      } catch {
        throw new Error(
          'Não consegui alcançar a função criar-colecionador. Verifique se ela foi publicada.'
        );
      }

      const bruto = await resposta.text();
      let corpo: { erro?: string; id?: string } = {};
      try {
        corpo = JSON.parse(bruto);
      } catch {
        corpo = {};
      }

      if (!resposta.ok) {
        throw new Error(
          corpo.erro ||
            `A função respondeu ${resposta.status}. ${bruto.slice(0, 200)}`
        );
      }
    },

    async completarPrimeiroAcesso(nascimento, termosVersao) {
      if (!session?.user) throw new Error('Sessão expirada.');

      const { error } = await supabase
        .from('usuarios')
        .update({
          nascimento,
          termos_aceitos_em: new Date().toISOString(),
          termos_versao: termosVersao,
          primeiro_acesso_em: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (error) throw new Error(traduzErro(error.message));
      await buscarPerfil(session.user.id);
    },

    async recuperarSenha(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/nova-senha` }
      );
      if (error) throw new Error(traduzErro(error.message));
    },

    async sair() {
      await supabase.auth.signOut();
      setPerfil(null);
    },

    async recarregarPerfil() {
      if (session?.user) await buscarPerfil(session.user.id);
    },
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}

/** Mensagens do Supabase em português. */
function traduzErro(msg: string): string {
  const mapa: Record<string, string> = {
    'Invalid login credentials': 'E-mail ou senha incorretos.',
    'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
    'User already registered': 'Este e-mail já está cadastrado.',
    'Password should be at least 6 characters':
      'A senha precisa ter pelo menos 6 caracteres.',
    'Unable to validate email address: invalid format':
      'E-mail em formato inválido.',
    'For security purposes, you can only request this after 60 seconds.':
      'Aguarde um minuto antes de tentar de novo.',
  };
  if (mapa[msg]) return mapa[msg];

  // Erros levantados pelo trigger handle_new_user (migration 0002)
  const doBanco: [string, string][] = [
    ['NASCIMENTO_OBRIGATORIO', 'Informe sua data de nascimento.'],
    ['IDADE_MINIMA', 'É necessário ter 18 anos ou mais para se cadastrar.'],
    ['TERMOS_NAO_ACEITOS', 'É preciso aceitar os termos de uso.'],
  ];
  for (const [chave, texto] of doBanco) {
    if (msg.includes(chave)) return texto;
  }
  return msg;
}
