import { useState, useEffect, useCallback, useMemo } from 'react';
import { Copy, Search, Check, Info } from 'lucide-react';
import { T, TS } from '../theme';
import { useAuth } from '../lib/auth';
import { listarMinhasColecoes, listarItens, listarMeusItens } from '../lib/api';
import type { ColecaoComProgresso, Item, ItemUsuario } from '../lib/tipos';
import { BotaoWhatsApp } from '../components/BotaoWhatsApp';
import { BotaoCopiarLink } from '../components/BotaoCopiarLink';
import { msg } from '../lib/mensagens';

type Lado = 'tenho' | 'preciso';

export function Trocas() {
  const { perfil } = useAuth();

  const [colecoes, setColecoes] = useState<ColecaoComProgresso[]>([]);
  const [colecaoId, setColecaoId] = useState('');
  const [itens, setItens] = useState<Item[]>([]);
  const [meus, setMeus] = useState<Map<string, ItemUsuario>>(new Map());
  const [carregando, setCarregando] = useState(true);
  const [buscandoItens, setBuscandoItens] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [lado, setLado] = useState<Lado>('tenho');
  const [escolhidos, setEscolhidos] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState('');

  useEffect(() => {
    if (!perfil) return;
    listarMinhasColecoes(perfil.id)
      .then((c) => {
        setColecoes(c);
        if (c.length > 0) setColecaoId(c[0].id);
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [perfil]);

  const carregarItens = useCallback(async () => {
    if (!perfil || !colecaoId) return;
    setBuscandoItens(true);
    setErro(null);
    try {
      const lista = await listarItens(colecaoId);
      setItens(lista);
      setMeus(await listarMeusItens(perfil.id, lista.map((i) => i.id)));
      setEscolhidos(new Set());
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar.');
    } finally {
      setBuscandoItens(false);
    }
  }, [perfil, colecaoId]);

  useEffect(() => {
    void carregarItens();
  }, [carregarItens]);

  const colecao = colecoes.find((c) => c.id === colecaoId);

  /** Repetidas de um lado, faltantes do outro. */
  const disponiveis = useMemo(() => {
    const lista = itens.filter((i) => {
      const status = meus.get(i.id)?.status ?? 'falta';
      return lado === 'tenho' ? status === 'repetida' : status === 'falta';
    });

    if (!busca.trim()) return lista;
    const t = busca.trim().toLowerCase();
    return lista.filter(
      (i) =>
        i.nome.toLowerCase().includes(t) ||
        (i.numero ?? '').toLowerCase().includes(t)
    );
  }, [itens, meus, lado, busca]);

  const selecionados = itens.filter((i) => escolhidos.has(i.id));

  const texto = useMemo(() => {
    if (!colecao || selecionados.length === 0) return '';
    const rotulos = selecionados.map((i) => {
      const qtd = meus.get(i.id)?.quantidade_repetida ?? 0;
      const base = i.numero || i.nome;
      return lado === 'tenho' && qtd > 1 ? `${base} (${qtd}x)` : base;
    });
    return lado === 'tenho'
      ? msg.listaTroca(colecao.nome, rotulos, [])
      : msg.listaTroca(colecao.nome, [], rotulos);
  }, [colecao, selecionados, meus, lado]);

  function alternar(id: string) {
    setEscolhidos((a) => {
      const novo = new Set(a);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  return (
    <div>
      <h1 style={{ ...TS.titulo, fontSize: 22, marginBottom: 4 }}>Trocas</h1>
      <p
        style={{
          fontFamily: T.fontBody,
          fontSize: 13.5,
          color: T.textSecondary,
          marginTop: 0,
          marginBottom: 20,
          lineHeight: 1.6,
        }}
      >
        Escolha os itens e o app monta a lista pronta para você mandar no
        WhatsApp ou colar onde quiser.
      </p>

      {erro && <Caixa texto={erro} erro />}

      {carregando ? (
        <Caixa texto="Carregando..." />
      ) : colecoes.length === 0 ? (
        <Caixa texto="Você precisa ter uma coleção para montar uma lista." />
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={TS.label} htmlFor="col-troca">
              Coleção
            </label>
            <select
              id="col-troca"
              value={colecaoId}
              onChange={(e) => setColecaoId(e.target.value)}
              style={{ ...TS.input, colorScheme: 'dark' }}
            >
              {colecoes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* O que listar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <Aba
              ativa={lado === 'tenho'}
              cor={T.repetida}
              rotulo="Tenho para trocar"
              aoClicar={() => {
                setLado('tenho');
                setEscolhidos(new Set());
              }}
            />
            <Aba
              ativa={lado === 'preciso'}
              cor={T.neon}
              rotulo="Estou procurando"
              aoClicar={() => {
                setLado('preciso');
                setEscolhidos(new Set());
              }}
            />
          </div>

          {buscandoItens ? (
            <Caixa texto="Carregando itens..." />
          ) : disponiveis.length === 0 && !busca ? (
            <Caixa
              texto={
                lado === 'tenho'
                  ? 'Você ainda não marcou nenhuma repetida nesta coleção.'
                  : 'Nada faltando nesta coleção. Parabéns!'
              }
            />
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  gap: 9,
                  marginBottom: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 190px', position: 'relative' }}>
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
                    placeholder="Buscar item"
                    style={{ ...TS.input, paddingLeft: 36 }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEscolhidos((a) =>
                      a.size === disponiveis.length
                        ? new Set()
                        : new Set(disponiveis.map((i) => i.id))
                    )
                  }
                  style={{
                    ...TS.botaoSecundario,
                    padding: '11px 16px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {escolhidos.size === disponiveis.length
                    ? 'Limpar'
                    : 'Marcar todos'}
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginBottom: 20,
                }}
              >
                {disponiveis.map((item) => {
                  const marcado = escolhidos.has(item.id);
                  const qtd = meus.get(item.id)?.quantidade_repetida ?? 0;
                  const cor = lado === 'tenho' ? T.repetida : T.neon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => alternar(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 12px',
                        borderRadius: 99,
                        border: `1.5px solid ${marcado ? cor : T.border}`,
                        background: marcado ? `${T.bgHover}` : 'transparent',
                        color: marcado ? cor : T.textSecondary,
                        fontFamily: T.fontBody,
                        fontSize: 12.5,
                        fontWeight: marcado ? 700 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      {marcado && <Check size={12} strokeWidth={3} />}
                      {item.numero || item.nome}
                      {lado === 'tenho' && qtd > 1 && (
                        <span style={{ opacity: 0.75 }}>{qtd}x</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Resultado */}
          {selecionados.length > 0 && (
            <div
              style={{
                ...TS.card,
                borderColor: T.neonBorder,
                position: 'sticky',
                bottom: 12,
              }}
            >
              <div
                style={{
                  ...TS.label,
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Copy size={13} />
                Lista com {selecionados.length}{' '}
                {selecionados.length === 1 ? 'item' : 'itens'}
              </div>

              <pre
                style={{
                  background: T.bgElevated,
                  border: `1px solid ${T.border}`,
                  borderRadius: T.radiusSm,
                  padding: '11px 13px',
                  margin: '0 0 12px',
                  fontFamily: T.fontBody,
                  fontSize: 12.5,
                  color: T.textSecondary,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {texto}
              </pre>

              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 170px' }}>
                  <BotaoWhatsApp
                    mensagem={texto}
                    variant="full"
                    rotulo="Mandar no WhatsApp"
                  />
                </div>
                <div style={{ flex: '1 1 150px' }}>
                  <BotaoCopiarLink
                    texto={texto}
                    variant="full"
                    rotulo="Copiar lista"
                  />
                </div>
              </div>
            </div>
          )}

          <Rodape />
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- */

function Aba({
  ativa,
  cor,
  rotulo,
  aoClicar,
}: {
  ativa: boolean;
  cor: string;
  rotulo: string;
  aoClicar: () => void;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      style={{
        flex: 1,
        padding: '11px 14px',
        borderRadius: T.radius,
        border: `1.5px solid ${ativa ? cor : T.border}`,
        background: ativa ? T.bgHover : 'transparent',
        color: ativa ? cor : T.textSecondary,
        fontFamily: T.fontBody,
        fontSize: 13,
        fontWeight: ativa ? 700 : 500,
        cursor: 'pointer',
      }}
    >
      {rotulo}
    </button>
  );
}

function Rodape() {
  return (
    <div
      style={{
        marginTop: 26,
        padding: '13px 15px',
        background: T.bgElevated,
        border: `1px solid ${T.border}`,
        borderRadius: T.radiusSm,
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        fontFamily: T.fontBody,
        fontSize: 12,
        color: T.textMuted,
        lineHeight: 1.6,
      }}
    >
      <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>
        O Coleção Fácil só monta a lista. A troca é combinada diretamente entre
        vocês, por conta e risco de cada um.
      </span>
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
        marginBottom: 14,
      }}
    >
      {texto}
    </div>
  );
}
