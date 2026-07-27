import { useState } from 'react';
import { Smartphone } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { T } from '../theme';

interface InstallButtonProps {
  variant?: 'full' | 'compact';
}

export function InstallButton({ variant = 'full' }: InstallButtonProps) {
  const { install, canInstall, installed, iosInstall } = useInstallPrompt();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (installed || !canInstall) return null;

  const estiloBotao = {
    width: variant === 'full' ? '100%' : 'auto',
    padding: variant === 'full' ? '12px 20px' : '8px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: 'transparent',
    border: `1.5px solid ${T.neonBorder}`,
    borderRadius: T.radius,
    color: T.neon,
    fontSize: variant === 'full' ? 14 : 12,
    fontWeight: 600,
    fontFamily: T.fontBody,
    cursor: 'pointer',
    letterSpacing: '0.3px',
    boxShadow: T.glowNeonSm,
    transition: 'all 0.2s',
    boxSizing: 'border-box' as const,
  };

  // iOS Safari — guia manual, pois não existe prompt nativo
  if (iosInstall) {
    return (
      <div style={{ width: '100%' }}>
        <button
          type="button"
          onClick={() => setShowIOSGuide((s) => !s)}
          style={estiloBotao}
        >
          <Smartphone size={variant === 'full' ? 18 : 15} />
          Instalar App
        </button>

        {showIOSGuide && (
          <div
            style={{
              marginTop: 10,
              padding: '12px 14px',
              background: T.neonFaint,
              border: `1px solid ${T.neonBorder}`,
              borderRadius: T.radiusSm,
              fontSize: 13,
              color: T.textSecondary,
              fontFamily: T.fontBody,
              lineHeight: 1.6,
            }}
          >
            <div
              style={{
                fontWeight: 600,
                color: T.neon,
                marginBottom: 6,
                fontSize: 12,
                letterSpacing: 0.5,
              }}
            >
              COMO INSTALAR NO IPHONE
            </div>
            <ol
              style={{
                margin: 0,
                paddingLeft: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <li>
                Toque em{' '}
                <strong style={{ color: T.textPrimary }}>Compartilhar</strong>{' '}
                <span style={{ fontSize: 15 }}>⎙</span> na barra do Safari
              </li>
              <li>
                Role e toque em{' '}
                <strong style={{ color: T.textPrimary }}>
                  "Adicionar à Tela de Início"
                </strong>
              </li>
              <li>
                Toque em{' '}
                <strong style={{ color: T.textPrimary }}>Adicionar</strong>
              </li>
            </ol>
          </div>
        )}
      </div>
    );
  }

  // Chrome / Android / Desktop — prompt nativo
  return (
    <button
      type="button"
      onClick={install}
      style={estiloBotao}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = T.neonFaint;
        e.currentTarget.style.boxShadow = T.glowNeon;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.boxShadow = T.glowNeonSm;
      }}
    >
      <Smartphone size={variant === 'full' ? 18 : 15} />
      Instalar App
    </button>
  );
}
