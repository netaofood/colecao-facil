export type Visibilidade = 'privada' | 'publica';
export type StatusItem = 'falta' | 'tenho' | 'repetida';

/** Item 4 do plano: lista fixa de raridade. */
export const RARIDADES = ['Comum', 'Rara', 'Especial', 'Lendária'] as const;
export type Raridade = (typeof RARIDADES)[number];

export interface Colecao {
  id: string;
  dono_id: string;
  nome: string;
  descricao: string | null;
  capa_url: string | null;
  categoria: string | null;
  ano: number | null;
  oficial: boolean;
  visibilidade: Visibilidade;
  arquivada: boolean;
  colecao_origem_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subdivisao {
  id: string;
  colecao_id: string;
  nome: string;
  ordem: number;
  created_at: string;
}

export interface Item {
  id: string;
  colecao_id: string;
  subdivisao_id: string | null;
  numero: string | null;
  nome: string;
  categoria: string | null;
  raridade: string | null;
  foto_url: string | null;
  observacao: string | null;
  ordem: number;
  created_at: string;
}

/** Linha de itens_usuario. Ausência de linha significa 'falta'. */
export interface ItemUsuario {
  id: string;
  usuario_id: string;
  item_id: string;
  status: StatusItem;
  quantidade_repetida: number;
  updated_at: string;
}

export interface ColecaoComProgresso extends Colecao {
  total_itens: number;
  total_tenho: number;
  total_repetidas: number;
  adotada: boolean;
}

export function porcentagem(tenho: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((tenho / total) * 100);
}
