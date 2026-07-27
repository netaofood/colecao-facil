import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, X as XIcon } from 'lucide-react';
import { T, TS, RODAPE } from '../theme';
import { useAuth } from '../lib/auth';
import { InstallButton } from '../components/InstallButton';
import { ModalTermos } from '../components/ModalTermos';
import { TERMOS_VERSAO } from '../lib/termos';
import { BotaoTema } from '../components/BotaoTema';
import { BotaoAjuda } from '../components/BotaoAjuda';

type Modo = 'entrar' | 'cadastrar' | 'recuperar';

export function Login() {
  const { entrar, cadastrar, recuperarSenha, validarConvite } = useAuth();
  const [params] = useSearchParams();

  const [modo, setModo] = useState<Modo>(
    params.get('convite') ? 'cadastrar' : 'entrar'
  );
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [convite, setConvite] = useState(params.get('convite')?.toUpperCase() ?? '');
  const [nascimento, setNascimento] = useState('');
  const [aceitou, setAceitou] = useState(false);

  const [conviteOk, setConviteOk] = useState<boolean | null>(null);
  const [verTermos, setVerTermos] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Confere o convite conforme o usuário digita (com respiro de 500ms)
  useEffect(() => {
    if (modo !== 'cadastrar') return;
    const codigo = convite.trim();
    if (codigo.length < 4) {
      setConviteOk(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setConviteOk(await validarConvite(codigo));
      } catch {
        setConviteOk(null);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [convite, modo, validarConvite]);

  const idade = calcularIdade(nascimento);
  const menorDeIdade = idade !== null && idade < 18;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);

    if (modo === 'cadastrar') {
      if (!aceitou) return setErro('É preciso aceitar os termos de uso.');
      if (menorDeIdade)
        return setErro('É necessário ter 18 anos ou mais para se cadastrar.');
    }

    setEnviando(true);
    try {
      if (modo === 'entrar') {
        await entrar(email, senha);
      } else if (modo === 'cadastrar') {
        await cadastrar({
          nome,
          email,
          senha,
          convite,
          nascimento,
          termosVersao: TERMOS_VERSAO,
        });
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

  function trocar(novo: Modo) {
    setModo(novo);
    setErro(null);
    setAviso(null);
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

      <div style={{ width: '100%', maxWidth: 400 }}>
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
          {modo === 'cadastrar' && (
            <>
              <Campo rotulo="Código do convite" id="convite">
                <div style={{ position: 'relative' }}>
                  <input
                    id="convite"
                    value={convite}
                    onChange={(e) => setConvite(e.target.value.toUpperCase())}
                    required
                    placeholder="ex: ABCD-2345"
                    style={{
                      ...TS.input,
                      paddingRight: 38,
                      letterSpacing: 1,
                      borderColor:
                        conviteOk === true
                          ? T.tenho
                          : conviteOk === false
                            ? T.erro
                            : T.border,
                    }}
                  />
                  {conviteOk !== null && (
                    <span
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                      }}
                    >
                      {conviteOk ? (
                        <Check size={17} color={T.tenho} />
                      ) : (
                        <XIcon size={17} color={T.erro} />
                      )}
                    </span>
                  )}
                </div>
                {conviteOk === false && (
                  <Dica cor={T.erro}>Convite inválido, já usado ou vencido.</Dica>
                )}
              </Campo>

              <Campo rotulo="Nome" id="nome">
                <input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  autoComplete="name"
                  style={TS.input}
                />
              </Campo>
            </>
          )}

          <Campo rotulo="E-mail" id="email">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={TS.input}
            />
          </Campo>

          {modo !== 'recuperar' && (
            <Campo rotulo="Senha" id="senha">
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
            </Campo>
          )}

          {modo === 'cadastrar' && (
            <>
              <Campo rotulo="Data de nascimento" id="nascimento">
                <input
                  id="nascimento"
                  type="date"
                  value={nascimento}
                  onChange={(e) => setNascimento(e.target.value)}
                  required
                  max={hojeISO()}
                  style={{
                    ...TS.input,
                    colorScheme: 'dark',
                    borderColor: menorDeIdade ? T.erro : T.border,
                  }}
                />
                {menorDeIdade ? (
                  <Dica cor={T.erro}>
                    O cadastro é permitido apenas para maiores de 18 anos.
                  </Dica>
                ) : (
                  <Dica cor={T.textMuted}>Necessário ter 18 anos ou mais.</Dica>
                )}
              </Campo>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '12px 14px',
                  background: T.bgElevated,
                  border: `1px solid ${aceitou ? T.neonBorder : T.border}`,
                  borderRadius: T.radiusSm,
                  marginBottom: 16,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={aceitou}
                  onChange={(e) => setAceitou(e.target.checked)}
                  style={{
                    marginTop: 2,
                    accentColor: T.neon,
                    width: 16,
                    height: 16,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: T.fontBody,
                    fontSize: 13,
                    color: T.textSecondary,
                    lineHeight: 1.55,
                  }}
                >
                  Li e aceito os{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setVerTermos(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: T.neon,
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0,
                      font: 'inherit',
                    }}
                  >
                    termos de uso
                  </button>
                  .
                  <br />
                  <span style={{ color: T.textMuted, fontSize: 12 }}>
                    O aplicativo não participa das trocas nem se responsabiliza
                    por elas.
                  </span>
                </span>
              </label>
            </>
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
                : modo === 'cadastrar'
                  ? 'Criar conta'
                  : 'Enviar link'}
          </button>

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
                  Tem um convite? <strong>Criar conta</strong>
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

      {verTermos && <ModalTermos aoFechar={() => setVerTermos(false)} />}
    </div>
  );
}

/* -------------------------------------------------------------- */

function calcularIdade(iso: string): number | null {
  if (!iso) return null;
  const n = new Date(iso);
  if (Number.isNaN(n.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - n.getFullYear();
  const m = hoje.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) idade--;
  return idade;
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function Campo({
  rotulo,
  id,
  children,
}: {
  rotulo: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={TS.label} htmlFor={id}>
        {rotulo}
      </label>
      {children}
    </div>
  );
}

function Dica({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11.5,
        color: cor,
        marginTop: 5,
        fontFamily: T.fontBody,
      }}
    >
      {children}
    </div>
  );
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
