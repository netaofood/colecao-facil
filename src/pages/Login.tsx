import { useState } from 'react';
import { T, TS, RODAPE } from '../theme';
import { useAuth } from '../lib/auth';
import { InstallButton } from '../components/InstallButton';

type Modo = 'entrar' | 'cadastrar' | 'recuperar';

export function Login() {
  const { entrar, cadastrar, recuperarSenha } = useAuth();
  const [modo, setModo] = useState<Modo>('entrar');
  const [nome, setNome] = useState('');
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
      } else if (modo === 'cadastrar') {
        await cadastrar(email, senha, nome);
        setAviso('Conta criada! Verifique seu e-mail para confirmar.');
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
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Marca */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
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
          {modo === 'cadastrar' && (
            <div style={{ marginBottom: 14 }}>
              <label style={TS.label} htmlFor="nome">
                Nome
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                autoComplete="name"
                style={TS.input}
              />
            </div>
          )}

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

          {modo !== 'recuperar' && (
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
                minLength={6}
                autoComplete={
                  modo === 'cadastrar' ? 'new-password' : 'current-password'
                }
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
              marginTop: 6,
              opacity: enviando ? 0.6 : 1,
              cursor: enviando ? 'wait' : 'pointer',
            }}
          >
            {enviando
              ? 'Aguarde...'
              : modo === 'entrar'
                ? 'Entrar'
                : modo === 'cadastrar'
                  ? 'Criar conta'
                  : 'Enviar link'}
          </button>

          {/* Alternar entre os modos */}
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              alignItems: 'center',
            }}
          >
            {modo === 'entrar' && (
              <>
                <Alternar onClick={() => trocar('cadastrar')}>
                  Não tem conta? <strong>Cadastre-se</strong>
                </Alternar>
                <Alternar onClick={() => trocar('recuperar')}>
                  Esqueci minha senha
                </Alternar>
              </>
            )}
            {modo !== 'entrar' && (
              <Alternar onClick={() => trocar('entrar')}>
                Voltar para o login
              </Alternar>
            )}
          </div>

          {/* Botão de instalar PWA (padrão da casa) */}
          <div style={{ marginTop: 16, width: '100%' }}>
            <InstallButton variant="full" />
          </div>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: 22,
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

  function trocar(novo: Modo) {
    setModo(novo);
    setErro(null);
    setAviso(null);
  }
}

function Alternar({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
      {children}
    </button>
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
