import type { Item, Subdivisao } from './tipos';

/** Tira acentos, espaços e pontuação, e sobe para maiúsculas. */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

export interface Sugestao {
  subdivisao: Subdivisao;
  itens: Item[];
}

export interface Plano {
  sugestoes: Sugestao[];
  semCorrespondencia: Item[];
  total: number;
}

/**
 * Procura o nome de cada subdivisão dentro do número ou do nome do item.
 * Ex.: item "26OURO1" cai na subdivisão "Ouro".
 *
 * Nomes mais longos são testados primeiro, para "Ouro Especial" não perder
 * para "Ouro" quando as duas existem.
 */
export function planejarOrganizacao(
  itens: Item[],
  subdivisoes: Subdivisao[]
): Plano {
  const alvos = subdivisoes
    .map((s) => ({ subdivisao: s, chave: normalizar(s.nome) }))
    .filter((a) => a.chave.length >= 2)
    .sort((a, b) => b.chave.length - a.chave.length);

  const porSubdivisao = new Map<string, Item[]>();
  const semCorrespondencia: Item[] = [];

  for (const item of itens) {
    const texto = normalizar(`${item.numero ?? ''} ${item.nome}`);
    const achou = alvos.find((a) => texto.includes(a.chave));

    if (achou) {
      if (!porSubdivisao.has(achou.subdivisao.id)) {
        porSubdivisao.set(achou.subdivisao.id, []);
      }
      porSubdivisao.get(achou.subdivisao.id)!.push(item);
    } else {
      semCorrespondencia.push(item);
    }
  }

  const sugestoes: Sugestao[] = subdivisoes
    .filter((s) => (porSubdivisao.get(s.id)?.length ?? 0) > 0)
    .map((s) => ({ subdivisao: s, itens: porSubdivisao.get(s.id)! }));

  return {
    sugestoes,
    semCorrespondencia,
    total: itens.length - semCorrespondencia.length,
  };
}
