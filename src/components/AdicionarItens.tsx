import { useState, useEffect } from 'react';
import { ListOrdered, Table, FileUp, Plus, Trash2, Check, X } from 'lucide-react';
import { T, TS } from '../theme';
import { RARIDADES } from '../lib/tipos';
import { useAuth } from '../lib/auth';
import type { Subdivisao } from '../lib/tipos';
import {
  inserirItens,
  listarCategoriasDoUsuario,
  criarSubdivisao,
  listarNomesSubdivisoesDoUsuario,
  type NovoItem,
} from '../lib/api';
import { InputCategoria } from './InputCategoria';

type Caminho = 'serie' | 'grid' | 'csv';

interface Props {
  colecaoId: string;
  subdivisoes: Subdivisao[];
  ordemInicial: number;
  aoConcluir: (resumo: { inseridos: number; duplicados: number }) => void;
}

export function AdicionarItens({
  colecaoId,
  subdivisoes,
  ordemInicial,
  aoConcluir,
}: Props) {
  const [caminho, setCaminho] = useState<Caminho>('serie');
  const { perfil } = useAuth();
  const [categorias, setCategorias] = useState<string[]>([]);

  // Subdivisões em estado local, para a criação inline aparecer na hora
  const [subs, setSubs] = useState<Subdivisao[]>(subdivisoes);
  useEffect(() => setSubs(subdivisoes), [subdivisoes]);

  const [nomesSubdivisao, setNomesSubdivisao] = useState<string[]>([]);

  useEffect(() => {
    if (!perfil) return;
    listarCategoriasDoUsuario(perfil.id)
      .then(setCategorias)
      .catch(() => setCategorias([]));
    listarNomesSubdivisoesDoUsuario(perfil.id)
      .then(setNomesSubdivisao)
      .catch(() => setNomesSubdivisao([]));
  }, [perfil]);
  const [subdivisaoId, setSubdivisaoId] = useState<string>('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(novos: NovoItem[]) {
    if (novos.length === 0) {
      setErro('Nada para adicionar.');
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      const comSub = novos.map((n) => ({
        ...n,
        subdivisao_id: subdivisaoId || null,
      }));
      aoConcluir(await inserirItens(colecaoId, comSub, ordemInicial));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      {/* Escolha do caminho — série em destaque */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 8,
          marginBottom: 18,
        }}
      >
        <Aba
          ativa={caminho === 'serie'}
          Icone={ListOrdered}
          titulo="Numeração em série"
          texto="1 a 300 de uma vez"
          aoClicar={() => setCaminho('serie')}
        />
        <Aba
          ativa={caminho === 'grid'}
          Icone={Table}
          titulo="Digitar no grid"
          texto="Item a item"
          aoClicar={() => setCaminho('grid')}
        />
        <Aba
          ativa={caminho === 'csv'}
          Icone={FileUp}
          titulo="Importar CSV"
          texto="Colar de planilha"
          aoClicar={() => setCaminho('csv')}
        />
      </div>

      <SeletorSubdivisao
        colecaoId={colecaoId}
        subdivisoes={subs}
        sugestoes={nomesSubdivisao}
        valor={subdivisaoId}
        aoMudar={setSubdivisaoId}
        aoCriar={(nova) => {
          setSubs((a) => [...a, nova]);
          setSubdivisaoId(nova.id);
        }}
      />

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

      {caminho === 'serie' && (
        <PorSerie salvando={salvando} aoSalvar={salvar} categorias={categorias} />
      )}
      {caminho === 'grid' && (
        <PorGrid salvando={salvando} aoSalvar={salvar} categorias={categorias} />
      )}
      {caminho === 'csv' && <PorCSV salvando={salvando} aoSalvar={salvar} />}
    </div>
  );
}

/* -------------------------------------------------------------- */
/* CAMINHO 1 — NUMERAÇÃO EM SÉRIE                                  */
/* -------------------------------------------------------------- */

