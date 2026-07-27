import { useState, useEffect, useCallback } from 'react';
import { Download, TrendingUp } from 'lucide-react';
import { T, TS } from '../theme';
import { useAuth } from '../lib/auth';
import { listarMinhasColecoes, listarItens, listarMeusItens } from '../lib/api';
import type { ColecaoComProgresso } from '../lib/tipos';
import { porcentagem } from '../lib/tipos';
import { BarraProgresso } from '../components/BarraProgresso';

export function Relatorios() {
  const { perfil } = useAuth();
  const [colecoes, setColecoes] = useState<ColecaoComProgresso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [exportando, setExportando] = useState<string | null>(null);

  useEffect(() => {
    if (!perfil) return;
    listarMinhasColecoes(perfil.id)
      .then(setColecoes)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [perfil]);

  /** Item 12.4 — exportar CSV do progresso de uma coleção. */
  const exportar = useCallback(
    async (colecao: ColecaoComProgresso) => {
      if (!perfil) return;
      setExportando(colecao.id);
      try {
        const itens = await listarItens(colecao.id);
        const meus = await listarMeusItens(perfil.id, itens.map((i) => i.id));

        const linhas = [
          ['numero', 'nome', 'categoria', 'raridade', 'status', 'repetidas'],
          ...itens.map((i) => {
            const l = meus.get(i.id);
            return [
              i.numero ?? '',
              i.nome,
              i.categoria ?? '',
              i.raridade ?? '',
              l?.status ?? 'falta',
              String(l?.quantidade_repetida ?? 0),
            ];
          }),
        ];

        const csv = linhas
          .map((l) => l.map(escapar).join(','))
          .join('\r\n');

        // BOM para o Excel abrir os acentos corretamente
        const blob = new Blob(['\uFEFF' + csv], {
          type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${limpar(colecao.nome)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao exportar.');
      } finally {
        setExportando(null);
      }
    },
    [perfil]
  );

  const totalItens = colecoes.reduce((s, c) => s + c.total_itens, 0);
  const totalTenho = colecoes.reduce((s, c) => s + c.total_tenho, 0);
  const totalRepetidas = colecoes.reduce((s, c) => s + c.total_repetidas, 0);

  // Item 12.3 — ranking de quem está mais perto de completar
  const ranking = [...colecoes]
    .filter((c) => c.total_itens > 0)
    .sort(
      (a, b) =>
        porcentagem(b.total_tenho, b.total_itens) -
        porcentagem(a.total_tenho, a.total_itens)
    );

  return (
    <div>
      <h1 style={{ ...TS.titulo, fontSize: 22, marginBottom: 4 }}>Relatórios</h1>
      <p
        style={{
          fontFamily: T.fontBody,
          fontSize: 13.5,
          color: T.textSecondary,
          marginTop: 0,
          marginBottom: 20,
        }}
      >
        Como está o seu progresso em cada coleção.
      </p>

      {erro && <Caixa texto={erro} erro />}

      {carregando ? (
        <Caixa texto="Carregando..." />
      ) : colecoes.length === 0 ? (
        <Caixa texto="Nenhuma coleção para analisar ainda." />
      ) : (
        <>
          {/* Resumo geral */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 10,
              marginBottom: 26,
            }}
          >
            <Cartao rotulo="Coleções" valor={colecoes.length} cor={T.neon} />
            <Cartao rotulo="Itens no total" valor={totalItens} cor={T.textPrimary} />
            <Cartao rotulo="Já tenho" valor={totalTenho} cor={T.tenho} />
            <Cartao rotulo="Repetidas" valor={totalRepetidas} cor={T.repetida} />
          </div>

          <div style={{ ...TS.label, marginBottom: 12 }}>
            <TrendingUp size={13} style={{ verticalAlign: -2, marginRight: 5 }} />
            Mais perto de completar
          </div>

          {ranking.map((c) => (
            <div key={c.id} style={{ ...TS.card, marginBottom: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ ...TS.titulo, fontSize: 14, flex: 1, minWidth: 0 }}>
                  {c.nome}
                </span>
                <button
                  type="button"
                  disabled={exportando === c.id}
                  onClick={() => void exportar(c)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 12px',
                    background: 'transparent',
                    border: `1px solid ${T.neonBorder}`,
                    borderRadius: T.radiusSm,
                    color: T.neon,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: T.fontBody,
                    cursor: 'pointer',
                    opacity: exportando === c.id ? 0.5 : 1,
                  }}
                >
                  <Download size={13} />
                  {exportando === c.id ? 'Gerando...' : 'CSV'}
                </button>
              </div>

              <BarraProgresso tenho={c.total_tenho} total={c.total_itens} />

              <div
                style={{
                  fontFamily: T.fontBody,
                  fontSize: 12,
                  color: T.textMuted,
                  marginTop: 10,
                }}
              >
                Faltam {c.total_itens - c.total_tenho} · {c.total_repetidas}{' '}
                repetidas para trocar
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function Cartao({
  rotulo,
  valor,
  cor,
}: {
  rotulo: string;
  valor: number;
  cor: string;
}) {
  return (
    <div style={{ ...TS.card, padding: 14 }}>
      <div
        style={{
          fontFamily: T.fontTitle,
          fontSize: 22,
          fontWeight: 700,
          color: cor,
        }}
      >
        {valor}
      </div>
      <div
        style={{
          fontFamily: T.fontBody,
          fontSize: 11.5,
          color: T.textMuted,
          marginTop: 3,
        }}
      >
        {rotulo}
      </div>
    </div>
  );
}

function escapar(v: string) {
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function limpar(nome: string) {
  return nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\-]+/g, '_');
}

function Caixa({ texto, erro = false }: { texto: string; erro?: boolean }) {
  return (
    <div
      style={{
        ...TS.card,
        textAlign: 'center',
        color: erro ? T.erro : T.textMuted,
        borderColor: erro ? T.erro : T.border,
        fontFamily: T.fontBody,
        fontSize: 13.5,
        marginBottom: 14,
      }}
    >
      {texto}
    </div>
  );
}
