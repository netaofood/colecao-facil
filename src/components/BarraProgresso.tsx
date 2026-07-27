import { T } from '../theme';
import { porcentagem } from '../lib/tipos';

export function BarraProgresso({
  tenho,
  total,
  compacta = false,
}: {
  tenho: number;
  total: number;
  compacta?: boolean;
}) {
  const pct = porcentagem(tenho, total);
  const completa = total > 0 && tenho >= total;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
          fontFamily: T.fontBody,
          fontSize: compacta ? 11.5 : 12.5,
        }}
      >
        <span style={{ color: T.textSecondary }}>
          {total === 0 ? 'Sem itens ainda' : `${tenho} de ${total}`}
        </span>
        <span
          style={{
            color: completa ? T.tenho : T.neon,
            fontWeight: 700,
          }}
        >
          {pct}%
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          height: compacta ? 5 : 7,
          background: T.bgHover,
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: completa ? T.tenho : T.neon,
            boxShadow: completa ? 'none' : T.glowNeonSm,
            borderRadius: 99,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}