function PorSerie({
  salvando,
  aoSalvar,
  categorias,
}: {
  salvando: boolean;
  aoSalvar: (n: NovoItem[]) => void;
  categorias: string[];
}) {
  const [de, setDe] = useState('1');
  const [ate, setAte] = useState('100');
  const [prefixo, setPrefixo] = useState('');
  const [zeros, setZeros] = useState(false);
  const [raridade, setRaridade] = useState('');
  const [categoria, setCategoria] = useState('');

  const inicio = Number(de) || 0;
  const fim = Number(ate) || 0;
  const quantidade = fim >= inicio ? fim - inicio + 1 : 0;
  const largura = String(fim).length;

  function formatar(n: number) {
    const num = zeros ? String(n).padStart(largura, '0') : String(n);
    return `${prefixo}${num}`;
  }

  const excedeu = quantidade > 2000;

  function gerar(): NovoItem[] {
    const lista: NovoItem[] = [];
    for (let n = inicio; n <= fim; n++) {
      const codigo = formatar(n);
      lista.push({
        numero: codigo,
        nome: codigo,
        raridade: raridade || null,
        categoria: categoria || null,
      });
    }
    return lista;
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={TS.label} htmlFor="de">
            De
          </label>
          <input
            id="de"
            type="number"
            value={de}
            onChange={(e) => setDe(e.target.value)}
            min={0}
            style={TS.input}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={TS.label} htmlFor="ate">
            Até
          </label>
          <input
            id="ate"
            type="number"
            value={ate}
            onChange={(e) => setAte(e.target.value)}
            min={0}
            style={TS.input}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={TS.label} htmlFor="prefixo">
            Prefixo (opcional)
          </label>
          <input
            id="prefixo"
            value={prefixo}
            onChange={(e) => setPrefixo(e.target.value)}
            placeholder="ex: SP-"
            style={TS.input}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={TS.label} htmlFor="raridade-serie">
            Raridade (opcional)
          </label>
          <select
            id="raridade-serie"
            value={raridade}
            onChange={(e) => setRaridade(e.target.value)}
            style={{ ...TS.input, colorScheme: 'dark' }}
          >
            <option value="">Nenhuma</option>
            {RARIDADES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={TS.label} htmlFor="cat-serie">
          Categoria (opcional)
        </label>
        <InputCategoria
          id="cat-serie"
          valor={categoria}
          aoMudar={setCategoria}
          sugestoes={categorias}
          placeholder="vale para todos os itens da série"
        />
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          marginBottom: 16,
          cursor: 'pointer',
          fontFamily: T.fontBody,
          fontSize: 13,
          color: T.textSecondary,
        }}
      >
        <input
          type="checkbox"
          checked={zeros}
          onChange={(e) => setZeros(e.target.checked)}
          style={{ accentColor: T.neon, width: 16, height: 16 }}
        />
        Completar com zeros à esquerda (001, 002...)
      </label>

      {/* Prévia */}
      <div
        style={{
          background: T.bgElevated,
          border: `1px solid ${T.border}`,
          borderRadius: T.radiusSm,
          padding: '12px 14px',
          marginBottom: 16,
          fontFamily: T.fontBody,
          fontSize: 13,
          color: T.textSecondary,
          lineHeight: 1.6,
        }}
      >
        {quantidade === 0 ? (
          <span style={{ color: T.aviso }}>
            O número final precisa ser maior ou igual ao inicial.
          </span>
        ) : excedeu ? (
          <span style={{ color: T.erro }}>
            {quantidade.toLocaleString('pt-BR')} itens é demais de uma vez.
            Faça em blocos de até 2.000.
          </span>
        ) : (
          <>
            Serão criados{' '}
            <strong style={{ color: T.neon }}>{quantidade}</strong> itens:{' '}
            <code style={{ color: T.textPrimary }}>
              {formatar(inicio)}, {formatar(inicio + 1)}
              {quantidade > 3 ? ', ... , ' : quantidade === 3 ? ', ' : ''}
              {quantidade > 2 ? formatar(fim) : ''}
            </code>
          </>
        )}
      </div>

      <button
        type="button"
        disabled={salvando || quantidade === 0 || excedeu}
        onClick={() => aoSalvar(gerar())}
        style={{
          ...TS.botaoPrimario,
          width: '100%',
          opacity: salvando || quantidade === 0 || excedeu ? 0.5 : 1,
        }}
      >
        {salvando ? 'Criando...' : `Criar ${quantidade} itens`}
      </button>
    </div>
  );
}

