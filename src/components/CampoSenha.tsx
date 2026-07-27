import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { T, TS } from '../theme';

interface Props {
  id: string;
  valor: string;
  aoMudar: (v: string) => void;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  /** Fonte monoespaçada, útil para senha gerada */
  monoespacada?: boolean;
}

export function CampoSenha({
  id,
  valor,
  aoMudar,
  autoComplete = 'current-password',
  minLength,
  required = true,
  monoespacada = false,
}: Props) {
  const [visivel, setVisivel] = useState(false);
  const Icone = visivel ? EyeOff : Eye;

  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={visivel ? 'text' : 'password'}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        style={{
          ...TS.input,
          paddingRight: 42,
          fontFamily: monoespacada ? 'ui-monospace, monospace' : T.fontBody,
        }}
      />

      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        title={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        // tabIndex negativo: ao navegar por teclado, o Tab vai do campo
        // direto para o próximo, sem parar no olhinho
        tabIndex={-1}
        style={{
          position: 'absolute',
          right: 6,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          color: visivel ? T.neon : T.textMuted,
          cursor: 'pointer',
          display: 'flex',
          padding: 7,
          borderRadius: T.radiusSm,
        }}
      >
        <Icone size={17} />
      </button>
    </div>
  );
}
