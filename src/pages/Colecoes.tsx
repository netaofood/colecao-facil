import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Library, LayoutGrid, FolderTree } from 'lucide-react';
import { T, TS } from '../theme';
import { useAuth } from '../lib/auth';
import {
  listarMinhasColecoes,
  criarColecao,
  listarCategoriasDasColecoes,
} from '../lib/api';
import { InputCategoria } from '../components/InputCategoria';
import { usePodeCadastrar } from '../components/AvisoAssinatura';
import type { ColecaoComProgresso } from '../lib/tipos';
import { BarraProgresso } from '../components/BarraProgresso';
import { BlocoSubdivisao } from '../components/BlocoSubdivisao';

export function Colecoes() {
  const { perfil } = useAuth();
  const navigate = useNavigate();

  const [minhas, setMinhas] = useState<ColecaoComProgresso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modal, setModal] = useState<'branco' | null>(null);
  const [categorias, setCategorias] = useState<string[]>([]);
  const podeCadastrar = usePodeCadastrar();
  const [agrupar, setAgrupar] = useState(true);
  const [recolhidos, setRecolhidos] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!perfil) return;
    listarCategoriasDasColecoes(perfil.id)
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, [perfil]);

  const carregar = useCallback(async () => {
    if (!perfil) return;
    try {
      setMinhas(await listarMinhasColecoes(perfil.id));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar.');
    } finally {
      setCarregando(false);
    }
  }, [perfil]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const grupos = agruparPorCategoria(minhas);
  const valeAgrupar = grupos.length > 1;

  return (
    <div>
      <h1 style={{ ...TS.titulo, fontSize: 22, marginBottom: 4 }}>
        Minhas coleções
      </h1>
      <p
        style={{
          fontFamily: T.fontBody,
          fontSize: 13.5,
          color: T.textSecondary,
          marginTop: 0,
          marginBottom: 22,
        }}
      >
        {minhas.length === 0
          ? 'Você ainda não tem nenhuma coleção.'
          : `${minhas.length} ${minhas.length === 1 ? 'coleção' : 'coleções'} em andamento.`}
      </p>

      {/* Item 1 das decisões: as duas portas de entrada lado a lado */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 12,
          marginBottom: 28,
          maxWidth: 380,
        }}
      >
        <PortaEntrada
          Icone={Plus}
          titulo="Nova coleção"
          texto={
            podeCadastrar
              ? 'Cadastre os itens do seu jeito.'
              : 'Indisponível: assinatura vencida.'
          }
          aoClicar={() => podeCadastrar && setModal('branco')}
          desabilitada={!podeCadastrar}
        />
      </div>

      {erro && (
        <div
          role="alert"
          style={{
            background: T.erroFaint,
            border: `1px solid ${T.erro}`,
            borderRadius: T.radiusSm,
            padding: '10px 12px',
            marginBottom: 16,
            fontSize: 13,
            color: T.erro,
            fontFamily: T.fontBody,
          }}
        >
          {erro}
        </div>
      )}

      {valeAgrupar && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <BotaoVisao
            ativa={agrupar}
            Icone={FolderTree}
            rotulo="Por categoria"
            aoClicar={() => setAgrupar(true)}
          />
          <BotaoVisao
            ativa={!agrupar}
            Icone={LayoutGrid}
            rotulo="Tudo junto"
            aoClicar={() => setAgrupar(false)}
          />
        </div>
      )}

      {carregando ? (
        <Aviso texto="Carregando..." />
      ) : minhas.length === 0 ? (
        <Aviso texto="Crie sua primeira coleção acima." />
      ) : agrupar && valeAgrupar ? (
        grupos.map((g) => (
          <BlocoSubdivisao
            key={g.chave}
            titulo={g.nome}
            progresso={{ tenho: g.tenho, total: g.total }}
            recolhido={recolhidos.has(g.chave)}
            aoAlternar={() =>
              setRecolhidos((r) => {
                const novo = new Set(r);
                if (novo.has(g.chave)) novo.delete(g.chave);
                else novo.add(g.chave);
                return novo;
              })
            }
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 12,
              }}
            >
              {g.colecoes.map((c) => (
                <CartaoColecao key={c.id} colecao={c} />
              ))}
            </div>
          </BlocoSubdivisao>
        ))
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 14,
          }}
        >
          {minhas.map((c) => (
            <CartaoColecao key={c.id} colecao={c} />
          ))}
        </div>
      )}

      {modal === 'branco' && (
        <ModalNovaColecao
          categorias={categorias}
          aoFechar={() => setModal(null)}
          aoCriar={async (dados) => {
            const nova = await criarColecao({ ...dados, dono_id: perfil!.id });
            setModal(null);
            navigate(`/colecoes/${nova.id}`);
          }}
        />
      )}

    </div>
  );
}

