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
  const posicao = alvo.indexOf(chave);
  if (posicao === -1) return base;

  const antes = base.slice(0, posicao);
  const depois = base.slice(posicao + chave.length);

  // Cortar no meio só faz sentido quando o que vem antes tem letras.
  // "MESSI|OURO|1" vira "MESSI1"; já "26|OURO|1" viraria "261",
  // que não diz nada — nesse caso, deixa o código inteiro.
  const temLetras = /[A-Za-zÀ-ÿ]/.test(antes);
  if (posicao > 0 && depois.length > 0 && !temLetras) return base;

  const curto = `${antes}${depois}`.trim();
  return curto.length >= 1 ? curto : base;
}

/** Tira a numeração do fim, quando o que sobra ainda é um nome. */
export function semNumeroFinal(rotulo: string): string {
  const cortado = rotulo.replace(/\s*\d+$/, '').trim();
  if (!cortado) return rotulo;
  if (!/[A-Za-zÀ-ÿ]/.test(cortado)) return rotulo;
  return cortado;
}

export interface RotuloItem {
  /** Texto grande no centro da célula */
  principal: string;
  /** Número, mostrado pequeno acima. Ausente quando repetiria o principal. */
  secundario: string | null;
}

/**
 * Monta os rótulos de uma lista inteira.
 *
 * A numeração do fim só é removida se, depois disso, os rótulos
 * continuarem distinguíveis entre si. Com "MESSIOURO1" e "MESSIOURO2"
 * no mesmo bloco, o número precisa ficar.
 */
export function rotulosDaLista(
  itens: Item[],
  nomeSubdivisao?: string | null
): Map<string, RotuloItem> {
  // Item com nome de verdade: o nome é o que informa. O número vira apoio.
  const comNome = new Map<string, RotuloItem>();
  const semNome: Item[] = [];

  for (const item of itens) {
    const nome = item.nome?.trim();
    if (nome && !nomeRedundante(item)) {
      comNome.set(item.id, {
        principal: nome,
        secundario: item.numero?.trim() || null,
      });
    } else {
      semNome.push(item);
    }
  }

  // Os demais só têm código: aí vale encurtar tirando a subdivisão
  const curtos = semNome.map((i) => ({
    id: i.id,
    texto: rotuloCurto(i, nomeSubdivisao),
  }));

  const sem = curtos.map((c) => ({ id: c.id, texto: semNumeroFinal(c.texto) }));
  const unicos = new Set(sem.map((c) => c.texto.toUpperCase()));
  const podeTirar = unicos.size === sem.length;

  const resultado = new Map(comNome);
  for (const c of podeTirar ? sem : curtos) {
    resultado.set(c.id, { principal: c.texto, secundario: null });
  }

  return resultado;
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
