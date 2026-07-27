import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Download, Library, BadgeCheck, Users } from 'lucide-react';
import { T, TS } from '../theme';
import { useAuth } from '../lib/auth';
import {
  listarMinhasColecoes,
  listarOficiais,
  criarColecao,
  adotarColecao,
} from '../lib/api';
import type { ColecaoComProgresso, Colecao } from '../lib/tipos';
import { BarraProgresso } from '../components/BarraProgresso';

export function Colecoes() {
  const { perfil } = useAuth();
  const navigate = useNavigate();

  const [minhas, setMinhas] = useState<ColecaoComProgresso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modal, setModal] = useState<'branco' | 'oficial' | null>(null);

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
        }}
      >
        <PortaEntrada
          Icone={Plus}
          titulo="Começar em branco"
          texto="Você cadastra os itens do seu jeito."
          aoClicar={() => setModal('branco')}
        />
        <PortaEntrada
          Icone={Download}
          titulo="Adotar coleção pronta"
          texto="Catálogo já montado. É só marcar o que você tem."
          aoClicar={() => setModal('oficial')}
          destaque
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

      {carregando ? (
        <Aviso texto="Carregando..." />
      ) : minhas.length === 0 ? (
        <Aviso texto="Escolha uma das opções acima para começar." />
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
          aoFechar={() => setModal(null)}
          aoCriar={async (dados) => {
            const nova = await criarColecao({ ...dados, dono_id: perfil!.id });
            setModal(null);
            navigate(`/colecoes/${nova.id}`);
          }}
        />
      )}

      {modal === 'oficial' && (
        <ModalAdotar
          aoFechar={() => setModal(null)}
          aoAdotar={async (colecaoId) => {
            await adotarColecao(perfil!.id, colecaoId);
            setModal(null);
            navigate(`/colecoes/${colecaoId}`);
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------- */

function PortaEntrada({
  Icone,
  titulo,
  texto,
  aoClicar,
  destaque = false,
}: {
  Icone: typeof Plus;
  titulo: string;
  texto: string;
  aoClicar: () => void;
  destaque?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      style={{
        ...TS.card,
        textAlign: 'left',
        cursor: 'pointer',
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
        {colecao.oficial && (
          <Etiqueta Icone={BadgeCheck} texto="Oficial" cor={T.neon} />
        )}
        {colecao.adotada && (
          <Etiqueta Icone={Users} texto="Adotada" cor={T.textMuted} />
        )}
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
  Icone?: typeof BadgeCheck;
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
  aoFechar,
  aoCriar,
}: {
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
          <input
            id="cat-colecao"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="ex: Figurinhas"
            style={TS.input}
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

function ModalAdotar({
  aoFechar,
  aoAdotar,
}: {
  aoFechar: () => void;
  aoAdotar: (colecaoId: string) => Promise<void>;
}) {
  const [oficiais, setOficiais] = useState<Colecao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarOficiais()
      .then(setOficiais)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <Modal titulo="Adotar coleção pronta" aoFechar={aoFechar}>
      {carregando ? (
        <Aviso texto="Carregando..." />
      ) : erro ? (
        <ErroModal>{erro}</ErroModal>
      ) : oficiais.length === 0 ? (
        <Aviso texto="Nenhuma coleção oficial publicada ainda." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {oficiais.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => void aoAdotar(c.id)}
              style={{
                ...TS.card,
                textAlign: 'left',
                cursor: 'pointer',
                padding: 14,
              }}
            >
              <div style={{ ...TS.titulo, fontSize: 14 }}>{c.nome}</div>
              <div
                style={{
                  fontFamily: T.fontBody,
                  fontSize: 12,
                  color: T.textSecondary,
                  marginTop: 3,
                }}
              >
                {c.descricao ||
                  [c.categoria, c.ano].filter(Boolean).join(' · ') ||
                  'Sem descrição'}
              </div>
            </button>
          ))}
        </div>
      )}
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
