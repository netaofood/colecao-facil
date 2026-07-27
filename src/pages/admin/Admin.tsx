import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, BadgeCheck, Ticket, Plus, Power } from 'lucide-react';
import { T, TS } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { criarColecao, listarOficiais } from '../../lib/api';
import type { Colecao } from '../../lib/tipos';
import { Convites } from './Convites';
import { Modal } from '../Colecoes';

type Aba = 'usuarios' | 'oficiais' | 'convites';

export function Admin() {
  const [aba, setAba] = useState<Aba>('usuarios');

  return (
    <div>
      <h1 style={{ ...TS.titulo, fontSize: 22, marginBottom: 18 }}>
        Administração
      </h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <AbaBotao
          ativa={aba === 'usuarios'}
          Icone={Users}
          rotulo="Usuários"
          aoClicar={() => setAba('usuarios')}
        />
        <AbaBotao
          ativa={aba === 'oficiais'}
          Icone={BadgeCheck}
          rotulo="Coleções oficiais"
          aoClicar={() => setAba('oficiais')}
        />
        <AbaBotao
          ativa={aba === 'convites'}
          Icone={Ticket}
          rotulo="Convites"
          aoClicar={() => setAba('convites')}
        />
      </div>

      {aba === 'usuarios' && <ListaUsuarios />}
      {aba === 'oficiais' && <ColecoesOficiais />}
      {aba === 'convites' && <Convites />}
    </div>
  );
}

/* -------------------------------------------------------------- */

interface UsuarioLinha {
  id: string;
  email: string;
  nome: string | null;
  apelido: string | null;
  cidade: string | null;
  papel: string;
  ativo: boolean;
  perfil_publico: boolean;
  created_at: string;
}

