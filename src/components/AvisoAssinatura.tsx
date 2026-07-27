import { AlertTriangle, Clock } from 'lucide-react';
import { T } from '../theme';
import { useAuth } from '../lib/auth';
import { situacaoAssinatura, diasRestantes } from '../lib/api';

/**
 * Faixa mostrada ao colecionador quando a assinatura está perto de vencer
 * ou já venceu. Vencida, ele continua vendo tudo e marcando o que tem,
 * mas o banco recusa criar coleção e cadastrar item.
 */
export function AvisoAssinatura() {
  const { perfil } = useAuth();
  if (!perfil) return null;

  const situacao = situacaoAssinatura(perfil.isento, perfil.assinatura_ate);
  if (situacao === 'isento' || situacao === 'em_dia') return null;

  const dias = diasRestantes(perfil.assinatura_ate);
  const vencida = situacao === 'vencida';

  const cor = vencida ? T.erro : T.aviso;
  const fundo = vencida ? T.erroFaint : T.avisoFaint;
  const Icone = vencida ? AlertTriangle : Clock;

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        gap: 11,
        alignItems: 'flex-start',
        padding: '12px 14px',
        background: fundo,
        border: `1px solid ${cor}`,
        borderRadius: T.radius,
        marginBottom: 18,
      }}
    >
      <Icone size={18} color={cor} style={{ flexShrink: 0, marginTop: 1 }} />
      <div
        style={{
          fontFamily: T.fontBody,
          fontSize: 13.5,
          color: T.textSecondary,
          lineHeight: 1.6,
        }}
      >
        {vencida ? (
          <>
            <strong style={{ color: T.textPrimary }}>
              Sua assinatura venceu.
            </strong>{' '}
            Você continua vendo suas coleções e marcando o que já tem, mas não
            consegue criar coleção nova nem cadastrar itens. Fale com o
            administrador para regularizar.
          </>
        ) : (
          <>
            <strong style={{ color: T.textPrimary }}>
              {dias === 0
                ? 'Sua assinatura vence hoje.'
                : `Sua assinatura vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}.`}
            </strong>{' '}
            Depois disso você continua vendo tudo, mas não cadastra coisa nova.
          </>
        )}
      </div>
    </div>
  );
}

/** Diz se o usuário pode cadastrar. Usado para desabilitar botões. */
export function usePodeCadastrar(): boolean {
  const { perfil } = useAuth();
  if (!perfil) return false;
  const s = situacaoAssinatura(perfil.isento, perfil.assinatura_ate);
  return s !== 'vencida';
}
