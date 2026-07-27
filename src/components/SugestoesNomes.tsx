import { T } from '../theme';

/**
 * Lista de sugestões em botões visíveis.
 * Substitui o <datalist>, que aparece de forma diferente em cada navegador
 * e simplesmente não abre em parte dos celulares.
 */
export function SugestoesNomes({
  nomes,
  aoEscolher,
  jaExistem = [],
  rotulo = 'Já usei antes',
}: {
  nomes: string[];
  aoEscolher: (nome: string) => void;
  /** Marcados como já presentes, mas ainda clicáveis */
  jaExistem?: string[];
  rotulo?: string;
}) {
  if (nomes.length === 0) return null;

  const presentes = new Set(jaExistem.map((n) => n.toLowerCase()));

  return (
    <div style={{ marginTop: 10 }}>
      <div
        style={{
          fontFamily: T.fontBody,
          fontSize: 11,
          fontWeight: 600,
          color: T.textMuted,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          marginBottom: 7,
        }}
      >
        {rotulo}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {nomes.map((n) => {
          const existe = presentes.has(n.toLowerCase());
          return (
            <button
              key={n}
              type="button"
              onClick={() => aoEscolher(n)}
              title={existe ? 'Esta coleção já tem esta subdivisão' : undefined}
              style={{
                padding: '6px 12px',
                borderRadius: 99,
                border: `1px solid ${existe ? T.border : T.neonBorder}`,
                background: existe ? 'transparent' : T.neonFaint,
                color: existe ? T.textMuted : T.neon,
                fontFamily: T.fontBody,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {n}
              {existe && (
                <span style={{ opacity: 0.7, marginLeft: 5 }}>· já tem</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
