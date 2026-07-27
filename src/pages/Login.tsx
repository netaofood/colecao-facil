import { useState } from 'react';
import { T, TS, RODAPE } from '../theme';
import { useAuth } from '../lib/auth';
import { InstallButton } from '../components/InstallButton';
import { BotaoTema } from '../components/BotaoTema';
import { BotaoAjuda } from '../components/BotaoAjuda';

type Modo = 'entrar' | 'recuperar';

export function Login() {
  const { entrar, recuperarSenha } = useAuth();

  const [modo, setModo] = useState<Modo>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    setEnviando(true);
    try {
      if (modo === 'entrar') {
        await entrar(email, senha);
      } else {
        await recuperarSenha(email);
        setAviso('Enviamos um link de recuperação para seu e-mail.');
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Algo deu errado.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          gap: 7,
        }}
      >
        <BotaoTema />
        <BotaoAjuda />
      </div>

      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <h1
            style={{
              ...TS.titulo,
              fontSize: 26,
              color: T.neon,
              textShadow: T.glowNeon,
              margin: 0,
            }}
          >
            COLEÇÃO FÁCIL
          </h1>
          <p
            style={{
              fontFamily: T.fontBody,
              fontSize: 13,
              color: T.textSecondary,
              marginTop: 8,
            }}
          >
            Organize suas coleções e ache suas trocas.
          </p>
        </div>

        <form onSubmit={enviar} style={{ ...TS.card, padding: 22 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={TS.label} htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={TS.input}
            />
          </div>

          {modo === 'entrar' && (
            <div style={{ marginBottom: 14 }}>
              <label style={TS.label} htmlFor="senha">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="current-password"
                style={TS.input}
              />
            </div>
          )}

          {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
          {aviso && <Mensagem tipo="sucesso">{aviso}</Mensagem>}

          <button
            type="submit"
            disabled={enviando}
            style={{
              ...TS.botaoPrimario,
              width: '100%',
              marginTop: 4,
              opacity: enviando ? 0.6 : 1,
              cursor: enviando ? 'wait' : 'pointer',
            }}
          >
            {enviando
              ? 'Aguarde...'
              : modo === 'entrar'
                ? 'Entrar'
                : 'Enviar link'}
          </button>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setModo(modo === 'entrar' ? 'recuperar' : 'entrar');
                setErro(null);
                setAviso(null);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: T.textSecondary,
                fontSize: 13,
                fontFamily: T.fontBody,
                cursor: 'pointer',
                padding: 2,
              }}
            >
              {modo === 'entrar'
                ? 'Esqueci minha senha'
                : 'Voltar para o login'}
            </button>
          </div>

          <div style={{ marginTop: 16, width: '100%' }}>
            <InstallButton variant="full" />
          </div>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: 18,
            fontFamily: T.fontBody,
            fontSize: 12,
            color: T.textMuted,
            lineHeight: 1.6,
          }}
        >
          As contas são criadas pelo administrador.
          <br />
          Se você ainda não tem acesso, fale com quem te indicou.
        </p>

        <p
          style={{
            textAlign: 'center',
            marginTop: 20,
            fontFamily: T.fontBody,
            fontSize: 11.5,
            color: T.textMuted,
          }}
        >
          <strong style={{ color: T.textSecondary }}>{RODAPE.site}</strong>
          {' · '}
          {RODAPE.slogan}
        </p>
      </div>
    </div>
  );
}

function Mensagem({
  tipo,
  children,
}: {
  tipo: 'erro' | 'sucesso';
  children: React.ReactNode;
}) {
  const cor = tipo === 'erro' ? T.erro : T.sucesso;
  const fundo = tipo === 'erro' ? T.erroFaint : T.tenhoFaint;
  return (
    <div
      role="alert"
      style={{
        background: fundo,
        border: `1px solid ${cor}`,
        borderRadius: T.radiusSm,
        padding: '10px 12px',
        marginBottom: 12,
        fontSize: 13,
        color: cor,
        fontFamily: T.fontBody,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}
