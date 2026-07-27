import { Sun, Moon } from 'lucide-react';
import { T } from '../theme';
import { useTema } from '../hooks/useTema';

interface Props {
  variant?: 'icone' | 'completo';
  /** No menu lateral recolhido, só o ícone cabe */
  compacto?: boolean;
}

export function BotaoTema({ variant = 'icone', compacto = false }: Props) {
  const { alternar, ehClaro } = useTema();
  const Icone = ehClaro ? Moon : Sun;
  const rotulo = ehClaro ? 'Tema escuro' : 'Tema claro';

  if (variant === 'completo') {
    return (
      <button
        type="button"
        onClick={alternar}
        title={compacto ? rotulo : undefined}
        aria-label={rotulo}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: compacto ? 'center' : 'flex-start',
          gap: 12,
          padding: compacto ? '11px 0' : '11px 12px',
          background: 'transparent',
          border: 'none',
          borderRadius: T.radiusSm,
          color: T.textMuted,
          fontSize: 14,
          fontFamily: T.fontBody,
          cursor: 'pointer',
        }}
      >
        <Icone size={19} style={{ flexShrink: 0 }} />
        {!compacto && rotulo}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={rotulo}
      title={rotulo}
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
      <Icone size={17} />
    </button>
  );
}
