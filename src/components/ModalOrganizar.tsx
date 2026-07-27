import { useState, useMemo } from 'react';
import { Wand2, AlertTriangle } from 'lucide-react';
import { T, TS } from '../theme';
import type { Item, Subdivisao } from '../lib/tipos';
import { planejarOrganizacao } from '../lib/organizar';
import { vincularSubdivisao } from '../lib/api';
import { Modal } from '../pages/Colecoes';

interface Props {
  itens: Item[];
  subdivisoes: Subdivisao[];
  aoFechar: () => void;
  aoConcluir: (organizados: number) => Promise<void>;
}

export function ModalOrganizar({
  itens,
  subdivisoes,
  aoFechar,
  aoConcluir,
}: Props) {
  const [aplicando, setAplicando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Só mexe em quem ainda está solto
  const soltos = useMemo(
    () => itens.filter((i) => !i.subdivisao_id),
    [itens]
  );
  const plano = useMemo(
    () => planejarOrganizacao(soltos, subdivisoes),
    [soltos, subdivisoes]
  );

  async function aplicar() {
    setErro(null);
    setAplicando(true);
    try {
      for (const s of plano.sugestoes) {
        await vincularSubdivisao(
          s.itens.map((i) => i.id),
          s.subdivisao.id
        );
      }
      await aoConcluir(plano.total);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao organizar.');
      setAplicando(false);
    }
  }

  return (
    <Modal titulo="Organizar em subdivisões" aoFechar={aoFechar}>
      <p
        style={{
          fontFamily: T.fontBody,
          fontSize: 13.5,
          color: T.textSecondary,
          marginTop: 0,
          marginBottom: 18,
          lineHeight: 1.6,
        }}
      >
        Procuro o nome de cada subdivisão dentro do número do item e faço o
        vínculo. Nada é apagado — só o agrupamento muda.
      </p>

      {soltos.length === 0 ? (
        <Aviso>Todos os itens já estão em alguma subdivisão.</Aviso>
      ) : plano.sugestoes.length === 0 ? (
        <Aviso>
          Nenhum item bate com o nome das subdivisões existentes. Confira se os
          nomes das subdivisões aparecem no número dos itens.
        </Aviso>
      ) : (
        <>
          {plano.sugestoes.map((s) => (
            <div
              key={s.subdivisao.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '11px 13px',
                background: T.bgElevated,
                border: `1px solid ${T.border}`,
                borderRadius: T.radiusSm,
                marginBottom: 7,
              }}
            >
              <span
                style={{
                  fontFamily: T.fontBody,
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: T.textPrimary,
                }}
              >
                {s.subdivisao.nome}
              </span>
              <span
                style={{
                  fontFamily: T.fontBody,
                  fontSize: 12.5,
                  color: T.neon,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                {s.itens.length} {s.itens.length === 1 ? 'item' : 'itens'}
              </span>
            </div>
          ))}

          {plano.semCorrespondencia.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 9,
                alignItems: 'flex-start',
                padding: '11px 13px',
                background: T.avisoFaint,
                border: `1px solid ${T.aviso}`,
                borderRadius: T.radiusSm,
                marginTop: 12,
                marginBottom: 4,
              }}
            >
              <AlertTriangle
                size={16}
                color={T.aviso}
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <div
                style={{
                  fontFamily: T.fontBody,
                  fontSize: 12.5,
                  color: T.textSecondary,
                  lineHeight: 1.55,
                }}
              >
                <strong style={{ color: T.textPrimary }}>
                  {plano.semCorrespondencia.length}{' '}
                  {plano.semCorrespondencia.length === 1
                    ? 'item fica'
                    : 'itens ficam'}{' '}
                  sem subdivisão.
                </strong>
                <br />
                {plano.semCorrespondencia
                  .slice(0, 8)
                  .map((i) => i.numero || i.nome)
                  .join(', ')}
                {plano.semCorrespondencia.length > 8 &&
                  ` e mais ${plano.semCorrespondencia.length - 8}`}
              </div>
            </div>
          )}

          {erro && (
            <div
              role="alert"
              style={{
                background: T.erroFaint,
                border: `1px solid ${T.erro}`,
                borderRadius: T.radiusSm,
                padding: '10px 12px',
                marginTop: 12,
                fontSize: 13,
                color: T.erro,
                fontFamily: T.fontBody,
              }}
            >
              {erro}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              onClick={aoFechar}
              style={{ ...TS.botaoSecundario, flex: 1 }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void aplicar()}
              disabled={aplicando}
              style={{
                ...TS.botaoPrimario,
                flex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                opacity: aplicando ? 0.6 : 1,
              }}
            >
              <Wand2 size={16} />
              {aplicando
                ? 'Organizando...'
                : `Organizar ${plano.total} itens`}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        ...TS.card,
        textAlign: 'center',
        color: T.textMuted,
        fontFamily: T.fontBody,
        fontSize: 13.5,
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}