/* -------------------------------------------------------------- */
/* CAMINHO 2 — GRID                                                */
/* -------------------------------------------------------------- */

interface LinhaGrid {
  numero: string;
  nome: string;
  categoria: string;
  raridade: string;
}

const LINHA_VAZIA: LinhaGrid = {
  numero: '',
  nome: '',
  categoria: '',
  raridade: '',
};

function PorGrid({
  salvando,
  aoSalvar,
  categorias,
}: {
  salvando: boolean;
  aoSalvar: (n: NovoItem[]) => void;
  categorias: string[];
}) {
  const [linhas, setLinhas] = useState<LinhaGrid[]>(
    Array.from({ length: 8 }, () => ({ ...LINHA_VAZIA }))
  );

  function mudar(i: number, campo: keyof LinhaGrid, valor: string) {
    setLinhas((atual) => {
      const novo = [...atual];
      novo[i] = { ...novo[i], [campo]: valor };
      // Acrescenta linhas quando o usuário chega ao fim
      if (i === novo.length - 1 && valor.trim()) {
        novo.push({ ...LINHA_VAZIA }, { ...LINHA_VAZIA });
      }
      return novo;
    });
  }

  // Linhas vazias são ignoradas
  const validas = linhas.filter((l) => l.nome.trim() || l.numero.trim());

  function montar(): NovoItem[] {
    return validas.map((l) => ({
      numero: l.numero.trim() || null,
      nome: l.nome.trim() || l.numero.trim(),
      categoria: l.categoria.trim() || null,
      raridade: l.raridade || null,
    }));
  }

  return (
    <div>
      <div style={{ overflowX: 'auto', marginBottom: 14 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
          <thead>
            <tr>
              {['Nº', 'Nome', 'Categoria', 'Raridade', ''].map((h, i) => (
                <th
                  key={i}
                  style={{
                    ...TS.label,
                    textAlign: 'left',
                    padding: '0 6px 8px',
                    marginBottom: 0,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i}>
                <td style={{ padding: 3, width: 90 }}>
                  <input
                    value={l.numero}
                    onChange={(e) => mudar(i, 'numero', e.target.value)}
                    style={{ ...TS.input, padding: '8px 10px', fontSize: 13.5 }}
                  />
                </td>
                <td style={{ padding: 3 }}>
                  <input
                    value={l.nome}
                    onChange={(e) => mudar(i, 'nome', e.target.value)}
                    style={{ ...TS.input, padding: '8px 10px', fontSize: 13.5 }}
                  />
                </td>
                <td style={{ padding: 3, width: 130 }}>
                  <InputCategoria
                    valor={l.categoria}
                    aoMudar={(v) => mudar(i, 'categoria', v)}
                    sugestoes={categorias}
                    compacto
                  />
                </td>
                <td style={{ padding: 3, width: 120 }}>
                  <select
                    value={l.raridade}
                    onChange={(e) => mudar(i, 'raridade', e.target.value)}
                    style={{
                      ...TS.input,
                      padding: '8px 10px',
                      fontSize: 13.5,
                      colorScheme: 'dark',
                    }}
                  >
                    <option value="">—</option>
                    {RARIDADES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: 3, width: 34 }}>
                  <button
                    type="button"
                    aria-label="Limpar linha"
                    onClick={() =>
                      setLinhas((a) =>
                        a.map((x, j) => (j === i ? { ...LINHA_VAZIA } : x))
                      )
                    }
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: T.textMuted,
                      cursor: 'pointer',
                      display: 'flex',
                      padding: 6,
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() =>
            setLinhas((a) => [
              ...a,
              ...Array.from({ length: 5 }, () => ({ ...LINHA_VAZIA })),
            ])
          }
          style={{
            ...TS.botaoSecundario,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 14px',
          }}
        >
          <Plus size={15} />5 linhas
        </button>

        <button
          type="button"
          disabled={salvando || validas.length === 0}
          onClick={() => aoSalvar(montar())}
          style={{
            ...TS.botaoPrimario,
            flex: 1,
            minWidth: 160,
            opacity: salvando || validas.length === 0 ? 0.5 : 1,
          }}
        >
          {salvando ? 'Salvando...' : `Adicionar ${validas.length} itens`}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- */
/* CAMINHO 3 — CSV                                                 */
/* -------------------------------------------------------------- */

function PorCSV({
  salvando,
  aoSalvar,
}: {
  salvando: boolean;
  aoSalvar: (n: NovoItem[]) => void;
}) {
  const [texto, setTexto] = useState('');
  const [temCabecalho, setTemCabecalho] = useState(true);

  const linhas = analisar(texto, temCabecalho);

  return (
    <div>
      <div
        style={{
          background: T.bgElevated,
          border: `1px solid ${T.border}`,
          borderRadius: T.radiusSm,
          padding: '12px 14px',
          marginBottom: 14,
          fontFamily: T.fontBody,
          fontSize: 12.5,
          color: T.textSecondary,
          lineHeight: 1.6,
        }}
      >
        Cole direto da planilha. A ordem das colunas é:
        <br />
        <code style={{ color: T.neon }}>número, nome, categoria, raridade</code>
        <br />
        Aceita vírgula, ponto e vírgula ou tabulação.
      </div>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={9}
        placeholder={'001,Neymar,Brasil,Lendária\n002,Vini Jr,Brasil,Rara'}
        style={{
          ...TS.input,
          resize: 'vertical',
          fontFamily: 'ui-monospace, monospace',
          fontSize: 13,
          marginBottom: 12,
        }}
      />

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          marginBottom: 14,
          cursor: 'pointer',
          fontFamily: T.fontBody,
          fontSize: 13,
          color: T.textSecondary,
        }}
      >
        <input
          type="checkbox"
          checked={temCabecalho}
          onChange={(e) => setTemCabecalho(e.target.checked)}
          style={{ accentColor: T.neon, width: 16, height: 16 }}
        />
        A primeira linha é cabeçalho (ignorar)
      </label>

      {texto.trim() && (
        <div
          style={{
            fontFamily: T.fontBody,
            fontSize: 13,
            color: linhas.length ? T.textSecondary : T.aviso,
            marginBottom: 14,
          }}
        >
          {linhas.length
            ? `${linhas.length} ${linhas.length === 1 ? 'item reconhecido' : 'itens reconhecidos'}.`
            : 'Nenhum item reconhecido no texto colado.'}
        </div>
      )}

      <button
        type="button"
        disabled={salvando || linhas.length === 0}
        onClick={() => aoSalvar(linhas)}
        style={{
          ...TS.botaoPrimario,
          width: '100%',
          opacity: salvando || linhas.length === 0 ? 0.5 : 1,
        }}
      >
        {salvando ? 'Importando...' : `Importar ${linhas.length} itens`}
      </button>
    </div>
  );
}

/** Divide por vírgula, ponto e vírgula ou tabulação. Respeita aspas. */
function analisar(texto: string, pularPrimeira: boolean): NovoItem[] {
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const uteis = pularPrimeira ? linhas.slice(1) : linhas;

  return uteis
    .flatMap<NovoItem>((linha) => {
      const colunas = dividir(linha);
      const numero = (colunas[0] ?? '').trim();
      const nome = (colunas[1] ?? '').trim() || numero;
      if (!nome) return [];
      return [
        {
          numero: numero || null,
          nome,
          categoria: (colunas[2] ?? '').trim() || null,
          raridade: (colunas[3] ?? '').trim() || null,
        },
      ];
    });
}

function dividir(linha: string): string[] {
  const saida: string[] = [];
  let atual = '';
  let entreAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') {
      if (entreAspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        entreAspas = !entreAspas;
      }
    } else if (!entreAspas && (c === ',' || c === ';' || c === '\t')) {
      saida.push(atual);
      atual = '';
    } else {
      atual += c;
    }
  }
  saida.push(atual);
  return saida;
}

/* -------------------------------------------------------------- */

function Aba({
  ativa,
  Icone,
  titulo,
  texto,
  aoClicar,
}: {
  ativa: boolean;
  Icone: typeof ListOrdered;
  titulo: string;
  texto: string;
  aoClicar: () => void;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      style={{
        background: ativa ? T.neonFaint : T.bgElevated,
        border: `1.5px solid ${ativa ? T.neon : T.border}`,
        borderRadius: T.radius,
        padding: '12px 14px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <Icone size={18} color={ativa ? T.neon : T.textMuted} />
      <div
        style={{
          fontFamily: T.fontBody,
          fontSize: 13,
          fontWeight: 600,
          color: ativa ? T.neon : T.textPrimary,
          marginTop: 8,
        }}
      >
        {titulo}
      </div>
      <div
        style={{
          fontFamily: T.fontBody,
          fontSize: 11.5,
          color: T.textMuted,
          marginTop: 2,
        }}
      >
        {texto}
      </div>
    </button>
  );
}


/* -------------------------------------------------------------- */
/* SELETOR DE SUBDIVISÃO, COM CRIAÇÃO SEM SAIR DA TELA             */
/* -------------------------------------------------------------- */

const NOVA = '__nova__';

function SeletorSubdivisao({
  colecaoId,
  subdivisoes,
  sugestoes,
  valor,
  aoMudar,
  aoCriar,
}: {
  colecaoId: string;
  subdivisoes: Subdivisao[];
  sugestoes: string[];
  valor: string;
  aoMudar: (v: string) => void;
  aoCriar: (nova: Subdivisao) => void;
}) {
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState('');

  // Não sugere o que esta coleção já tem
  const jaTem = new Set(subdivisoes.map((s) => s.nome.toLowerCase()));
  const disponiveis = sugestoes.filter((n) => !jaTem.has(n.toLowerCase()));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    const limpo = nome.trim();
    if (!limpo) return;

    const repetida = subdivisoes.find(
      (s) => s.nome.toLowerCase() === limpo.toLowerCase()
    );
    if (repetida) {
      aoCriar(repetida);
      encerrar();
      return;
    }

    setErro(null);
    setSalvando(true);
    try {
      const nova = await criarSubdivisao(colecaoId, limpo, subdivisoes.length);
      aoCriar(nova);
      encerrar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar.');
    } finally {
      setSalvando(false);
    }
  }

  function encerrar() {
    setCriando(false);
    setNome('');
    setErro(null);
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={TS.label} htmlFor="sub">
        Adicionar dentro de
      </label>

      {criando ? (
        <>
          <div style={{ display: 'flex', gap: 7 }}>
            <input
              list="sugestoes-subdivisao"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void salvar();
                }
                if (e.key === 'Escape') encerrar();
              }}
              placeholder="ex: Ouro"
              autoComplete="off"
              autoFocus
              style={{ ...TS.input, flex: 1 }}
            />
            <datalist id="sugestoes-subdivisao">
              {disponiveis.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            <button
              type="button"
              onClick={() => void salvar()}
              disabled={salvando || !nome.trim()}
              aria-label="Criar subdivisão"
              style={{
                ...TS.botaoPrimario,
                padding: '0 14px',
                display: 'flex',
                alignItems: 'center',
                opacity: salvando || !nome.trim() ? 0.5 : 1,
              }}
            >
              <Check size={17} />
            </button>
            <button
              type="button"
              onClick={encerrar}
              aria-label="Cancelar"
              style={{
                background: 'transparent',
                border: `1px solid ${T.border}`,
                borderRadius: T.radius,
                color: T.textMuted,
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={17} />
            </button>
          </div>

          {erro && (
            <div
              style={{
                fontFamily: T.fontBody,
                fontSize: 12,
                color: T.erro,
                marginTop: 6,
              }}
            >
              {erro}
            </div>
          )}
        </>
      ) : (
        <select
          id="sub"
          value={valor}
          onChange={(e) => {
            if (e.target.value === NOVA) setCriando(true);
            else aoMudar(e.target.value);
          }}
          style={{ ...TS.input, colorScheme: 'dark' }}
        >
          <option value="">Sem subdivisão</option>
          {subdivisoes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
          <option value={NOVA}>+ Nova subdivisão...</option>
        </select>
      )}
    </div>
  );
}
