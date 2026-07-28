import { useState, useEffect, useMemo, useCallback } from 'react';
import { Download, Filter, TrendingUp, Award, Layers, Copy } from 'lucide-react';
import { T, TS } from '../theme';
import { useAuth } from '../lib/auth';
import {
  listarMinhasColecoes,
  listarItens,
  listarMeusItens,
  listarSubdivisoes,
} from '../lib/api';
import type {
  ColecaoComProgresso,
  Item,
  ItemUsuario,
  Subdivisao,
} from '../lib/tipos';
import { porcentagem } from '../lib/tipos';
import {
  Rosca,
  BarrasHorizontais,
  Colunas,
  AreaEvolucao,
  Medidor,
} from '../components/graficos';
import type { Fatia, Barra, Ponto } from '../components/graficos';

type Periodo = 30 | 90 | 365 | 0;

const PERIODOS: { valor: Periodo; rotulo: string }[] = [
  { valor: 30, rotulo: '30 dias' },
  { valor: 90, rotulo: '3 meses' },
  { valor: 365, rotulo: '1 ano' },
  { valor: 0, rotulo: 'Tudo' },
];

interface Dados {
  itens: Item[];
  meus: Map<string, ItemUsuario>;
  subdivisoes: Map<string, Subdivisao[]>;
}

