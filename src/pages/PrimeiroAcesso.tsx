import { useState } from 'react';
import { T, TS, RODAPE } from '../theme';
import { useAuth } from '../lib/auth';
import { ModalTermos } from '../components/ModalTermos';
import { BotaoTema } from '../components/BotaoTema';
import { TERMOS_VERSAO } from '../lib/termos';

/**
 * Aparece uma única vez, no primeiro acesso da pessoa.
 * A conta foi criada pelo administrador, então é aqui que coletamos
 * a data de nascimento e o aceite dos termos.
 */
export function PrimeiroAcesso() {
  const { perfil, completarPrimeiroAcesso, sair } = useAuth();

  const [nascimento, setNascimento] = useState('');
  const [aceitou, setAceitou] = useState(false);
  const [verTermos, setVerTermos] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const idade = calcularIdade(nascimento);
  const menorDeIdade = idade !== null && idade < 18;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (menorDeIdade) {
      return setErro('É necessário ter 18 anos ou mais para usar o aplicativo.');
    }
    if (!aceitou) {
      return setErro('É preciso aceitar os termos de uso.');
    }

    setEnviando(true);
    try {
      await completarPrimeiroAcesso(nascimento, TERMOS_VERSAO);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Algo deu errado.');
      setEnviando(false);
    }
  }

  const primeiroNome = (perfil?.nome ?? '').split(' ')[0];

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
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <BotaoTema />
      </div>

      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1
            style={{
              ...TS.titulo,
              fontSize: 22,
              color: T.neon,
              textShadow: T.glowNeon,
              margin: 0,
            }}
          >
            {primeiroNome ? `Olá, ${primeiroNome}` : 'Bem-vindo'}
          </h1>
          <p
            style={{
              fontFamily: T.fontBody,
              fontSize: 13.5,
              color: T.textSecondary,
              marginTop: 10,
              lineHeight: 1.6,
            }}
          >
            Falta pouco para começar. Só precisamos de duas informações.
          </p>
        </div>

        <form onSubmit={enviar} style={{ ...TS.card, padding: 22 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={TS.label} htmlFor="nascimento">
              Data de nascimento
            </label>
            <input
              id="nascimento"
              type="date"
              value={nascimento}
              onChange={(e) => setNascimento(e.target.value)}
              required
              max={new Date().toISOString().slice(0, 10)}
              style={{
                ...TS.input,
                colorScheme: 'dark',
                borderColor: menorDeIdade ? T.erro : T.border,
              }}
            />
            <div
              style={{
                fontSize: 11.5,
                color: menorDeIdade ? T.erro : T.textMuted,
                marginTop: 5,
                fontFamily: T.fontBody,
              }}
            >
              {menorDeIdade
                ? 'O aplicativo é permitido apenas para maiores de 18 anos.'
                : 'Necessário ter 18 anos ou mais.'}
            </div>
          </div>

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
                O aplicativo não participa das trocas nem se responsabiliza por
                elas.
              </span>
            </span>
          </label>

          {erro && (
            <div
              role="alert"
              style={{
                background: T.erroFaint,
                border: `1px solid ${T.erro}`,
                borderRadius: T.radiusSm,
                padding: '10px 12px',
                marginBottom: 12,
                fontSize: 13,
                color: T.erro,
                fontFamily: T.fontBody,
              }}
            >
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            style={{
              ...TS.botaoPrimario,
              width: '100%',
              opacity: enviando ? 0.6 : 1,
            }}
          >
            {enviando ? 'Aguarde...' : 'Começar a usar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <button
            type="button"
            onClick={() => void sair()}
            style={{
              background: 'transparent',
              border: 'none',
              color: T.textMuted,
              fontSize: 12.5,
              fontFamily: T.fontBody,
              cursor: 'pointer',
            }}
          >
            Sair
          </button>
        </div>

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

      {verTermos && <ModalTermos aoFechar={() => setVerTermos(false)} />}
    </div>
  );
}

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
