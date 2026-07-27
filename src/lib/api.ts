import { supabase } from './supabase';
import type { Colecao, Item, Subdivisao, ColecaoComProgresso } from './tipos';

/* ---------------------------------------------------------------- */
/* COLEÇÕES                                                          */
/* ---------------------------------------------------------------- */

/** Coleções que o usuário criou ou adotou, com o progresso de cada uma. */
export async function listarMinhasColecoes(
  usuarioId: string
): Promise<ColecaoComProgresso[]> {
  const [proprias, adotadas] = await Promise.all([
    supabase
      .from('colecoes')
      .select('*')
      .eq('dono_id', usuarioId)
      .eq('arquivada', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('colecoes_usuario')
      .select('colecao_id, colecoes(*)')
      .eq('usuario_id', usuarioId),
  ]);

  if (proprias.error) throw new Error(proprias.error.message);
  if (adotadas.error) throw new Error(adotadas.error.message);

  const mapa = new Map<string, { colecao: Colecao; adotada: boolean }>();

  for (const c of (proprias.data ?? []) as Colecao[]) {
    mapa.set(c.id, { colecao: c, adotada: false });
  }
  for (const linha of adotadas.data ?? []) {
    const c = (linha as unknown as { colecoes: Colecao }).colecoes;
    if (c && !c.arquivada && !mapa.has(c.id)) {
      mapa.set(c.id, { colecao: c, adotada: true });
    }
  }

  const ids = [...mapa.keys()];
  if (ids.length === 0) return [];

  const progresso = await calcularProgresso(ids, usuarioId);

  return [...mapa.values()].map(({ colecao, adotada }) => ({
    ...colecao,
    adotada,
    ...(progresso.get(colecao.id) ?? {
      total_itens: 0,
      total_tenho: 0,
      total_repetidas: 0,
    }),
  }));
}

/** Coleções oficiais publicadas pelo super admin (item 6.3). */
export async function listarOficiais(): Promise<Colecao[]> {
  const { data, error } = await supabase
    .from('colecoes')
    .select('*')
    .eq('oficial', true)
    .eq('arquivada', false)
    .order('nome');

  if (error) throw new Error(error.message);
  return (data ?? []) as Colecao[];
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
  oficial?: boolean;
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
      oficial: dados.oficial ?? false,
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

/** Item 6.4: adotar não copia o catálogo, só cria o vínculo. */
export async function adotarColecao(
  usuarioId: string,
  colecaoId: string
): Promise<void> {
  const { error } = await supabase
    .from('colecoes_usuario')
    .insert({ usuario_id: usuarioId, colecao_id: colecaoId });

  // 23505 = já adotada, não é erro para o usuário
  if (error && error.code !== '23505') throw new Error(error.message);
}

export async function abandonarColecao(
  usuarioId: string,
  colecaoId: string
): Promise<void> {
  const { error } = await supabase
    .from('colecoes_usuario')
    .delete()
    .eq('usuario_id', usuarioId)
    .eq('colecao_id', colecaoId);

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