export function Relatorios() {
  const { perfil } = useAuth();

  const [colecoes, setColecoes] = useState<ColecaoComProgresso[]>([]);
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [exportando, setExportando] = useState<string | null>(null);

  // --- filtros ---
  const [colecaoId, setColecaoId] = useState('');
  const [categoria, setCategoria] = useState('');
  const [periodo, setPeriodo] = useState<Periodo>(90);

  const carregar = useCallback(async () => {
    if (!perfil) return;
    try {
      const lista = await listarMinhasColecoes(perfil.id);
      setColecoes(lista);

      const [porColecao, subs] = await Promise.all([
        Promise.all(lista.map((c) => listarItens(c.id))),
        Promise.all(lista.map((c) => listarSubdivisoes(c.id))),
      ]);

      const itens = porColecao.flat();
      const meus = await listarMeusItens(
        perfil.id,
        itens.map((i) => i.id)
      );

      setDados({
        itens,
        meus,
        subdivisoes: new Map(lista.map((c, i) => [c.id, subs[i]])),
      });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar.');
    } finally {
      setCarregando(false);
    }
  }, [perfil]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const categorias = useMemo(() => {
    const vistos = new Map<string, string>();
    for (const c of colecoes) {
      const t = c.categoria?.trim();
      if (!t) continue;
      const k = t.toLowerCase();
      if (!vistos.has(k)) vistos.set(k, t);
    }
    return [...vistos.values()].sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
    );
  }, [colecoes]);

  /** Coleções que passam pelos filtros de coleção e categoria. */
  const colecoesFiltradas = useMemo(
    () =>
      colecoes.filter((c) => {
        if (colecaoId && c.id !== colecaoId) return false;
        if (
          categoria &&
          (c.categoria ?? '').toLowerCase() !== categoria.toLowerCase()
        ) {
          return false;
        }
        return true;
      }),
    [colecoes, colecaoId, categoria]
  );

  const analise = useMemo(() => {
    if (!dados) return null;

    const permitidas = new Set(colecoesFiltradas.map((c) => c.id));
    const itens = dados.itens.filter((i) => permitidas.has(i.colecao_id));

    let tenho = 0;
    let repetidas = 0;
    let unidades = 0;

    const porRaridade = new Map<string, { total: number; tenho: number }>();
    const porCategoria = new Map<string, { total: number; tenho: number }>();
    const nomeColecao = new Map(colecoesFiltradas.map((c) => [c.id, c]));

    for (const item of itens) {
      const linha = dados.meus.get(item.id);
      const possui = linha && linha.status !== 'falta';

      if (possui) {
        tenho++;
        if (linha.status === 'repetida') {
          repetidas++;
          unidades += linha.quantidade_repetida;
        }
      }

      const rar = item.raridade?.trim() || 'Sem raridade';
      if (!porRaridade.has(rar)) porRaridade.set(rar, { total: 0, tenho: 0 });
      porRaridade.get(rar)!.total++;
      if (possui) porRaridade.get(rar)!.tenho++;

      const cat =
        nomeColecao.get(item.colecao_id)?.categoria?.trim() || 'Sem categoria';
      if (!porCategoria.has(cat)) porCategoria.set(cat, { total: 0, tenho: 0 });
      porCategoria.get(cat)!.total++;
      if (possui) porCategoria.get(cat)!.tenho++;
    }

    // Evolução: quantos itens marcados por período
    const limite =
      periodo > 0 ? Date.now() - periodo * 86400000 : 0;

    const idsPermitidos = new Set(itens.map((i) => i.id));
    const marcacoes: number[] = [];
    for (const [itemId, linha] of dados.meus) {
      if (!idsPermitidos.has(itemId)) continue;
      if (linha.status === 'falta') continue;
      const quando = new Date(linha.updated_at).getTime();
      if (quando >= limite) marcacoes.push(quando);
    }
    marcacoes.sort((a, b) => a - b);

    return {
      itens,
      total: itens.length,
      tenho,
      faltam: itens.length - tenho,
      repetidas,
      unidades,
      porRaridade,
      porCategoria,
      marcacoes,
    };
  }, [dados, colecoesFiltradas, periodo]);

  /** Acumulado de itens conquistados ao longo do tempo. */
  const evolucao = useMemo((): Ponto[] => {
    if (!analise || analise.marcacoes.length === 0) return [];

    const dias = periodo > 0 ? periodo : 365;
    const fatias = Math.min(12, Math.max(4, Math.round(dias / 30) * 2));
    const inicio = analise.marcacoes[0];
    const fim = Date.now();
    const passo = Math.max(1, (fim - inicio) / fatias);

    const pontos: Ponto[] = [];
    for (let i = 1; i <= fatias; i++) {
      const corte = inicio + passo * i;
      const acumulado = analise.marcacoes.filter((m) => m <= corte).length;
      pontos.push({
        rotulo: new Date(corte).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        valor: acumulado,
      });
    }
    return pontos;
  }, [analise, periodo]);

  const exportar = useCallback(async () => {
    if (!perfil || !analise || !dados) return;
    setExportando('csv');
    try {
      const nomes = new Map(colecoes.map((c) => [c.id, c.nome]));
      const subsPorId = new Map<string, string>();
      for (const [, lista] of dados.subdivisoes) {
        for (const s of lista) subsPorId.set(s.id, s.nome);
      }

      const linhas = [
        [
          'colecao',
          'subdivisao',
          'numero',
          'nome',
          'categoria',
          'raridade',
          'status',
          'repetidas',
        ],
        ...analise.itens.map((i) => {
          const l = dados.meus.get(i.id);
          return [
            nomes.get(i.colecao_id) ?? '',
            i.subdivisao_id ? (subsPorId.get(i.subdivisao_id) ?? '') : '',
            i.numero ?? '',
            i.nome,
            i.categoria ?? '',
            i.raridade ?? '',
            l?.status ?? 'falta',
            String(l?.quantidade_repetida ?? 0),
          ];
        }),
      ];

      const csv = linhas.map((l) => l.map(escapar).join(',')).join('\r\n');
      const blob = new Blob(['\uFEFF' + csv], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `colecao-facil-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportando(null);
    }
  }, [perfil, analise, dados, colecoes]);

  if (carregando) return <Caixa texto="Carregando..." />;
  if (erro) return <Caixa texto={erro} erro />;
  if (!analise || colecoes.length === 0) {
    return <Caixa texto="Nenhuma coleção para analisar ainda." />;
  }

  const fatiasStatus: Fatia[] = [
    { rotulo: 'Tenho', valor: analise.tenho - analise.repetidas, cor: T.tenho },
    { rotulo: 'Repetidas', valor: analise.repetidas, cor: T.repetida },
    { rotulo: 'Faltam', valor: analise.faltam, cor: T.falta },
  ];

  const ranking: Barra[] = colecoesFiltradas
    .filter((c) => c.total_itens > 0)
    .map((c) => ({
      rotulo: c.nome,
      valor: c.total_tenho,
      total: c.total_itens,
      cor:
        porcentagem(c.total_tenho, c.total_itens) === 100 ? T.tenho : T.neon,
    }))
    .sort(
      (a, b) => b.valor / (b.total ?? 1) - a.valor / (a.total ?? 1)
    );

  const barrasRaridade: Barra[] = [...analise.porRaridade.entries()]
    .map(([nome, v]) => ({
      rotulo: nome,
      valor: v.tenho,
      total: v.total,
      cor: corDaRaridade(nome),
    }))
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0));

  const colunasCategoria: Barra[] = [...analise.porCategoria.entries()]
    .map(([nome, v]) => ({ rotulo: nome, valor: v.total, cor: T.neon }))
    .sort((a, b) => b.valor - a.valor);

  const faltamMais = colecoesFiltradas
    .filter((c) => c.total_itens > 0)
    .map((c) => ({
      rotulo: c.nome,
      valor: c.total_itens - c.total_tenho,
      cor: T.falta,
      detalhe: `${c.total_itens - c.total_tenho} itens`,
    }))
    .sort((a, b) => b.valor - a.valor);

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
        Como está o seu progresso, por coleção, categoria e raridade.
      </p>

      {/* FILTROS */}
      <div style={{ ...TS.card, marginBottom: 22 }}>
        <div
          style={{
            ...TS.label,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Filter size={13} />
          Filtros
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div>
            <label style={TS.label} htmlFor="f-colecao">
              Coleção
            </label>
            <select
              id="f-colecao"
              value={colecaoId}
              onChange={(e) => setColecaoId(e.target.value)}
              style={{ ...TS.input, colorScheme: 'dark' }}
            >
              <option value="">Todas ({colecoes.length})</option>
              {colecoes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {categorias.length > 0 && (
            <div>
              <label style={TS.label} htmlFor="f-categoria">
                Categoria
              </label>
              <select
                id="f-categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                style={{ ...TS.input, colorScheme: 'dark' }}
              >
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label style={TS.label}>Período da evolução</label>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {PERIODOS.map((p) => (
              <button
                key={p.valor}
                type="button"
                onClick={() => setPeriodo(p.valor)}
                style={{
                  padding: '7px 13px',
                  borderRadius: 99,
                  border: `1.5px solid ${periodo === p.valor ? T.neon : T.border}`,
                  background: periodo === p.valor ? T.neonFaint : 'transparent',
                  color: periodo === p.valor ? T.neon : T.textSecondary,
                  fontFamily: T.fontBody,
                  fontSize: 12.5,
                  fontWeight: periodo === p.valor ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {p.rotulo}
              </button>
            ))}
          </div>
        </div>

        {(colecaoId || categoria) && (
          <button
            type="button"
            onClick={() => {
              setColecaoId('');
              setCategoria('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: T.neon,
              fontFamily: T.fontBody,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              marginTop: 12,
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {analise.total === 0 ? (
        <Caixa texto="Nenhum item nos filtros escolhidos." />
      ) : (
        <>
          {/* NÚMEROS + ROSCA + MEDIDOR */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <Painel titulo="Composição" Icone={Layers}>
              <Rosca
                fatias={fatiasStatus}
                centroTitulo={`${porcentagem(analise.tenho, analise.total)}%`}
                centroTexto={`${analise.tenho} de ${analise.total}`}
              />
            </Painel>

            <Painel titulo="Indicadores" Icone={Award}>
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  flexWrap: 'wrap',
                  justifyContent: 'space-around',
                  alignItems: 'flex-start',
                }}
              >
                <Medidor
                  valor={analise.tenho}
                  total={analise.total}
                  rotulo="Completude"
                  cor={T.tenho}
                />
                <Medidor
                  valor={analise.repetidas}
                  total={Math.max(1, analise.tenho)}
                  rotulo="Repetidas sobre o que tenho"
                  cor={T.repetida}
                  tamanho={130}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(84px, 1fr))',
                  gap: 8,
                  marginTop: 14,
                }}
              >
                <Mini rotulo="Coleções" valor={colecoesFiltradas.length} cor={T.neon} />
                <Mini rotulo="Itens" valor={analise.total} cor={T.textPrimary} />
                <Mini rotulo="Faltam" valor={analise.faltam} cor={T.falta} />
                <Mini
                  rotulo="Un. repetidas"
                  valor={analise.unidades}
                  cor={T.repetida}
                />
              </div>
            </Painel>
          </div>

          {/* EVOLUÇÃO */}
          <Painel titulo="Evolução do acervo" Icone={TrendingUp}>
            <AreaEvolucao pontos={evolucao} />
            <p
              style={{
                fontFamily: T.fontBody,
                fontSize: 11.5,
                color: T.textMuted,
                marginTop: 8,
                marginBottom: 0,
              }}
            >
              Itens acumulados ao longo do tempo, a partir de quando você os
              marcou.
            </p>
          </Painel>

          {/* PROGRESSO POR COLEÇÃO */}
          <Painel titulo="Mais perto de completar" Icone={Award}>
            <BarrasHorizontais barras={ranking} mostrarPorcentagem />
          </Painel>

          {/* RARIDADE */}
          {barrasRaridade.length > 0 && (
            <Painel titulo="Progresso por raridade" Icone={Award}>
              <BarrasHorizontais barras={barrasRaridade} mostrarPorcentagem />
            </Painel>
          )}

          {/* CATEGORIA */}
          {colunasCategoria.length > 1 && (
            <Painel titulo="Itens por categoria" Icone={Layers}>
              <Colunas barras={colunasCategoria} />
            </Painel>
          )}

          {/* O QUE MAIS FALTA */}
          {faltamMais.length > 0 && (
            <Painel titulo="Onde falta mais" Icone={Copy}>
              <BarrasHorizontais barras={faltamMais} limite={8} />
            </Painel>
          )}

          {/* EXPORTAR */}
          <button
            type="button"
            onClick={() => void exportar()}
            disabled={exportando !== null}
            style={{
              ...TS.botaoSecundario,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 6,
            }}
          >
            <Download size={16} />
            {exportando ? 'Gerando...' : 'Exportar CSV do que está filtrado'}
          </button>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- */

function Painel({
  titulo,
  Icone,
  children,
}: {
  titulo: string;
  Icone: typeof Award;
  children: React.ReactNode;
}) {
  return (
    <div style={{ ...TS.card, marginBottom: 12 }}>
      <div
        style={{
          ...TS.label,
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Icone size={13} />
        {titulo}
      </div>
      {children}
    </div>
  );
}

function Mini({
  rotulo,
  valor,
  cor,
}: {
  rotulo: string;
  valor: number;
  cor: string;
}) {
  return (
    <div
      style={{
        background: T.bgElevated,
        border: `1px solid ${T.border}`,
        borderRadius: T.radiusSm,
        padding: '9px 11px',
      }}
    >
      <div
        style={{
          fontFamily: T.fontTitle,
          fontSize: 16,
          fontWeight: 700,
          color: cor,
        }}
      >
        {valor}
      </div>
      <div
        style={{
          fontFamily: T.fontBody,
          fontSize: 10,
          color: T.textMuted,
          marginTop: 2,
        }}
      >
        {rotulo}
      </div>
    </div>
  );
}

/** Cores das raridades, seguindo a convenção do colecionismo. */
function corDaRaridade(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes('lend')) return T.repetida;
  if (n.includes('espec')) return T.neon;
  if (n.includes('rara') || n.includes('rar')) return T.tenho;
  if (n.includes('comum')) return T.textMuted;
  return T.falta;
}

function escapar(v: string) {
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
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
