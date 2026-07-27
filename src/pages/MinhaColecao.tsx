import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Copy,
  Circle,
  X,
  Minus,
  Plus,
  CheckSquare,
  Zap,
} from 'lucide-react';
import { T, TS } from '../theme';
import { useAuth } from '../lib/auth';
import {
  buscarColecao,
  listarItens,
  listarSubdivisoes,
  listarMeusItens,
  marcarItem,
  marcarVarios,
} from '../lib/api';
import type {
  Colecao,
  Item,
  Subdivisao,
  ItemUsuario,
  StatusItem,
} from '../lib/tipos';
import { BarraProgresso } from '../components/BarraProgresso';
import { BotaoWhatsApp } from '../components/BotaoWhatsApp';
import { BotaoCopiarLink } from '../components/BotaoCopiarLink';
import { msg } from '../lib/mensagens';

type Filtro = 'todos' | 'falta' | 'tenho' | 'repetida';

const CORES: Record<StatusItem, { cor: string; fundo: string; rotulo: string }> = {
  falta: { cor: T.falta, fundo: T.faltaFaint, rotulo: 'Falta' },
  tenho: { cor: T.tenho, fundo: T.tenhoFaint, rotulo: 'Tenho' },
  repetida: { cor: T.repetida, fundo: T.repetidaFaint, rotulo: 'Repetida' },
};