function ListaUsuarios() {
  const { perfil } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioLinha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nome, apelido, cidade, papel, ativo, perfil_publico, created_at')
      .order('created_at', { ascending: false });

    if (error) setErro(error.message);
    else setUsuarios((data ?? []) as UsuarioLinha[]);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function alternarAtivo(u: UsuarioLinha) {
    const { error } = await supabase
      .from('usuarios')
      .update({ ativo: !u.ativo })
      .eq('id', u.id);

    if (error) setErro(error.message);
    else await carregar();
  }

  if (carregando) return <Caixa texto="Carregando..." />;
  if (erro) return <Caixa texto={erro} erro />;

  return (
    <div>
      <div style={{ ...TS.label, marginBottom: 12 }}>
        {usuarios.length} {usuarios.length === 1 ? 'usuário' : 'usuários'}
      </div>

      {usuarios.map((u) => (
        <div key={u.id} style={{ ...TS.card, marginBottom: 8, opacity: u.ativo ? 1 : 0.5 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <div
                style={{
                  fontFamily: T.fontBody,
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.textPrimary,
                }}
              >
                {u.nome ?? u.email}
                {u.papel === 'super_admin' && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 10,
                      fontWeight: 700,
                      color: T.neon,
                      border: `1px solid ${T.neon}`,
                      borderRadius: 99,
                      padding: '2px 7px',
                      letterSpacing: 0.4,
                    }}
                  >
                    ADMIN
                  </span>
                )}
              </div>
              <div
                style={{
                  fontFamily: T.fontBody,
                  fontSize: 12,
                  color: T.textMuted,
                  marginTop: 3,
                }}
              >
                {u.email}
                {u.apelido && ` · @${u.apelido}`}
                {u.cidade && ` · ${u.cidade}`}
              </div>
              <div
                style={{
                  fontFamily: T.fontBody,
                  fontSize: 11.5,
                  color: T.textMuted,
                  marginTop: 3,
                }}
              >
                entrou em {new Date(u.created_at).toLocaleDateString('pt-BR')}
                {u.perfil_publico ? ' · perfil público' : ' · perfil privado'}
              </div>
            </div>

            {u.id !== perfil?.id && (
              <button
                type="button"
                onClick={() => void alternarAtivo(u)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 13px',
                  background: 'transparent',
                  border: `1px solid ${u.ativo ? T.erro : T.tenho}`,
                  borderRadius: T.radiusSm,
                  color: u.ativo ? T.erro : T.tenho,
                  fontSize: 12.5,
                  fontWeight: 600,
                  fontFamily: T.fontBody,
                  cursor: 'pointer',
                }}
              >
                <Power size={14} />
                {u.ativo ? 'Desativar' : 'Reativar'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- */

function ColecoesOficiais() {
  const { perfil } = useAuth();
  const [oficiais, setOficiais] = useState<Colecao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modal, setModal] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setOficiais(await listarOficiais());
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <div>
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
        Catálogos prontos que qualquer colecionador adota com um clique. Cadastre
        os itens uma vez e todo mundo aproveita.
      </p>

      <button
        type="button"
        onClick={() => setModal(true)}
        style={{
          ...TS.botaoPrimario,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          marginBottom: 20,
        }}
      >
        <Plus size={17} />
        Nova coleção oficial
      </button>

      {erro && <Caixa texto={erro} erro />}

      {carregando ? (
        <Caixa texto="Carregando..." />
      ) : oficiais.length === 0 ? (
        <Caixa texto="Nenhuma coleção oficial publicada ainda." />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 12,
          }}
        >
          {oficiais.map((c) => (
            <Link
              key={c.id}
              to={`/colecoes/${c.id}/catalogo`}
              style={{ ...TS.card, textDecoration: 'none', display: 'block' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  marginBottom: 6,
                }}
              >
                <BadgeCheck size={16} color={T.neon} />
                <span style={{ ...TS.titulo, fontSize: 14 }}>{c.nome}</span>
              </div>
              <div
                style={{
                  fontFamily: T.fontBody,
                  fontSize: 12,
                  color: T.textSecondary,
                }}
              >
                {c.descricao ||
                  [c.categoria, c.ano].filter(Boolean).join(' · ') ||
                  'Sem descrição'}
              </div>
            </Link>
          ))}
        </div>
      )}

      {modal && (
        <ModalOficial
          aoFechar={() => setModal(false)}
          aoCriar={async (dados) => {
            await criarColecao({
              ...dados,
              dono_id: perfil!.id,
              oficial: true,
              visibilidade: 'publica',
            });
            setModal(false);
            await carregar();
          }}
        />
      )}
    </div>
  );
}

function ModalOficial({
  aoFechar,
  aoCriar,
}: {
  aoFechar: () => void;
  aoCriar: (d: {
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
    <Modal titulo="Nova coleção oficial" aoFechar={aoFechar}>
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
        {[
          { r: 'Nome', id: 'of-nome', v: nome, set: setNome, req: true, ph: 'ex: Álbum da Copa 2026' },
          { r: 'Categoria', id: 'of-cat', v: categoria, set: setCategoria, req: false, ph: 'ex: Figurinhas' },
        ].map((c) => (
          <div key={c.id} style={{ marginBottom: 14 }}>
            <label style={TS.label} htmlFor={c.id}>
              {c.r}
            </label>
            <input
              id={c.id}
              value={c.v}
              onChange={(e) => c.set(e.target.value)}
              required={c.req}
              placeholder={c.ph}
              style={TS.input}
            />
          </div>
        ))}

        <div style={{ marginBottom: 14 }}>
          <label style={TS.label} htmlFor="of-ano">
            Ano
          </label>
          <input
            id="of-ano"
            type="number"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            min={1800}
            max={2200}
            style={TS.input}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={TS.label} htmlFor="of-desc">
            Descrição
          </label>
          <textarea
            id="of-desc"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
            style={{ ...TS.input, resize: 'vertical', fontFamily: T.fontBody }}
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
          {salvando ? 'Criando...' : 'Criar e cadastrar itens'}
        </button>
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------- */

function AbaBotao({
  ativa,
  Icone,
  rotulo,
  aoClicar,
}: {
  ativa: boolean;
  Icone: typeof Users;
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
        gap: 7,
        padding: '10px 15px',
        background: ativa ? T.neonFaint : 'transparent',
        border: `1.5px solid ${ativa ? T.neon : T.border}`,
        borderRadius: T.radius,
        color: ativa ? T.neon : T.textSecondary,
        fontSize: 13,
        fontWeight: ativa ? 700 : 500,
        fontFamily: T.fontBody,
        cursor: 'pointer',
      }}
    >
      <Icone size={16} />
      {rotulo}
    </button>
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
