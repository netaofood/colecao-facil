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

/**
 * Rótulo curto para a grade.
 *
 * Dentro de um bloco de subdivisão, repetir o nome dela no item é ruído:
 * o cabeçalho já diz "Ouro", então "MESSIOURO" pode virar só "MESSI".
 * Também tira o prefixo comum, quando existir.
 */
export function rotuloCurto(
  item: Item,
  nomeSubdivisao?: string | null
): string {
  const base = (item.numero || item.nome).trim();
  if (!nomeSubdivisao) return base;

  const semAcento = (t: string) =>
    t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

  const chave = semAcento(nomeSubdivisao).replace(/[^A-Z0-9]/g, '');
  if (chave.length < 3) return base;

  const alvo = semAcento(base);

  // Só corta no começo ou no fim. Cortar no meio destrói o sentido:
  // "26OURO1" viraria "261", que não diz nada.
  let curto: string | null = null;
  if (alvo.startsWith(chave)) {
    curto = base.slice(chave.length).trim();
  } else if (alvo.endsWith(chave)) {
    curto = base.slice(0, base.length - chave.length).trim();
  }

  if (!curto || curto.length < 1) return base;
  return curto;
}

/** Fonte menor conforme o rótulo cresce, para caber sem cortar. */
export function tamanhoDaFonte(texto: string): number {
  const n = texto.length;
  if (n <= 4) return 14;
  if (n <= 7) return 12;
  if (n <= 10) return 10.5;
  if (n <= 14) return 9.5;
  return 8.5;
}