export function MinhaColecao() {
  const { id } = useParams<{ id: string }>();
  const { perfil } = useAuth();

  const [colecao, setColecao] = useState<Colecao | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [subdivisoes, setSubdivisoes] = useState<Subdivisao[]>([]);
  const [meus, setMeus] = useState<Map<string, ItemUsuario>>(new Map());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [filtroSub, setFiltroSub] = useState('');
  const [aberto, setAberto] = useState<Item | null>(null);
  const [conferencia, setConferencia] = useState(false);
  const [selecao, setSelecao] = useState<Set<string>>(new Set());

  const carregar = useCallback(async () => {
    if (!id || !perfil) return;
    try {
      const [c, i, s] = await Promise.all([
        buscarColecao(id),
        listarItens(id),
        listarSubdivisoes(id),
      ]);
      setColecao(c);
      setItens(i);
      setSubdivisoes(s);
      setMeus(await listarMeusItens(perfil.id, i.map((x) => x.id)));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar.');
    } finally {
      setCarregando(false);
    }
  }, [id, perfil]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const statusDe = useCallback(
    (itemId: string): StatusItem => meus.get(itemId)?.status ?? 'falta',
    [meus]
  );

  /** Atualiza a tela na hora e desfaz se o banco recusar. */
  const alterar = useCallback(
    async (item: Item, status: StatusItem, quantidade = 1) => {
      if (!perfil) return;
      const anterior = meus.get(item.id);

      setMeus((atual) => {
        const novo = new Map(atual);
        novo.set(item.id, {
          id: anterior?.id ?? `local-${item.id}`,
          usuario_id: perfil.id,
          item_id: item.id,
          status,
          quantidade_repetida: status === 'repetida' ? Math.max(1, quantidade) : 0,
          updated_at: new Date().toISOString(),
        });
        return novo;
      });

      try {
        await marcarItem(perfil.id, item.id, status, quantidade);
      } catch (e) {
        setMeus((atual) => {
          const novo = new Map(atual);
          if (anterior) novo.set(item.id, anterior);
          else novo.delete(item.id);
          return novo;
        });
        setErro(e instanceof Error ? e.message : 'Não consegui salvar.');
      }
    },
    [perfil, meus]
  );

  const totais = useMemo(() => {
    let tenho = 0;
    let repetidas = 0;
    let unidadesRepetidas = 0;
    for (const item of itens) {
      const linha = meus.get(item.id);
      if (!linha || linha.status === 'falta') continue;
      tenho++;
      if (linha.status === 'repetida') {
        repetidas++;
        unidadesRepetidas += linha.quantidade_repetida;
      }
    }
    return { tenho, repetidas, unidadesRepetidas, total: itens.length };
  }, [itens, meus]);

  const visiveis = useMemo(
    () =>
      itens.filter((i) => {
        if (filtroSub && i.subdivisao_id !== filtroSub) return false;
        if (filtro === 'todos') return true;
        return statusDe(i.id) === filtro;
      }),
    [itens, filtro, filtroSub, statusDe]
  );

  if (carregando) return <Caixa texto="Carregando..." />;
  if (!colecao) return <Caixa texto={erro ?? 'Coleção não encontrada.'} erro />;

  const urlColecao = `${window.location.origin}/colecoes/${colecao.id}`;
  const faltantes = totais.total - totais.tenho;

  return (
    <div>
      <Link
        to="/colecoes"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: T.textSecondary,
          textDecoration: 'none',
          fontFamily: T.fontBody,
          fontSize: 13,
          marginBottom: 14,
        }}
      >
        <ArrowLeft size={16} />
        Coleções
      </Link>

      <h1 style={{ ...TS.titulo, fontSize: 21, margin: '0 0 4px' }}>
        {colecao.nome}
      </h1>
      <div
        style={{
          fontFamily: T.fontBody,
          fontSize: 12.5,
          color: T.textMuted,
          marginBottom: 16,
        }}
      >
        <Link
          to={`/colecoes/${colecao.id}/catalogo`}
          style={{ color: T.textSecondary, textDecoration: 'underline' }}
        >
          Editar catálogo
        </Link>
      </div>

      {/* Progresso */}
      <div style={{ ...TS.card, marginBottom: 16 }}>
        <BarraProgresso tenho={totais.tenho} total={totais.total} />
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 14,
            flexWrap: 'wrap',
            fontFamily: T.fontBody,
            fontSize: 12.5,
          }}
        >
          <Numero cor={T.falta} rotulo="faltam" valor={faltantes} />
          <Numero cor={T.tenho} rotulo="tenho" valor={totais.tenho} />
          <Numero
            cor={T.repetida}
            rotulo={`repetidas${totais.unidadesRepetidas > totais.repetidas ? ` (${totais.unidadesRepetidas} un.)` : ''}`}
            valor={totais.repetidas}
          />
        </div>
      </div>

      {erro && (
        <div
          role="alert"
          style={{
            background: T.erroFaint,
            border: `1px solid ${T.erro}`,
            borderRadius: T.radiusSm,
            padding: '10px 12px',
            marginBottom: 14,
            fontSize: 13,
            color: T.erro,
            fontFamily: T.fontBody,
          }}
        >
          {erro}
        </div>
      )}

      {/* Filtros rápidos */}
      <div
        style={{ display: 'flex', gap: 7, marginBottom: 12, flexWrap: 'wrap' }}
      >
        <Pilula ativa={filtro === 'todos'} aoClicar={() => setFiltro('todos')}>
          Todos · {totais.total}
        </Pilula>
        <Pilula
          ativa={filtro === 'falta'}
          cor={T.falta}
          aoClicar={() => setFiltro('falta')}
        >
          Faltam · {faltantes}
        </Pilula>
        <Pilula
          ativa={filtro === 'tenho'}
          cor={T.tenho}
          aoClicar={() => setFiltro('tenho')}
        >
          Tenho · {totais.tenho - totais.repetidas}
        </Pilula>
        <Pilula
          ativa={filtro === 'repetida'}
          cor={T.repetida}
          aoClicar={() => setFiltro('repetida')}
        >
          Repetidas · {totais.repetidas}
        </Pilula>
      </div>

      {/* Ferramentas */}
      <div
        style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}
      >
        {subdivisoes.length > 0 && (
          <select
            value={filtroSub}
            onChange={(e) => setFiltroSub(e.target.value)}
            style={{
              ...TS.input,
              width: 'auto',
              minWidth: 140,
              padding: '9px 12px',
              fontSize: 13,
              colorScheme: 'dark',
            }}
          >
            <option value="">Todas as subdivisões</option>
            {subdivisoes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        )}

        <BotaoFerramenta
          ativa={conferencia}
          Icone={Zap}
          rotulo="Modo conferência"
          aoClicar={() => {
            setConferencia((c) => !c);
            setSelecao(new Set());
          }}
        />
        <BotaoFerramenta
          ativa={selecao.size > 0}
          Icone={CheckSquare}
          rotulo={selecao.size > 0 ? `${selecao.size} selecionados` : 'Selecionar'}
          aoClicar={() => {
            setConferencia(false);
            setSelecao((s) => (s.size > 0 ? new Set() : new Set(['__ativo__'])));
          }}
        />
      </div>

      {conferencia && (
        <Dica>
          Modo conferência ligado: cada toque marca o item como{' '}
          <strong style={{ color: T.tenho }}>tenho</strong> e segue em frente.
          Toque de novo para virar repetida.
        </Dica>
      )}

      {selecao.size > 0 && (
        <BarraSelecao
          quantidade={[...selecao].filter((x) => x !== '__ativo__').length}
          aoMarcar={async (status) => {
            const ids = [...selecao].filter((x) => x !== '__ativo__');
            if (!perfil || ids.length === 0) return;
            await marcarVarios(perfil.id, ids, status);
            setSelecao(new Set());
            await carregar();
          }}
          aoCancelar={() => setSelecao(new Set())}
        />
      )}

      {/* Grade (item 10 das decisões: compacta, abre maior ao tocar) */}
      {visiveis.length === 0 ? (
        <Caixa
          texto={
            itens.length === 0
              ? 'Esta coleção ainda não tem itens.'
              : 'Nenhum item neste filtro.'
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
            gap: 7,
          }}
        >
          {visiveis.map((item) => (
            <Celula
              key={item.id}
              item={item}
              linha={meus.get(item.id)}
              selecionavel={selecao.size > 0}
              selecionado={selecao.has(item.id)}
              aoClicar={() => {
                if (selecao.size > 0) {
                  setSelecao((s) => {
                    const novo = new Set(s);
                    if (novo.has(item.id)) novo.delete(item.id);
                    else novo.add(item.id);
                    return novo;
                  });
                } else if (conferencia) {
                  const atual = statusDe(item.id);
                  const proximo: StatusItem =
                    atual === 'falta' ? 'tenho' : atual === 'tenho' ? 'repetida' : 'falta';
                  void alterar(item, proximo);
                } else {
                  setAberto(item);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Compartilhar */}
      {totais.total > 0 && (
        <div style={{ ...TS.card, marginTop: 24 }}>
          <div style={{ ...TS.label, marginBottom: 10 }}>Divulgar</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {faltantes > 0 && (
              <div style={{ flex: '1 1 170px' }}>
                <BotaoWhatsApp
                  mensagem={msg.faltantes(colecao.nome, faltantes, urlColecao)}
                  variant="full"
                  rotulo="O que me falta"
                />
              </div>
            )}
            {totais.repetidas > 0 && (
              <div style={{ flex: '1 1 170px' }}>
                <BotaoWhatsApp
                  mensagem={msg.repetidas(
                    colecao.nome,
                    totais.unidadesRepetidas,
                    urlColecao
                  )}
                  variant="full"
                  rotulo="Minhas repetidas"
                />
              </div>
            )}
            <div style={{ flex: '1 1 150px' }}>
              <BotaoCopiarLink url={urlColecao} variant="full" />
            </div>
          </div>
        </div>
      )}

      {aberto && (
        <ModalItem
          item={aberto}
          linha={meus.get(aberto.id)}
          aoFechar={() => setAberto(null)}
          aoAlterar={(status, qtd) => void alterar(aberto, status, qtd)}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------- */

function Celula({
  item,
  linha,
  selecionavel,
  selecionado,
  aoClicar,
}: {
  item: Item;
  linha?: ItemUsuario;
  selecionavel: boolean;
  selecionado: boolean;
  aoClicar: () => void;
}) {
  const status: StatusItem = linha?.status ?? 'falta';
  const { cor, fundo } = CORES[status];
  const tenho = status !== 'falta';

  return (
    <button
      type="button"
      onClick={aoClicar}
      title={item.nome}
      style={{
        position: 'relative',
        aspectRatio: '3 / 4',
        background: tenho ? fundo : T.bgElevated,
        border: `1.5px solid ${selecionado ? T.neon : tenho ? cor : T.border}`,
        borderRadius: T.radiusSm,
        padding: 4,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        overflow: 'hidden',
        opacity: tenho ? 1 : 0.55,
        transition: 'all 0.12s',
      }}
    >
      {item.foto_url ? (
        <img
          src={item.foto_url}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: tenho ? 'none' : 'grayscale(1)',
          }}
        />
      ) : null}

      <span
        style={{
          position: 'relative',
          fontFamily: T.fontTitle,
          fontSize: 13,
          fontWeight: 700,
          color: tenho ? cor : T.textMuted,
          textShadow: item.foto_url ? '0 1px 4px rgba(0,0,0,0.9)' : 'none',
        }}
      >
        {item.numero || item.nome.slice(0, 6)}
      </span>

      {status === 'repetida' && (linha?.quantidade_repetida ?? 0) > 1 && (
        <span
          style={{
            position: 'absolute',
            top: 3,
            right: 3,
            background: T.repetida,
            color: '#1A1000',
            borderRadius: 99,
            minWidth: 16,
            height: 16,
            fontSize: 10,
            fontWeight: 800,
            fontFamily: T.fontBody,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
          }}
        >
          {linha!.quantidade_repetida}
        </span>
      )}

      {selecionavel && selecionado && (
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: 3,
            background: T.neon,
            borderRadius: 4,
            display: 'flex',
            padding: 1,
          }}
        >
          <Check size={11} color="#00121F" strokeWidth={3.5} />
        </span>
      )}
    </button>
  );
}

function ModalItem({
  item,
  linha,
  aoFechar,
  aoAlterar,
}: {
  item: Item;
  linha?: ItemUsuario;
  aoFechar: () => void;
  aoAlterar: (status: StatusItem, quantidade?: number) => void;
}) {
  const status: StatusItem = linha?.status ?? 'falta';
  const qtd = linha?.quantidade_repetida ?? 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={aoFechar}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 90,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: T.radiusLg,
          width: '100%',
          maxWidth: 340,
          overflow: 'hidden',
        }}
      >
        {item.foto_url && (
          <img
            src={item.foto_url}
            alt={item.nome}
            style={{
              width: '100%',
              aspectRatio: '3 / 4',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )}

        <div style={{ padding: 18 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div style={{ minWidth: 0 }}>
              {item.numero && (
                <div
                  style={{
                    fontFamily: T.fontTitle,
                    fontSize: 17,
                    fontWeight: 700,
                    color: T.neon,
                  }}
                >
                  {item.numero}
                </div>
              )}
              <div
                style={{
                  fontFamily: T.fontBody,
                  fontSize: 14.5,
                  color: T.textPrimary,
                  marginTop: 2,
                }}
              >
                {item.nome}
              </div>
              {(item.categoria || item.raridade) && (
                <div
                  style={{
                    fontFamily: T.fontBody,
                    fontSize: 12,
                    color: T.textMuted,
                    marginTop: 4,
                  }}
                >
                  {[item.categoria, item.raridade].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={aoFechar}
              aria-label="Fechar"
              style={{
                background: 'transparent',
                border: 'none',
                color: T.textMuted,
                cursor: 'pointer',
                display: 'flex',
                padding: 2,
              }}
            >
              <X size={19} />
            </button>
          </div>

          {/* Botões separados por status (decisão 8) */}
          <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
            <BotaoStatus
              alvo="falta"
              atual={status}
              Icone={Circle}
              aoClicar={() => aoAlterar('falta')}
            />
            <BotaoStatus
              alvo="tenho"
              atual={status}
              Icone={Check}
              aoClicar={() => aoAlterar('tenho')}
            />
            <BotaoStatus
              alvo="repetida"
              atual={status}
              Icone={Copy}
              aoClicar={() => aoAlterar('repetida', Math.max(1, qtd))}
            />
          </div>

          {/* Quantidade de repetidas (decisão 9) */}
          {status === 'repetida' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                background: T.repetidaFaint,
                border: `1px solid ${T.repetida}`,
                borderRadius: T.radiusSm,
                padding: '10px 12px',
              }}
            >
              <span
                style={{
                  fontFamily: T.fontBody,
                  fontSize: 13,
                  color: T.textSecondary,
                }}
              >
                Quantas eu tenho sobrando
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BotaoQtd
                  Icone={Minus}
                  desabilitado={qtd <= 1}
                  aoClicar={() => aoAlterar('repetida', qtd - 1)}
                />
                <span
                  style={{
                    fontFamily: T.fontTitle,
                    fontSize: 16,
                    fontWeight: 700,
                    color: T.repetida,
                    minWidth: 20,
                    textAlign: 'center',
                  }}
                >
                  {qtd}
                </span>
                <BotaoQtd
                  Icone={Plus}
                  aoClicar={() => aoAlterar('repetida', qtd + 1)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BotaoStatus({
  alvo,
  atual,
  Icone,
  aoClicar,
}: {
  alvo: StatusItem;
  atual: StatusItem;
  Icone: typeof Check;
  aoClicar: () => void;
}) {
  const ativo = atual === alvo;
  const { cor, fundo, rotulo } = CORES[alvo];

  return (
    <button
      type="button"
      onClick={aoClicar}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        padding: '11px 6px',
        background: ativo ? fundo : 'transparent',
        border: `1.5px solid ${ativo ? cor : T.border}`,
        borderRadius: T.radiusSm,
        color: ativo ? cor : T.textMuted,
        fontSize: 11.5,
        fontWeight: ativo ? 700 : 500,
        fontFamily: T.fontBody,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <Icone size={17} strokeWidth={ativo ? 2.6 : 2} />
      {rotulo}
    </button>
  );
}

function BotaoQtd({
  Icone,
  aoClicar,
  desabilitado = false,
}: {
  Icone: typeof Plus;
  aoClicar: () => void;
  desabilitado?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      disabled={desabilitado}
      style={{
        background: 'transparent',
        border: `1px solid ${T.repetida}`,
        borderRadius: 6,
        color: T.repetida,
        cursor: desabilitado ? 'not-allowed' : 'pointer',
        opacity: desabilitado ? 0.35 : 1,
        display: 'flex',
        padding: 5,
      }}
    >
      <Icone size={14} />
    </button>
  );
}

function BarraSelecao({
  quantidade,
  aoMarcar,
  aoCancelar,
}: {
  quantidade: number;
  aoMarcar: (s: StatusItem) => Promise<void>;
  aoCancelar: () => void;
}) {
  return (
    <div
      style={{
        ...TS.card,
        marginBottom: 14,
        borderColor: T.neonBorder,
        background: T.neonFaint,
      }}
    >
      <div
        style={{
          fontFamily: T.fontBody,
          fontSize: 13,
          color: T.textPrimary,
          marginBottom: 10,
        }}
      >
        {quantidade === 0
          ? 'Toque nos itens para selecionar.'
          : `${quantidade} ${quantidade === 1 ? 'item selecionado' : 'itens selecionados'}. Marcar como:`}
      </div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {(['falta', 'tenho', 'repetida'] as StatusItem[]).map((s) => (
          <button
            key={s}
            type="button"
            disabled={quantidade === 0}
            onClick={() => void aoMarcar(s)}
            style={{
              flex: '1 1 90px',
              padding: '9px 10px',
              background: 'transparent',
              border: `1.5px solid ${CORES[s].cor}`,
              borderRadius: T.radiusSm,
              color: CORES[s].cor,
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: T.fontBody,
              cursor: quantidade === 0 ? 'not-allowed' : 'pointer',
              opacity: quantidade === 0 ? 0.4 : 1,
            }}
          >
            {CORES[s].rotulo}
          </button>
        ))}
        <button
          type="button"
          onClick={aoCancelar}
          style={{
            padding: '9px 14px',
            background: 'transparent',
            border: `1px solid ${T.border}`,
            borderRadius: T.radiusSm,
            color: T.textMuted,
            fontSize: 12.5,
            fontFamily: T.fontBody,
            cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function BotaoFerramenta({
  ativa,
  Icone,
  rotulo,
  aoClicar,
}: {
  ativa: boolean;
  Icone: typeof Zap;
  rotulo: string;
  aoClicar: () => void;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '9px 13px',
        background: ativa ? T.neonFaint : 'transparent',
        border: `1.5px solid ${ativa ? T.neon : T.border}`,
        borderRadius: T.radius,
        color: ativa ? T.neon : T.textSecondary,
        fontSize: 12.5,
        fontWeight: 600,
        fontFamily: T.fontBody,
        cursor: 'pointer',
      }}
    >
      <Icone size={15} />
      {rotulo}
    </button>
  );
}

function Pilula({
  ativa,
  cor = T.neon,
  aoClicar,
  children,
}: {
  ativa: boolean;
  cor?: string;
  aoClicar: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      style={{
        padding: '7px 13px',
        borderRadius: 99,
        border: `1.5px solid ${ativa ? cor : T.border}`,
        background: ativa ? `${cor}1A` : 'transparent',
        color: ativa ? cor : T.textSecondary,
        fontSize: 12.5,
        fontWeight: ativa ? 700 : 500,
        fontFamily: T.fontBody,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

function Numero({
  cor,
  rotulo,
  valor,
}: {
  cor: string;
  rotulo: string;
  valor: number;
}) {
  return (
    <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
      <strong style={{ color: cor, fontSize: 15, fontWeight: 700 }}>
        {valor}
      </strong>
      <span style={{ color: T.textMuted }}>{rotulo}</span>
    </span>
  );
}

function Dica({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: T.neonFaint,
        border: `1px solid ${T.neonBorder}`,
        borderRadius: T.radiusSm,
        padding: '10px 12px',
        marginBottom: 14,
        fontFamily: T.fontBody,
        fontSize: 12.5,
        color: T.textSecondary,
        lineHeight: 1.55,
      }}
    >
      {children}
    </div>
  );
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
      }}
    >
      {texto}
    </div>
  );
}
