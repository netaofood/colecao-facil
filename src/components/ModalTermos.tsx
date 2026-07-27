import { X } from 'lucide-react';
import { T, TS } from '../theme';
import { TERMOS_TEXTO, TERMOS_TITULO } from '../lib/termos';

export function ModalTermos({ aoFechar }: { aoFechar: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={TERMOS_TITULO}
      onClick={aoFechar}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: T.radiusLg,
          width: '100%',
          maxWidth: 640,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span style={{ ...TS.titulo, fontSize: 15 }}>{TERMOS_TITULO}</span>
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
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            padding: '18px 20px',
            overflowY: 'auto',
            fontFamily: T.fontBody,
            fontSize: 14,
            lineHeight: 1.7,
            color: T.textSecondary,
          }}
        >
          <TextoFormatado texto={TERMOS_TEXTO} />
        </div>

        <div style={{ padding: 16, borderTop: `1px solid ${T.border}` }}>
          <button
            type="button"
            onClick={aoFechar}
            style={{ ...TS.botaoSecundario, width: '100%' }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

/** Formatação mínima: ## títulos, **negrito**, - lista. */
function TextoFormatado({ texto }: { texto: string }) {
  return (
    <>
      {texto.split('\n').map((linha, i) => {
        const l = linha.trim();
        if (!l) return <div key={i} style={{ height: 8 }} />;

        if (l.startsWith('## ')) {
          return (
            <h3
              key={i}
              style={{
                ...TS.titulo,
                fontSize: 14,
                color: T.neon,
                margin: '20px 0 8px',
              }}
            >
              {l.slice(3)}
            </h3>
          );
        }

        if (l.startsWith('- ')) {
          return (
            <li key={i} style={{ marginLeft: 18, marginBottom: 4 }}>
              {negrito(l.slice(2))}
            </li>
          );
        }

        return (
          <p key={i} style={{ margin: '0 0 10px' }}>
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
