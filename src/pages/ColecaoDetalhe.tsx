import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  BadgeCheck,
  Layers,
  Trash2,
  Search,
  Pencil,
} from 'lucide-react';
import { T, TS } from '../theme';
import { useAuth } from '../lib/auth';
import {
  buscarColecao,
  listarItens,
  listarSubdivisoes,
  criarSubdivisao,
  apagarItem,
  apagarColecao,
  atualizarItem,
} from '../lib/api';
import type { Colecao, Item, Subdivisao } from '../lib/tipos';
import { RARIDADES } from '../lib/tipos';
import { UploadImagem } from '../components/UploadImagem';
import { BlocoSubdivisao } from '../components/BlocoSubdivisao';
import { AdicionarItens } from '../components/AdicionarItens';
import { Modal } from './Colecoes';

export function ColecaoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { perfil } = useAuth();
  const navigate = useNavigate();

  const [colecao, setColecao] = useState<Colecao | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [subdivisoes, setSubdivisoes] = useState<Subdivisao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modal, setModal] = useState<'itens' | 'subdivisao' | 'apagar' | null>(
    null
  );
  const [busca, setBusca] = useState('');
  const [recolhidos, setRecolhidos] = useState<Set<string>>(new Set());
  const [resumo, setResumo] = useState<string | null>(null);
  const [editando, setEditando] = useState<Item | null>(null);

  const carregar = useCallback(async () => {
    if (!id) return;
    try {
      const [c, i, s] = await Promise.all([
        buscarColecao(id),
        listarItens(id),
        listarSubdivisoes(id),
      ]);
      setColecao(c);
      setItens(i);
      setSubdivisoes(s);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar.');
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (carregando) return <Aviso texto="Carregando..." />;
  if (erro) return <Aviso texto={erro} erro />;
  if (!colecao) return <Aviso texto="Coleção não encontrada." erro />;

  const ehDono = perfil?.id === colecao.dono_id;

  const removerItem = async (item: Item) => {
    await apagarItem(item.id);
    setItens((a) => a.filter((x) => x.id !== item.id));
  };

  const filtrados = itens.filter((i) => {
    if (!busca.trim()) return true;
    const t = busca.trim().toLowerCase();
    return (
      i.nome.toLowerCase().includes(t) ||
      (i.numero ?? '').toLowerCase().includes(t) ||
      (i.categoria ?? '').toLowerCase().includes(t)
    );
  });

  const grupos = agrupar(itens, filtrados, subdivisoes);

  return (
    <div>
      <Link
        to={`/colecoes/${id}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: T.textSecondary,
          textDecoration: 'none',
          fontFamily: T.fontBody,
          fontSize: 13,
          marginBottom: 16,
        }}
      >
        <ArrowLeft size={16} />
        Voltar para a coleção
      </Link>

      {/* Cabeçalho */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 22,
        }}
      >
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          <h1
            style={{
              ...TS.titulo,
              fontSize: 22,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {colecao.nome}
            {colecao.oficial && <BadgeCheck size={18} color={T.neon} />}
          </h1>
          <div
            style={{
              fontFamily: T.fontBody,
              fontSize: 13,
              color: T.textSecondary,
              marginTop: 5,
            }}
          >
            {itens.length} {itens.length === 1 ? 'item' : 'itens'}
            {colecao.categoria && ` · ${colecao.categoria}`}
            {colecao.ano && ` · ${colecao.ano}`}
          </div>
        </div>

        {ehDono && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setModal('subdivisao')}
              style={{
                ...TS.botaoSecundario,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 14px',
              }}
            >
              <Layers size={16} />
              Subdivisão
            </button>
            <button
              type="button"
              onClick={() => setModal('itens')}
              style={{
                ...TS.botaoPrimario,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
              }}
            >
              <Plus size={16} />
              Adicionar itens
            </button>
          </div>
        )}
      </div>

      {resumo && (
        <div
          style={{
            background: T.tenhoFaint,
            border: `1px solid ${T.tenho}`,
            borderRadius: T.radiusSm,
            padding: '10px 12px',
            marginBottom: 16,
            fontSize: 13,
            color: T.tenho,
            fontFamily: T.fontBody,
          }}
        >
          {resumo}
        </div>
      )}

      {/* Filtros */}
      {itens.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 200px', position: 'relative' }}>
            <Search
              size={16}
              color={T.textMuted}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por número, nome ou categoria"
              style={{ ...TS.input, paddingLeft: 36 }}
            />
          </div>
        </div>
      )}

      {/* Catálogo */}
      {itens.length === 0 ? (
        <Aviso
          texto={
            ehDono
              ? 'Nenhum item ainda. Use "Adicionar itens" para começar.'
              : 'Esta coleção ainda não tem itens.'
          }
        />
      ) : filtrados.length === 0 ? (
        <Aviso texto="Nenhum item encontrado com esse filtro." />
      ) : grupos.length === 1 && grupos[0].id === null ? (
        <GradeCatalogo
          itens={filtrados}
          ehDono={ehDono}
          aoEditar={setEditando}
          aoApagar={removerItem}
        />
      ) : (
        grupos.map((g) => (
          <BlocoSubdivisao
            key={g.id ?? 'avulsos'}
            titulo={g.nome}
            contagem={g.total}
            recolhido={recolhidos.has(g.id ?? 'avulsos')}
            aoAlternar={() =>
              setRecolhidos((r) => {
                const novo = new Set(r);
                const chave = g.id ?? 'avulsos';
                if (novo.has(chave)) novo.delete(chave);
                else novo.add(chave);
                return novo;
              })
            }
          >
            {g.visiveis.length === 0 ? (
              <div
                style={{
                  fontFamily: T.fontBody,
                  fontSize: 12.5,
                  color: T.textMuted,
                  padding: '4px 2px',
                }}
              >
                Nenhum item deste bloco na busca atual.
              </div>
            ) : (
              <GradeCatalogo
                itens={g.visiveis}
                ehDono={ehDono}
                aoEditar={setEditando}
                aoApagar={removerItem}
              />
            )}
          </BlocoSubdivisao>
        ))
      )}

      {/* Zona de risco */}
      {ehDono && (
        <div style={{ marginTop: 40 }}>
          <button
            type="button"
            onClick={() => setModal('apagar')}
            style={{
              background: 'transparent',
              border: `1px solid ${T.erro}`,
              borderRadius: T.radius,
              color: T.erro,
              padding: '10px 16px',
              fontSize: 13,
              fontFamily: T.fontBody,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Apagar esta coleção
          </button>
        </div>
      )}

      {/* Modais */}
      {modal === 'itens' && (
        <Modal titulo="Adicionar itens" aoFechar={() => setModal(null)}>
          <AdicionarItens
            colecaoId={colecao.id}
            subdivisoes={subdivisoes}
            ordemInicial={itens.length}
            aoConcluir={async ({ inseridos, duplicados }) => {
              setModal(null);
              setResumo(
                duplicados > 0
                  ? `${inseridos} itens adicionados. ${duplicados} ignorados por número repetido.`
                  : `${inseridos} itens adicionados.`
              );
              await carregar();
              setTimeout(() => setResumo(null), 6000);
            }}
          />
        </Modal>
      )}

      {modal === 'subdivisao' && (
        <ModalSubdivisao
          colecaoId={colecao.id}
          subdivisoes={subdivisoes}
          aoFechar={() => setModal(null)}
          aoMudar={carregar}
        />
      )}

      {editando && (
        <ModalEditarItem
          item={editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={async (dados) => {
            await atualizarItem(editando.id, dados);
            setEditando(null);
            await carregar();
          }}
        />
      )}

      {modal === 'apagar' && (
        <Modal titulo="Apagar coleção" aoFechar={() => setModal(null)}>
          <p
            style={{
              fontFamily: T.fontBody,
              fontSize: 14,
              color: T.textSecondary,
              lineHeight: 1.6,
              marginTop: 0,
            }}
          >
            Isso apaga <strong style={{ color: T.textPrimary }}>{colecao.nome}</strong>{' '}
            e todos os {itens.length} itens dela. Quem adotou esta coleção também
            perde o progresso. Não dá para desfazer.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              onClick={() => setModal(null)}
              style={{ ...TS.botaoSecundario, flex: 1 }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                await apagarColecao(colecao.id);
                navigate('/colecoes');
              }}
              style={{
                flex: 1,
                background: T.erro,
                color: '#fff',
                border: 'none',
                borderRadius: T.radius,
                padding: '12px 20px',
                fontSize: 14,
                fontWeight: 700,
                fontFamily: T.fontBody,
                cursor: 'pointer',
              }}
            >
              Apagar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- */

function CartaoItem({
  item,
  ehDono,
  aoApagar,
  aoEditar,
}: {
  item: Item;
  ehDono: boolean;
  aoApagar: () => Promise<void>;
  aoEditar: () => void;
}) {
  const [sobre, setSobre] = useState(false);

  return (
    <div
      onMouseEnter={() => setSobre(true)}
      onMouseLeave={() => setSobre(false)}
      style={{
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: T.radiusSm,
        padding: 10,
        position: 'relative',
        minHeight: 74,
      }}
    >
      {item.foto_url && (
        <img
          src={item.foto_url}
          alt=""
          style={{
            width: '100%',
            aspectRatio: '3 / 4',
            objectFit: 'cover',
            borderRadius: 4,
            marginBottom: 7,
            display: 'block',
          }}
        />
      )}

      {item.numero && (
        <div
          style={{
            fontFamily: T.fontTitle,
            fontSize: 13,
            fontWeight: 700,
            color: T.neon,
            marginBottom: 3,
          }}
        >
          {item.numero}
        </div>
      )}
      <div
        style={{
          fontFamily: T.fontBody,
          fontSize: 12.5,
          color: T.textPrimary,
          lineHeight: 1.35,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {item.nome}
      </div>
      {item.raridade && (
        <div
          style={{
            fontFamily: T.fontBody,
            fontSize: 10.5,
            color: T.textMuted,
            marginTop: 4,
          }}
        >
          {item.raridade}
        </div>
      )}

      {ehDono && sobre && (
        <button
          type="button"
          aria-label={`Editar ${item.nome}`}
          onClick={aoEditar}
          style={{
            position: 'absolute',
            top: 5,
            left: 5,
            background: T.bgElevated,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            color: T.neon,
            cursor: 'pointer',
            display: 'flex',
            padding: 4,
          }}
        >
          <Pencil size={13} />
        </button>
      )}

      {ehDono && sobre && (
        <button
          type="button"
          aria-label={`Apagar ${item.nome}`}
          onClick={() => void aoApagar()}
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            background: T.bgElevated,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            color: T.erro,
            cursor: 'pointer',
            display: 'flex',
            padding: 4,
          }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

function ModalEditarItem({
  item,
  aoFechar,
  aoSalvar,
}: {
  item: Item;
  aoFechar: () => void;
  aoSalvar: (dados: {
    numero: string | null;
    nome: string;
    categoria: string | null;
    raridade: string | null;
    foto_url: string | null;
  }) => Promise<void>;
}) {
  const [numero, setNumero] = useState(item.numero ?? '');
  const [nome, setNome] = useState(item.nome);
  const [categoria, setCategoria] = useState(item.categoria ?? '');
  const [raridade, setRaridade] = useState(item.raridade ?? '');
  const [fotoUrl, setFotoUrl] = useState<string | null>(item.foto_url);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  return (
    <Modal titulo="Editar item" aoFechar={aoFechar}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setErro(null);
          setSalvando(true);
          try {
            await aoSalvar({
              numero: numero.trim() || null,
              nome: nome.trim(),
              categoria: categoria.trim() || null,
              raridade: raridade || null,
              foto_url: fotoUrl,
            });
          } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao salvar.');
            setSalvando(false);
          }
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={TS.label}>Foto</label>
          <UploadImagem
            valor={fotoUrl}
            aoMudar={setFotoUrl}
            pasta="itens"
            formato="retrato"
            tamanho={96}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 100 }}>
            <label style={TS.label} htmlFor="ed-num">Número</label>
            <input
              id="ed-num"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              style={TS.input}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={TS.label} htmlFor="ed-nome">Nome</label>
            <input
              id="ed-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              style={TS.input}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={TS.label} htmlFor="ed-cat">Categoria</label>
            <input
              id="ed-cat"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              style={TS.input}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={TS.label} htmlFor="ed-rar">Raridade</label>
            <select
              id="ed-rar"
              value={raridade}
              onChange={(e) => setRaridade(e.target.value)}
              style={{ ...TS.input, colorScheme: 'dark' }}
            >
              <option value="">Nenhuma</option>
              {RARIDADES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
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
              marginBottom: 12,
              fontSize: 13,
              color: T.erro,
              fontFamily: T.fontBody,
            }}
          >
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={salvando}
          style={{ ...TS.botaoPrimario, width: '100%', opacity: salvando ? 0.6 : 1 }}
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </Modal>
  );
}

function ModalSubdivisao({
  colecaoId,
  subdivisoes,
  aoFechar,
  aoMudar,
}: {
  colecaoId: string;
  subdivisoes: Subdivisao[];
  aoFechar: () => void;
  aoMudar: () => Promise<void>;
}) {
  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);

  return (
    <Modal titulo="Subdivisões" aoFechar={aoFechar}>
      <p
        style={{
          fontFamily: T.fontBody,
          fontSize: 13,
          color: T.textSecondary,
          marginTop: 0,
          marginBottom: 16,
          lineHeight: 1.55,
        }}
      >
        Páginas, séries ou temporadas dentro da coleção.
      </p>

      {subdivisoes.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {subdivisoes.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                background: T.bgElevated,
                border: `1px solid ${T.border}`,
                borderRadius: T.radiusSm,
                marginBottom: 6,
                fontFamily: T.fontBody,
                fontSize: 13.5,
                color: T.textPrimary,
              }}
            >
              {s.nome}
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!nome.trim()) return;
          setSalvando(true);
          await criarSubdivisao(colecaoId, nome, subdivisoes.length);
          setNome('');
          await aoMudar();
          setSalvando(false);
        }}
        style={{ display: 'flex', gap: 8 }}
      >
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="ex: Página 1"
          style={{ ...TS.input, flex: 1 }}
        />
        <button
          type="submit"
          disabled={salvando || !nome.trim()}
          style={{
            ...TS.botaoPrimario,
            padding: '12px 16px',
            opacity: salvando || !nome.trim() ? 0.5 : 1,
          }}
        >
          <Plus size={17} />
        </button>
      </form>
    </Modal>
  );
}

function agrupar(
  todos: Item[],
  visiveis: Item[],
  subdivisoes: Subdivisao[]
) {
  const porSub = new Map<string | null, Item[]>();
  for (const i of visiveis) {
    if (!porSub.has(i.subdivisao_id)) porSub.set(i.subdivisao_id, []);
    porSub.get(i.subdivisao_id)!.push(i);
  }

  const total = (chave: string | null) =>
    todos.filter((i) => i.subdivisao_id === chave).length;

  const lista: {
    id: string | null;
    nome: string;
    visiveis: Item[];
    total: number;
  }[] = [];

  for (const sub of subdivisoes) {
    const t = total(sub.id);
    if (t === 0) continue;
    lista.push({
      id: sub.id,
      nome: sub.nome,
      visiveis: porSub.get(sub.id) ?? [],
      total: t,
    });
  }

  const avulsos = total(null);
  if (avulsos > 0) {
    lista.push({
      id: null,
      nome: subdivisoes.length > 0 ? 'Sem subdivisão' : 'Todos os itens',
      visiveis: porSub.get(null) ?? [],
      total: avulsos,
    });
  }

  return lista;
}

function GradeCatalogo({
  itens,
  ehDono,
  aoEditar,
  aoApagar,
}: {
  itens: Item[];
  ehDono: boolean;
  aoEditar: (i: Item) => void;
  aoApagar: (i: Item) => Promise<void>;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))',
        gap: 8,
      }}
    >
      {itens.map((item) => (
        <CartaoItem
          key={item.id}
          item={item}
          ehDono={ehDono}
          aoEditar={() => aoEditar(item)}
          aoApagar={() => aoApagar(item)}
        />
      ))}
    </div>
  );
}

function Aviso({ texto, erro = false }: { texto: string; erro?: boolean }) {
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
