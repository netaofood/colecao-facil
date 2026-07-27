import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle, X } from 'lucide-react';
import { T, TS } from '../theme';
import { ajudaDaRota } from '../lib/ajuda';

export function BotaoAjuda() {
  const [aberto, setAberto] = useState(false);
  const { pathname } = useLocation();
  const ajuda = ajudaDaRota(pathname);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Ajuda desta tela"
        title="Ajuda desta tela"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 8,
          background: 'transparent',
          border: `1px solid ${T.border}`,
          borderRadius: T.radiusSm,
          color: T.textSecondary,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <HelpCircle size={17} />
      </button>

      {aberto && <JanelaAjuda ajuda={ajuda} aoFechar={() => setAberto(false)} />}
    </>
  );
}

function JanelaAjuda({
  ajuda,
  aoFechar,
}: {
  ajuda: ReturnType<typeof ajudaDaRota>;
  aoFechar: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ajuda.titulo}
      onClick={aoFechar}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 120,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: T.radiusLg,
          width: '100%',
          maxWidth: 470,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '15px 18px',
            borderBottom: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <HelpCircle size={18} color={T.neon} style={{ flexShrink: 0 }} />
          <span style={{ ...TS.titulo, fontSize: 14.5, flex: 1, minWidth: 0 }}>
            {ajuda.titulo}
          </span>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            style={{
              background: 'transparent',
              border: 'none',
              color: T.textMuted,
              cursor: 'pointer',
              display: 'flex',
              padding: 3,
            }}
          >
            <X size={19} />
          </button>
        </div>

        <div
          style={{
            padding: '16px 18px 20px',
            overflowY: 'auto',
            fontFamily: T.fontBody,
            fontSize: 13.5,
            lineHeight: 1.65,
            color: T.textSecondary,
          }}
        >
          <Texto conteudo={ajuda.texto} />
        </div>
      </div>
    </div>
  );
}

/** Formatação mínima: ## título, - lista, **negrito**. */
function Texto({ conteudo }: { conteudo: string }) {
  const linhas = conteudo.trim().split('\n');

  return (
    <>
      {linhas.map((linha, i) => {
        const l = linha.trim();
        if (!l) return <div key={i} style={{ height: 7 }} />;

        if (l.startsWith('## ')) {
          return (
            <h3
              key={i}
              style={{
                ...TS.titulo,
                fontSize: 13,
                color: T.neon,
                margin: i === 0 ? '0 0 8px' : '18px 0 7px',
                letterSpacing: 0.3,
              }}
            >
              {l.slice(3)}
            </h3>
          );
        }

        if (l.startsWith('- ')) {
          return (
            <li key={i} style={{ marginLeft: 17, marginBottom: 3 }}>
              {negrito(l.slice(2))}
            </li>
          );
        }

        return (
          <p key={i} style={{ margin: '0 0 8px' }}>
            {negrito(l)}
          </p>
        );
      })}
    </>
  );
}

function negrito(s: string) {
  return s.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**') ? (
      <strong key={i} style={{ color: T.textPrimary }}>
        {parte.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{parte}</span>
    )
  );
}
