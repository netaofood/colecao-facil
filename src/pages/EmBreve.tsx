import { Construction } from 'lucide-react';
import { T, TS } from '../theme';

/** Placeholder das telas ainda não implementadas, com a fase do plano. */
export function EmBreve({ titulo, fase, itens }: { titulo: string; fase: string; itens: string }) {
  return (
    <div>
      <h1 style={{ ...TS.titulo, fontSize: 22, marginBottom: 20 }}>{titulo}</h1>
      <div style={{ ...TS.card, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <Construction size={22} color={T.aviso} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontFamily: T.fontBody, fontSize: 14, color: T.textSecondary, lineHeight: 1.6 }}>
          <strong style={{ color: T.textPrimary }}>Ainda não construído.</strong>
          <br />
          Previsto para a <strong style={{ color: T.neon }}>{fase}</strong> — {itens}.
        </div>
      </div>
    </div>
  );
}
