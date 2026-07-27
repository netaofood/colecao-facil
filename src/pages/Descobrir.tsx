import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, BadgeCheck, Download, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { T, TS } from '../theme';
import { useAuth } from '../lib/auth';
import {
  listarPerfisPublicos,
  listarOficiais,
  listarMinhasColecoes,
  adotarColecao,
} from '../lib/api';
import type { PerfilPublico } from '../lib/api';
import type { Colecao } from '../lib/tipos';

export function Descobrir() {
  const { perfil } = useAuth();
  const navigate = useNavigate();

  const [termo, setTermo] = useState('');
  const [pessoas, setPessoas] = useState<PerfilPublico[]>([]);
  const [oficiais, setOficiais] = useState<Colecao[]>([]);
  const [adotadas, setAdotadas] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!perfil) return;
    try {
      const [of, minhas] = await Promise.all([
        listarOficiais(),
        listarMinhasColecoes(perfil.id),
      ]);
      setOficiais(of);
      setAdotadas(new Set(minhas.map((c) => c.id)));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar.');
    } finally {
      setCarregando(false);
    }
  }, [perfil]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // Busca de pessoas com respiro de 400ms
  useEffect(() => {
    const t = setTimeout(() => {
      listarPerfisPublicos(termo)
        .then(setPessoas)
        .catch((e) => setErro(e.message));
    }, 400);
    return () => clearTimeout(t);
  }, [termo]);

  const outros = pessoas.filter((p) => p.id !== perfil?.id);

  return (
    <div>
      <h1 style={{ ...TS.titulo, fontSize: 22, marginBottom: 4 }}>Descobrir</h1>
      <p
        style={{
          fontFamily: T.fontBody,
          fontSize: 13.5,
          color: T.textSecondary,
          marginTop: 0,
          marginBottom: 20,
        }}
      >
        Coleções prontas para adotar e colecionadores para trocar.
      </p>

      {erro && <Caixa texto={erro} erro />}

      {/* Coleções oficiais */}
      <div style={{ ...TS.label, marginBottom: 10 }}>Coleções oficiais</div>
      {carregando ? (
        <Caixa texto="Carregando..." />
      ) : oficiais.length === 0 ? (
        <Caixa texto="Nenhuma coleção oficial publicada ainda." />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: 12,
            marginBottom: 30,
          }}
        >
          {oficiais.map((c) => {
            const jaTem = adotadas.has(c.id);
            return (
              <div key={c.id} style={TS.card}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    marginBottom: 5,
                  }}
                >
                  <BadgeCheck size={16} color={T.neon} style={{ flexShrink: 0 }} />
                  <span style={{ ...TS.titulo, fontSize: 14 }}>{c.nome}</span>
                </div>
                <div
                  style={{
                    fontFamily: T.fontBody,
                    fontSize: 12,
                    color: T.textSecondary,
                    marginBottom: 12,
                    lineHeight: 1.5,
                  }}
                >
                  {c.descricao ||
                    [c.categoria, c.ano].filter(Boolean).join(' · ') ||
                    'Sem descrição'}
                </div>

                <button
                  type="button"
                  disabled={jaTem}
                  onClick={async () => {
                    await adotarColecao(perfil!.id, c.id);
                    navigate(`/colecoes/${c.id}`);
                  }}
                  style={{
                    ...(jaTem ? TS.botaoSecundario : TS.botaoPrimario),
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    padding: '10px 14px',
                    opacity: jaTem ? 0.6 : 1,
                    cursor: jaTem ? 'default' : 'pointer',
                  }}
                >
                  {jaTem ? <Check size={15} /> : <Download size={15} />}
                  {jaTem ? 'Já adotada' : 'Adotar'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Colecionadores */}
      <div style={{ ...TS.label, marginBottom: 10 }}>Colecionadores</div>

      <div style={{ position: 'relative', marginBottom: 14 }}>
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
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Buscar por apelido, nome ou cidade"
          style={{ ...TS.input, paddingLeft: 36 }}
        />
      </div>

      {outros.length === 0 ? (
        <Caixa
          texto={
            termo
              ? 'Nenhum colecionador encontrado.'
              : 'Nenhum colecionador com perfil público ainda.'
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 10,
          }}
        >
          {outros.map((p) => (
            <div key={p.id} style={TS.card}>
              <div
                style={{
                  fontFamily: T.fontBody,
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.textPrimary,
                }}
              >
                {p.nome ?? `@${p.apelido}`}
              </div>
              <div
                style={{
                  fontFamily: T.fontBody,
                  fontSize: 12,
                  color: T.textMuted,
                  marginTop: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  flexWrap: 'wrap',
                }}
              >
                @{p.apelido}
                {p.cidade && (
                  <>
                    <MapPin size={11} />
                    {p.cidade}
                    {p.estado && `/${p.estado}`}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
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
        marginBottom: 16,
      }}
    >
      {texto}
    </div>
  );
}
