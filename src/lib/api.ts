import { supabase } from './supabase';
import type {
  Colecao,
  Item,
  Subdivisao,
  ColecaoComProgresso,
  ItemUsuario,
  StatusItem,
} from './tipos';

/* ---------------------------------------------------------------- */
/* COLEÇÕES                                                          */
/* ---------------------------------------------------------------- */

/** Coleções do usuário, com o progresso de cada uma. */
export async function listarMinhasColecoes(
  usuarioId: string
): Promise<ColecaoComProgresso[]> {
  const { data, error } = await supabase
    .from('colecoes')
    .select('*')
    .eq('dono_id', usuarioId)
    .eq('arquivada', false)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const colecoes = (data ?? []) as Colecao[];
  if (colecoes.length === 0) return [];

  const progresso = await calcularProgresso(
    colecoes.map((c) => c.id),
    usuarioId
  );

  return colecoes.map((c) => ({
    ...c,
    ...(progresso.get(c.id) ?? {
      total_itens: 0,
      total_tenho: 0,
      total_repetidas: 0,
    }),
  }));
}

export async function buscarColecao(id: string): Promise<Colecao | null> {
  const { data, error } = await supabase
    .from('colecoes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Colecao | null;
}

export async function criarColecao(dados: {
  dono_id: string;
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  ano?: number | null;
  visibilidade?: 'privada' | 'publica';
}): Promise<Colecao> {
  const { data, error } = await supabase
    .from('colecoes')
    .insert({
      dono_id: dados.dono_id,
      nome: dados.nome.trim(),
      descricao: dados.descricao?.trim() || null,
      categoria: dados.categoria?.trim() || null,
      ano: dados.ano ?? null,
      visibilidade: dados.visibilidade ?? 'privada',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Colecao;
}

export async function atualizarColecao(
  id: string,
  dados: Partial<Pick<Colecao, 'nome' | 'descricao' | 'categoria' | 'ano' | 'visibilidade' | 'arquivada'>>
): Promise<void> {
  const { error } = await supabase.from('colecoes').update(dados).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function apagarColecao(id: string): Promise<void> {
  const { error } = await supabase.from('colecoes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ---------------------------------------------------------------- */
/* PROGRESSO                                                         */
/* ---------------------------------------------------------------- */

interface Progresso {
  total_itens: number;
  total_tenho: number;
  total_repetidas: number;
}

async function calcularProgresso(
  colecaoIds: string[],
  usuarioId: string
): Promise<Map<string, Progresso>> {
  const mapa = new Map<string, Progresso>();
  for (const id of colecaoIds) {
    mapa.set(id, { total_itens: 0, total_tenho: 0, total_repetidas: 0 });
  }

  const { data: itens, error } = await supabase
    .from('itens')
    .select('id, colecao_id')
    .in('colecao_id', colecaoIds);

  if (error) throw new Error(error.message);

  const colecaoDoItem = new Map<string, string>();
  for (const it of (itens ?? []) as { id: string; colecao_id: string }[]) {
    colecaoDoItem.set(it.id, it.colecao_id);
    mapa.get(it.colecao_id)!.total_itens++;
  }

  if (colecaoDoItem.size === 0) return mapa;

  const { data: marcados, error: erroMarcados } = await supabase
    .from('itens_usuario')
    .select('item_id, status')
    .eq('usuario_id', usuarioId)
    .in('item_id', [...colecaoDoItem.keys()]);

  if (erroMarcados) throw new Error(erroMarcados.message);

  for (const m of (marcados ?? []) as { item_id: string; status: string }[]) {
    const colecaoId = colecaoDoItem.get(m.item_id);
    if (!colecaoId) continue;
    const p = mapa.get(colecaoId)!;
    if (m.status === 'tenho') p.total_tenho++;
    if (m.status === 'repetida') {
      p.total_tenho++;
      p.total_repetidas++;
    }
  }

  return mapa;
}

/* ---------------------------------------------------------------- */
/* SUBDIVISÕES                                                       */
/* ---------------------------------------------------------------- */

export async function listarSubdivisoes(
  colecaoId: string
): Promise<Subdivisao[]> {
  const { data, error } = await supabase
    .from('subdivisoes')
    .select('*')
    .eq('colecao_id', colecaoId)
    .order('ordem');

  if (error) throw new Error(error.message);
  return (data ?? []) as Subdivisao[];
}

export async function criarSubdivisao(
  colecaoId: string,
  nome: string,
  ordem: number
): Promise<Subdivisao> {
  const { data, error } = await supabase
    .from('subdivisoes')
    .insert({ colecao_id: colecaoId, nome: nome.trim(), ordem })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Subdivisao;
}

export async function apagarSubdivisao(id: string): Promise<void> {
  const { error } = await supabase.from('subdivisoes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ---------------------------------------------------------------- */
/* ITENS                                                             */
/* ---------------------------------------------------------------- */

export async function listarItens(colecaoId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('itens')
    .select('*')
    .eq('colecao_id', colecaoId)
    .order('ordem')
    .order('created_at');

  if (error) throw new Error(error.message);
  return (data ?? []) as Item[];
}

export interface NovoItem {
  numero?: string | null;
  nome: string;
  categoria?: string | null;
  raridade?: string | null;
  subdivisao_id?: string | null;
  observacao?: string | null;
  foto_url?: string | null;
}

/**
 * Insere vários itens de uma vez, em lotes de 500.
 * Devolve quantos entraram e quantos foram recusados por número repetido.
 */
export async function inserirItens(
  colecaoId: string,
  novos: NovoItem[],
  ordemInicial = 0
): Promise<{ inseridos: number; duplicados: number }> {
  const linhas = novos.map((n, i) => ({
    colecao_id: colecaoId,
    numero: n.numero?.toString().trim() || null,
    nome: n.nome.trim(),
    categoria: n.categoria?.trim() || null,
    raridade: n.raridade?.trim() || null,
    subdivisao_id: n.subdivisao_id ?? null,
    observacao: n.observacao?.trim() || null,
    ordem: ordemInicial + i,
  }));

  let inseridos = 0;
  let duplicados = 0;
  const TAMANHO = 500;

  for (let i = 0; i < linhas.length; i += TAMANHO) {
    const lote = linhas.slice(i, i + TAMANHO);
    const { data, error } = await supabase.from('itens').insert(lote).select('id');

    if (error) {
      if (error.code === '23505') {
        // Número repetido no lote: reinsere um a um para salvar o que dá
        for (const linha of lote) {
          const r = await supabase.from('itens').insert(linha).select('id');
          if (r.error) duplicados++;
          else inseridos++;
        }
      } else {
        throw new Error(error.message);
      }
    } else {
      inseridos += data?.length ?? 0;
    }
  }

  return { inseridos, duplicados };
}

export async function atualizarItem(
  id: string,
  dados: Partial<NovoItem>
): Promise<void> {
  const { error } = await supabase.from('itens').update(dados).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function apagarItem(id: string): Promise<void> {
  const { error } = await supabase.from('itens').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function apagarTodosItens(colecaoId: string): Promise<void> {
  const { error } = await supabase
    .from('itens')
    .delete()
    .eq('colecao_id', colecaoId);
  if (error) throw new Error(error.message);
}

/* ---------------------------------------------------------------- */
/* MEU PROGRESSO — tenho / falta / repetida                          */
/* ---------------------------------------------------------------- */


/** Marcações do usuário nos itens de uma coleção, indexadas por item_id. */
export async function listarMeusItens(
  usuarioId: string,
  itemIds: string[]
): Promise<Map<string, ItemUsuario>> {
  const mapa = new Map<string, ItemUsuario>();
  if (itemIds.length === 0) return mapa;

  // O filtro .in tem limite de tamanho na URL: quebra em blocos
  const BLOCO = 300;
  for (let i = 0; i < itemIds.length; i += BLOCO) {
    const { data, error } = await supabase
      .from('itens_usuario')
      .select('*')
      .eq('usuario_id', usuarioId)
      .in('item_id', itemIds.slice(i, i + BLOCO));

    if (error) throw new Error(error.message);
    for (const linha of (data ?? []) as ItemUsuario[]) {
      mapa.set(linha.item_id, linha);
    }
  }
  return mapa;
}

/**
 * Define o status de um item. A restrição do banco exige que
 * quantidade_repetida seja 0 fora do status 'repetida'.
 */
export async function marcarItem(
  usuarioId: string,
  itemId: string,
  status: StatusItem,
  quantidadeRepetida = 0
): Promise<void> {
  const qtd = status === 'repetida' ? Math.max(1, quantidadeRepetida) : 0;

  const { error } = await supabase.from('itens_usuario').upsert(
    {
      usuario_id: usuarioId,
      item_id: itemId,
      status,
      quantidade_repetida: qtd,
    },
    { onConflict: 'usuario_id,item_id' }
  );

  if (error) throw new Error(error.message);
}

/** Marcação em lote (item 8.6). */
export async function marcarVarios(
  usuarioId: string,
  itemIds: string[],
  status: StatusItem
): Promise<void> {
  if (itemIds.length === 0) return;
  const qtd = status === 'repetida' ? 1 : 0;

  const linhas = itemIds.map((item_id) => ({
    usuario_id: usuarioId,
    item_id,
    status,
    quantidade_repetida: qtd,
  }));

  const BLOCO = 500;
  for (let i = 0; i < linhas.length; i += BLOCO) {
    const { error } = await supabase
      .from('itens_usuario')
      .upsert(linhas.slice(i, i + BLOCO), { onConflict: 'usuario_id,item_id' });
    if (error) throw new Error(error.message);
  }
}

/* ---------------------------------------------------------------- */
/* PERFIS PÚBLICOS E DESCOBERTA (itens 10 e 9)                       */
/* ---------------------------------------------------------------- */

/* ---------------------------------------------------------------- */
/* PÁGINA PÚBLICA DO COLECIONADOR (item 10.1)                        */
/* ---------------------------------------------------------------- */

/* ---------------------------------------------------------------- */
/* UPLOAD DE IMAGEM (item 7.5)                                       */
/* ---------------------------------------------------------------- */

const BUCKET = 'colecao-imagens';
const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB
const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function enviarImagem(
  arquivo: File,
  pasta: string
): Promise<string> {
  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    throw new Error('Formato não aceito. Use JPG, PNG, WEBP ou GIF.');
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    throw new Error('Imagem muito grande. O limite é 5 MB.');
  }

  const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const nome = `${pasta}/${crypto.randomUUID()}.${extensao}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(nome, arquivo, { cacheControl: '3600', upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(nome);
  return data.publicUrl;
}

export async function apagarImagem(url: string): Promise<void> {
  const marca = `/${BUCKET}/`;
  const posicao = url.indexOf(marca);
  if (posicao === -1) return;
  const caminho = url.slice(posicao + marca.length);
  await supabase.storage.from(BUCKET).remove([caminho]);
}

/** Vincula vários itens a uma subdivisão (ou desvincula, com null). */
export async function vincularSubdivisao(
  itemIds: string[],
  subdivisaoId: string | null
): Promise<void> {
  const BLOCO = 300;
  for (let i = 0; i < itemIds.length; i += BLOCO) {
    const { error } = await supabase
      .from('itens')
      .update({ subdivisao_id: subdivisaoId })
      .in('id', itemIds.slice(i, i + BLOCO));
    if (error) throw new Error(error.message);
  }
}

/* ---------------------------------------------------------------- */
/* CATEGORIAS JÁ USADAS (para sugestão de digitação)                 */
/* ---------------------------------------------------------------- */

function limparLista(valores: (string | null)[]): string[] {
  const vistos = new Map<string, string>();
  for (const v of valores) {
    const texto = v?.trim();
    if (!texto) continue;
    // Ignora diferença de maiúsculas: "Brasil" e "brasil" viram um só
    const chave = texto.toLowerCase();
    if (!vistos.has(chave)) vistos.set(chave, texto);
  }
  return [...vistos.values()].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
  );
}

/**
 * Categorias já usadas em TODOS os itens das coleções do usuário.
 * A sugestão acompanha a pessoa, não a coleção aberta.
 */
export async function listarCategoriasDoUsuario(
  usuarioId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('itens')
    .select('categoria, colecoes!inner(dono_id)')
    .eq('colecoes.dono_id', usuarioId)
    .not('categoria', 'is', null)
    .limit(3000);

  if (error) throw new Error(error.message);
  return limparLista(
    (data ?? []).map((l) => (l as { categoria: string | null }).categoria)
  );
}


/**
 * Nomes de subdivisão já usados em qualquer coleção do usuário.
 * Serve de sugestão ao criar uma nova.
 */
export async function listarNomesSubdivisoesDoUsuario(
  usuarioId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('subdivisoes')
    .select('nome, colecoes!inner(dono_id)')
    .eq('colecoes.dono_id', usuarioId)
    .limit(1000);

  if (error) throw new Error(error.message);
  return limparLista(
    (data ?? []).map((l) => (l as { nome: string | null }).nome)
  );
}

/** Categorias já usadas nas coleções do próprio usuário. */
export async function listarCategoriasDasColecoes(
  usuarioId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('colecoes')
    .select('categoria')
    .eq('dono_id', usuarioId)
    .not('categoria', 'is', null);

  if (error) throw new Error(error.message);
  return limparLista((data ?? []).map((l) => (l as { categoria: string | null }).categoria));
}

/* ---------------------------------------------------------------- */
/* PAINEL DO SUPER ADMIN                                             */
/* ---------------------------------------------------------------- */

export interface ResumoColecionador {
  colecoes: number;
  itens: number;
  tenho: number;
  repetidas: number;
  ultimaAtividade: string | null;
}

/** Números de um colecionador específico, para a ficha no painel. */
export async function resumoDoColecionador(
  usuarioId: string
): Promise<ResumoColecionador> {
  const { data: colecoes, error: erroColecoes } = await supabase
    .from('colecoes')
    .select('id')
    .eq('dono_id', usuarioId);

  if (erroColecoes) throw new Error(erroColecoes.message);

  const ids = (colecoes ?? []).map((c) => (c as { id: string }).id);

  let itens = 0;
  if (ids.length > 0) {
    const { count, error } = await supabase
      .from('itens')
      .select('*', { count: 'exact', head: true })
      .in('colecao_id', ids);
    if (error) throw new Error(error.message);
    itens = count ?? 0;
  }

  const { data: marcados, error: erroMarcados } = await supabase
    .from('itens_usuario')
    .select('status, updated_at')
    .eq('usuario_id', usuarioId)
    .order('updated_at', { ascending: false })
    .limit(2000);

  if (erroMarcados) throw new Error(erroMarcados.message);

  const linhas = (marcados ?? []) as { status: string; updated_at: string }[];

  return {
    colecoes: ids.length,
    itens,
    tenho: linhas.filter((l) => l.status !== 'falta').length,
    repetidas: linhas.filter((l) => l.status === 'repetida').length,
    ultimaAtividade: linhas[0]?.updated_at ?? null,
  };
}

/** Envia o e-mail de redefinição de senha para um colecionador. */
export async function enviarRedefinicaoSenha(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/nova-senha`,
  });
  if (error) throw new Error(error.message);
}

/* ---------------------------------------------------------------- */
/* ASSINATURA                                                        */
/* ---------------------------------------------------------------- */

export interface Pagamento {
  id: string;
  usuario_id: string;
  valor: number;
  meses: number;
  pago_em: string;
  vigencia_ate: string;
  forma: string | null;
  observacao: string | null;
  created_at: string;
}

export const VALOR_PLANO = 29.9;

export type SituacaoAssinatura = 'isento' | 'em_dia' | 'vencendo' | 'vencida';

/**
 * Conta em dias de calendário, ignorando a hora — é assim que o banco
 * compara (assinatura_ate >= current_date). Se a tela usasse hora, ela
 * diria uma coisa e a trava faria outra.
 */
export function diasRestantes(assinaturaAte: string | null): number | null {
  if (!assinaturaAte) return null;

  const [ano, mes, dia] = assinaturaAte.split('-').map(Number);
  if (!ano || !mes || !dia) return null;

  const fim = new Date(ano, mes - 1, dia);
  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

  return Math.round((fim.getTime() - hoje.getTime()) / 86400000);
}

/** Vencendo = vence hoje ou dentro de sete dias. */
export function situacaoAssinatura(
  isento: boolean,
  assinaturaAte: string | null
): SituacaoAssinatura {
  if (isento) return 'isento';

  const dias = diasRestantes(assinaturaAte);
  if (dias === null) return 'vencida';
  if (dias < 0) return 'vencida';
  if (dias <= 7) return 'vencendo';
  return 'em_dia';
}

export async function registrarPagamento(dados: {
  usuarioId: string;
  meses: number;
  valor: number;
  forma?: string | null;
  observacao?: string | null;
}): Promise<string> {
  const { data, error } = await supabase.rpc('registrar_pagamento', {
    p_usuario_id: dados.usuarioId,
    p_meses: dados.meses,
    p_valor: dados.valor,
    p_forma: dados.forma ?? null,
    p_observacao: dados.observacao ?? null,
  });

  if (error) throw new Error(error.message);
  return data as string;
}

export async function listarPagamentos(
  usuarioId?: string
): Promise<Pagamento[]> {
  let q = supabase
    .from('pagamentos')
    .select('*')
    .order('pago_em', { ascending: false })
    .limit(200);

  if (usuarioId) q = q.eq('usuario_id', usuarioId);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Pagamento[];
}

export function moeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* ---------------------------------------------------------------- */
/* EDIÇÃO DE COLECIONADOR PELO ADMIN                                 */
/* ---------------------------------------------------------------- */

/** Campos que vivem na tabela usuarios: o admin escreve direto. */
export async function editarDadosColecionador(
  usuarioId: string,
  dados: {
    nome?: string | null;
    apelido?: string | null;
    cidade?: string | null;
    estado?: string | null;
    whatsapp?: string | null;
    assinatura_ate?: string | null;
    isento?: boolean;
  }
): Promise<void> {
  const { error } = await supabase
    .from('usuarios')
    .update(dados)
    .eq('id', usuarioId);

  if (error) {
    throw new Error(
      error.code === '23505'
        ? 'Esse apelido já está em uso por outra conta.'
        : error.message
    );
  }
}

/**
 * E-mail e senha vivem em auth.users e exigem a chave privilegiada.
 * Vão por Edge Function, que roda no servidor.
 */
export async function editarAcessoColecionador(dados: {
  usuarioId: string;
  email?: string;
  senha?: string;
}): Promise<void> {
  const { data: sessao } = await supabase.auth.getSession();
  const token = sessao.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Entre novamente.');

  const base = import.meta.env.VITE_SUPABASE_URL;

  let resposta: Response;
  try {
    resposta = await fetch(`${base}/functions/v1/editar-colecionador`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: dados.usuarioId,
        email: dados.email,
        senha: dados.senha,
      }),
    });
  } catch {
    throw new Error(
      'Não consegui alcançar a função editar-colecionador. Verifique se ela foi publicada.'
    );
  }

  const bruto = await resposta.text();
  let corpo: { erro?: string } = {};
  try {
    corpo = JSON.parse(bruto);
  } catch {
    corpo = {};
  }

  if (!resposta.ok) {
    throw new Error(
      corpo.erro || `A função respondeu ${resposta.status}. ${bruto.slice(0, 200)}`
    );
  }
}
