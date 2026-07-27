import type { Item } from './tipos';

/**
 * Muitos itens têm nome igual ao número, porque foram gerados em série.
 * Repetir os dois na tela fica feio e não informa nada.
 */
export function nomeRedundante(item: Item): boolean {
  if (!item.numero) return false;
  const normalizar = (t: string) =>
    t
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
  return normalizar(item.nome) === normalizar(item.numero);
}

/** O que mostrar como título do item. */
export function tituloItem(item: Item): string {
  return item.numero || item.nome;
}

/** O que mostrar embaixo, ou nada se for repetição do título. */
export function descricaoItem(item: Item): string | null {
  if (!item.numero) return null;
  if (nomeRedundante(item)) return null;
  return item.nome;
}

/**
 * Sugere um nome legível a partir da subdivisão e do número.
 * "26OURO1" na subdivisão "Ouro" vira "Ouro 1".
 * Devolve null quando não dá para melhorar.
 */
export function nomeSugerido(
  item: Item,
  nomeSubdivisao: string | null
): string | null {
  if (!item.numero || !nomeSubdivisao) return null;
  if (!nomeRedundante(item)) return null;

  // Tira o nome da subdivisão de dentro do código e fica com o resto
  const chave = nomeSubdivisao
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();

  const codigo = item.numero.toUpperCase();
  const posicao = codigo.indexOf(chave);
  if (posicao === -1) return null;

  const resto = codigo.slice(posicao + chave.length).trim();
  if (!resto) return null;

  return `${nomeSubdivisao} ${resto}`;
}
