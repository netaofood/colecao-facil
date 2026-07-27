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
  perfil_publico: boolean;
  nascimento: string | null;
  termos_aceitos_em: string | null;
  termos_versao: string | null;
}

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
  convite: string;
  /** ISO: aaaa-mm-dd */
  nascimento: string;
  termosVersao: string;
}

interface AuthContextValue {
  session: Session | null;
  perfil: Perfil | null;
  carregando: boolean;
  ehSuperAdmin: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (dados: DadosCadastro) => Promise<void>;
  validarConvite: (codigo: string) => Promise<boolean>;
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

    async cadastrar(dados) {
      const { error } = await supabase.auth.signUp({
        email: dados.email.trim().toLowerCase(),
        password: dados.senha,
        options: {
          data: {
            nome: dados.nome.trim(),
            convite: dados.convite.trim().toUpperCase(),
            nascimento: dados.nascimento,
            termos_aceitos: 'true',
            termos_versao: dados.termosVersao,
          },
        },
      });
      if (error) throw new Error(traduzErro(error.message));
    },

    async validarConvite(codigo) {
      const { data, error } = await supabase.rpc('convite_valido', {
        p_codigo: codigo.trim().toUpperCase(),
      });
      if (error) throw new Error(traduzErro(error.message));
      return data === true;
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
    ['CONVITE_OBRIGATORIO', 'O cadastro é feito por convite. Peça um código a quem te indicou.'],
    ['CONVITE_INVALIDO', 'Convite inexistente, já usado ou vencido.'],
    ['CONVITE_OUTRO_EMAIL', 'Este convite foi enviado para outro e-mail.'],
    ['NASCIMENTO_OBRIGATORIO', 'Informe sua data de nascimento.'],
    ['IDADE_MINIMA', 'É necessário ter 18 anos ou mais para se cadastrar.'],
    ['TERMOS_NAO_ACEITOS', 'É preciso aceitar os termos de uso.'],
  ];
  for (const [chave, texto] of doBanco) {
    if (msg.includes(chave)) return texto;
  }
  return msg;
}
