import { useState, useEffect, useRef } from 'react';
import { Link2, Check } from 'lucide-react';
import { T } from '../theme';

interface BotaoCopiarLinkProps {
  /** URL a copiar. Se omitido, usa a URL atual. */
  url?: string;
  /** Texto livre a copiar. Tem prioridade sobre a URL. */
  texto?: string;
  variant?: 'full' | 'compact' | 'icone';
  rotulo?: string;
}

export function BotaoCopiarLink({
  url,
  texto,
  variant = 'full',
  rotulo = 'Copiar link',
}: BotaoCopiarLinkProps) {
  const [copiado, setCopiado] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copiar() {
    const alvo = texto ?? url ?? window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(alvo);
      } else {
        // Safari antigo e contextos sem clipboard API
        const ta = document.createElement('textarea');
        ta.value = alvo;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiado(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt('Copie o conteúdo:', alvo);
    }
  }

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: copiado ? T.tenhoFaint : 'transparent',
    border: `1.5px solid ${copiado ? T.tenho : T.neonBorder}`,
    borderRadius: T.radius,
    color: copiado ? T.tenho : T.neon,
    fontWeight: 600,
    fontFamily: T.fontBody,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxSizing: 'border-box' as const,
  };

  const porVariante = {
    full: { width: '100%', padding: '12px 20px', fontSize: 14 },
    compact: { padding: '8px 14px', fontSize: 13 },
    icone: { padding: 9, fontSize: 0 },
  }[variant];

  const Icone = copiado ? Check : Link2;

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={rotulo}
      style={{ ...base, ...porVariante }}
    >
      <Icone size={variant === 'full' ? 18 : 16} style={{ flexShrink: 0 }} />
      {variant !== 'icone' && (copiado ? 'Copiado!' : rotulo)}
    </button>
  );
}
