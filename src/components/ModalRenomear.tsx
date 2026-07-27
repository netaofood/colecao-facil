import { useState, useMemo } from 'react';
import { Type } from 'lucide-react';
import { T, TS } from '../theme';
import type { Item, Subdivisao } from '../lib/tipos';
import { nomeSugerido } from '../lib/rotulos';
import { atualizarItem } from '../lib/api';
import { Modal } from '../pages/Colecoes';

/**
 * Itens gerados em série antes desta melhoria ficaram com o nome igual
 * ao número. Aqui eles ganham um nome legível a partir da subdivisão.
 */
export function ModalRenomear({
  itens,
  subdivisoes,
  aoFechar,
  aoConcluir,
}: {
  itens: Item[];
  subdivisoes: Subdivisao[];
  aoFechar: () => void;
  aoConcluir: (quantidade: number) => Promise<void>;
}) {
  const [aplicando, setAplicando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const nomeDaSub = useMemo(
    () => new Map(subdivisoes.map((s) => [s.id, s.nome])),
    [subdivisoes]
  );

  const mudancas = useMemo(
    () =>
      itens
        .map((item) => {
          const sub = item.subdivisao_id
            ? (nomeDaSub.get(item.subdivisao_id) ?? null)
            : null;
          const novo = nomeSugerido(item, sub);
          return novo ? { item, novo } : null;
        })
        .filter((x): x is { item: Item; novo: string } => x !== null),
    [itens, nomeDaSub]
  );

  return (
    <Modal titulo="Melhorar os nomes" aoFechar={aoFechar}>
      <p
        style={{
          fontFamily: T.fontBody,
          fontSize: 13.5,
          color: T.textSecondary,
          marginTop: 0,
          marginBottom: 16,
          lineHeight: 1.6,
        }}
      >
        Itens criados em série ficaram com o nome igual ao número. Aqui eles
        ganham um nome legível. O número não muda.
      </p>

      {mudancas.length === 0 ? (
        <Aviso>
          Nenhum item precisa disso. Ou os nomes já estão bons, ou os itens
          ainda não têm subdivisão — nesse caso, use o botão Organizar antes.
        </Aviso>
      ) : (
        <>
          <div
            style={{
              maxHeight: 220,
              overflowY: 'auto',
              marginBottom: 16,
            }}
          >
            {mudancas.slice(0, 30).map(({ item, novo }) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 11px',
                  background: T.bgElevated,
                  border: `1px solid ${T.border}`,
                  borderRadius: T.radiusSm,
                  marginBottom: 5,
                  fontFamily: T.fontBody,
                  fontSize: 12.5,
                }}
              >
                <code style={{ color: T.textMuted }}>{item.nome}</code>
                <span style={{ color: T.textMuted }}>→</span>
                <strong style={{ color: T.neon }}>{novo}</strong>
              </div>
            ))}
            {mudancas.length > 30 && (
              <div
                style={{
                  fontFamily: T.fontBody,
                  fontSize: 12,
                  color: T.textMuted,
                  textAlign: 'center',
                  padding: 6,
                }}
              >
                e mais {mudancas.length - 30}
              </div>
            )}
          </div>

          {erro && (
            <div
              role="alert"
              style={{
                background: T.erroFaint,
                border: `1px solid ${T.erro}`,
                borderRadius: T.radiusSm,
                padding: '10px 12px',
                marginBottom: 12,
                fontSize: 13,
                color: T.erro,
                fontFamily: T.fontBody,
              }}
            >
              {erro}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={aoFechar}
              style={{ ...TS.botaoSecundario, flex: 1 }}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={aplicando}
              onClick={async () => {
                setErro(null);
                setAplicando(true);
                try {
                  for (const { item, novo } of mudancas) {
                    await atualizarItem(item.id, { nome: novo });
                  }
                  await aoConcluir(mudancas.length);
                } catch (e) {
                  setErro(e instanceof Error ? e.message : 'Erro ao renomear.');
                  setAplicando(false);
                }
              }}
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
              <Type size={16} />
              {aplicando ? 'Renomeando...' : `Renomear ${mudancas.length}`}
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