/* -------------------------------------------------------------- */

interface GrupoCategoria {
  chave: string;
  nome: string;
  colecoes: ColecaoComProgresso[];
  tenho: number;
  total: number;
}

/** Agrupa por categoria, com as sem categoria por último. */
function agruparPorCategoria(
  colecoes: ColecaoComProgresso[]
): GrupoCategoria[] {
  const mapa = new Map<string, GrupoCategoria>();

  for (const c of colecoes) {
    const nome = c.categoria?.trim() || 'Sem categoria';
    const chave = nome.toLowerCase();

    if (!mapa.has(chave)) {
      mapa.set(chave, { chave, nome, colecoes: [], tenho: 0, total: 0 });
    }
    const g = mapa.get(chave)!;
    g.colecoes.push(c);
    g.tenho += c.total_tenho;
    g.total += c.total_itens;
  }

  return [...mapa.values()].sort((a, b) => {
    if (a.chave === 'sem categoria') return 1;
    if (b.chave === 'sem categoria') return -1;
    return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
  });
}

function BotaoVisao({
  ativa,
  Icone,
  rotulo,
  aoClicar,
}: {
  ativa: boolean;
  Icone: typeof LayoutGrid;
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
        padding: '8px 13px',
        borderRadius: 99,
        border: `1.5px solid ${ativa ? T.neon : T.border}`,
        background: ativa ? T.neonFaint : 'transparent',
        color: ativa ? T.neon : T.textSecondary,
        fontFamily: T.fontBody,
        fontSize: 12.5,
        fontWeight: ativa ? 700 : 500,
        cursor: 'pointer',
      }}
    >
      <Icone size={14} />
      {rotulo}
    </button>
  );
}

function PortaEntrada({
  Icone,
  titulo,
  texto,
  aoClicar,
  destaque = false,
  desabilitada = false,
}: {
  Icone: typeof Plus;
  titulo: string;
  texto: string;
  aoClicar: () => void;
  destaque?: boolean;
  desabilitada?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      style={{
        ...TS.card,
        textAlign: 'left',
        cursor: desabilitada ? 'not-allowed' : 'pointer',
        opacity: desabilitada ? 0.5 : 1,
        background: destaque ? T.neonFaint : T.bgCard,
        borderColor: destaque ? T.neonBorder : T.border,
        transition: 'all 0.15s',
      }}
    >
      <Icone size={21} color={T.neon} />
      <div style={{ ...TS.titulo, fontSize: 14.5, marginTop: 11, marginBottom: 4 }}>
        {titulo}
      </div>
      <div
        style={{
          fontFamily: T.fontBody,
          fontSize: 12.5,
          color: T.textSecondary,
          lineHeight: 1.5,
        }}
      >
        {texto}
      </div>
    </button>
  );
}

