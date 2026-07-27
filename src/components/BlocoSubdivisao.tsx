import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { T, TS } from '../theme';
import { porcentagem } from '../lib/tipos';

interface Props {
  titulo: string;
  /** Progresso do bloco. Omitido na tela de catálogo, que só conta itens. */
  progresso?: { tenho: number; total: number };
  /** Usado quando não há progresso: "30 itens" */
  contagem?: number;
  recolhido: boolean;
  aoAlternar: () => void;
  children: ReactNode;
}

export function BlocoSubdivisao({
  titulo,
  progresso,
  contagem,
  recolhido,
  aoAlternar,
  children,
}: Props) {
  const pct = progresso
    ? porcentagem(progresso.tenho, progresso.total)
    : null;
  const completo = progresso ? progresso.tenho >= progresso.total && progresso.total > 0 : false;

  return (
    <section
      style={{
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        background: T.bgCard,
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={aoAlternar}
        aria-expanded={!recolhido}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '13px 15px',
          background: 'transparent',
          border: 'none',
          borderBottom: recolhido ? 'none' : `1px solid ${T.border}`,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {recolhido ? (
          <ChevronRight size={17} color={T.textMuted} style={{ flexShrink: 0 }} />
        ) : (
          <ChevronDown size={17} color={T.textMuted} style={{ flexShrink: 0 }} />
        )}

        <span
          style={{
            ...TS.titulo,
            fontSize: 13.5,
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {titulo}
        </span>

        {progresso ? (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: T.fontBody,
                fontSize: 12,
                color: T.textSecondary,
                whiteSpace: 'nowrap',
              }}
            >
              {progresso.tenho} de {progresso.total}
            </span>

            {/* barra fina ao lado do título */}
            <span
              role="progressbar"
              aria-valuenow={pct ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{
                width: 54,
                height: 5,
                background: T.bgHover,
                borderRadius: 99,
                overflow: 'hidden',
                display: 'block',
              }}
            >
              <span
                style={{
                  display: 'block',
                  width: `${pct}%`,
                  height: '100%',
                  background: completo ? T.tenho : T.neon,
                  borderRadius: 99,
                  transition: 'width 0.3s ease',
                }}
              />
            </span>

            <span
              style={{
                fontFamily: T.fontBody,
                fontSize: 12,
                fontWeight: 700,
                color: completo ? T.tenho : T.neon,
                minWidth: 34,
                textAlign: 'right',
              }}
            >
              {pct}%
            </span>
          </span>
        ) : (
          <span
            style={{
              fontFamily: T.fontBody,
              fontSize: 12,
              color: T.textMuted,
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {contagem} {contagem === 1 ? 'item' : 'itens'}
          </span>
        )}
      </button>

      {!recolhido && <div style={{ padding: 12 }}>{children}</div>}
    </section>
  );
}