function CartaoColecao({ colecao }: { colecao: ColecaoComProgresso }) {
  return (
    <Link
      to={`/colecoes/${colecao.id}`}
      style={{ ...TS.card, textDecoration: 'none', display: 'block' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <Library size={18} color={T.neon} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              ...TS.titulo,
              fontSize: 14.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {colecao.nome}
          </div>
          <div
            style={{
              fontFamily: T.fontBody,
              fontSize: 11.5,
              color: T.textMuted,
              marginTop: 2,
            }}
          >
            {[colecao.categoria, colecao.ano].filter(Boolean).join(' · ') ||
              'Sem categoria'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {colecao.total_repetidas > 0 && (
          <Etiqueta
            texto={`${colecao.total_repetidas} repetida${colecao.total_repetidas > 1 ? 's' : ''}`}
            cor={T.repetida}
          />
        )}
      </div>

      <BarraProgresso
        tenho={colecao.total_tenho}
        total={colecao.total_itens}
        compacta
      />
    </Link>
  );
}

function Etiqueta({
  Icone,
  texto,
  cor,
}: {
  Icone?: typeof Library;
  texto: string;
  cor: string;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 99,
        border: `1px solid ${cor}`,
        color: cor,
        fontSize: 10.5,
        fontWeight: 600,
        fontFamily: T.fontBody,
        letterSpacing: 0.3,
      }}
    >
      {Icone && <Icone size={11} />}
      {texto}
    </span>
  );
}

function Aviso({ texto }: { texto: string }) {
  return (
    <div
      style={{
        ...TS.card,
        textAlign: 'center',
        color: T.textMuted,
        fontFamily: T.fontBody,
        fontSize: 13.5,
      }}
    >
      {texto}
    </div>
  );
}

/* -------------------------------------------------------------- */
/* MODAIS                                                          */
/* -------------------------------------------------------------- */

function ModalNovaColecao({
  categorias,
  aoFechar,
  aoCriar,
}: {
  categorias: string[];
  aoFechar: () => void;
  aoCriar: (dados: {
    nome: string;
    descricao: string;
    categoria: string;
    ano: number | null;
  }) => Promise<void>;
}) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [ano, setAno] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  return (
    <Modal titulo="Nova coleção" aoFechar={aoFechar}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setErro(null);
          setSalvando(true);
          try {
            await aoCriar({
              nome,
              descricao,
              categoria,
              ano: ano ? Number(ano) : null,
            });
          } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao criar.');
            setSalvando(false);
          }
        }}
      >
        <CampoModal rotulo="Nome" id="nome-colecao">
          <input
            id="nome-colecao"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            autoFocus
            placeholder="ex: Álbum da Copa 2026"
            style={TS.input}
          />
        </CampoModal>

        <CampoModal rotulo="Categoria" id="cat-colecao">
          <InputCategoria
            id="cat-colecao"
            valor={categoria}
            aoMudar={setCategoria}
            sugestoes={categorias}
            placeholder="ex: Figurinhas"
          />
        </CampoModal>

        <CampoModal rotulo="Ano" id="ano-colecao">
          <input
            id="ano-colecao"
            type="number"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            min={1800}
            max={2200}
            placeholder="ex: 2026"
            style={TS.input}
          />
        </CampoModal>

        <CampoModal rotulo="Descrição" id="desc-colecao">
          <textarea
            id="desc-colecao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
            style={{ ...TS.input, resize: 'vertical', fontFamily: T.fontBody }}
          />
        </CampoModal>

        {erro && <ErroModal>{erro}</ErroModal>}

        <button
          type="submit"
          disabled={salvando}
          style={{ ...TS.botaoPrimario, width: '100%', opacity: salvando ? 0.6 : 1 }}
        >
          {salvando ? 'Criando...' : 'Criar coleção'}
        </button>
      </form>
    </Modal>
  );
}


/* -------------------------------------------------------------- */

export function Modal({
  titulo,
  aoFechar,
  children,
}: {
  titulo: string;
  aoFechar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onClick={aoFechar}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
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
          maxWidth: 460,
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: 22,
        }}
      >
        <div style={{ ...TS.titulo, fontSize: 16, marginBottom: 18 }}>
          {titulo}
        </div>
        {children}
      </div>
    </div>
  );
}

function CampoModal({
  rotulo,
  id,
  children,
}: {
  rotulo: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={TS.label} htmlFor={id}>
        {rotulo}
      </label>
      {children}
    </div>
  );
}

function ErroModal({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
  );
}
