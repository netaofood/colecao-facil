/**
 * Templates de mensagem centralizados (item 3.4 do plano).
 * Editar aqui muda o texto em todo o app.
 */

const ASSINATURA = '\n\n— via Coleção Fácil · netao.app.br';

export const msg = {
  /** Compartilhar uma coleção */
  colecao: (nome: string, progresso: string, url: string) =>
    `Estou montando a coleção *${nome}* 📒\n\nJá tenho ${progresso}.\n${url}${ASSINATURA}`,

  /** Divulgar o que falta */
  faltantes: (nomeColecao: string, quantidade: number, url: string) =>
    `Procuro figurinhas da coleção *${nomeColecao}* 🔍\n\n` +
    `Faltam ${quantidade} ${quantidade === 1 ? 'item' : 'itens'} para completar.\n` +
    `Veja a lista: ${url}${ASSINATURA}`,

  /** Divulgar repetidas disponíveis para troca */
  repetidas: (nomeColecao: string, quantidade: number, url: string) =>
    `Tenho ${quantidade} ${quantidade === 1 ? 'repetida' : 'repetidas'} da coleção *${nomeColecao}* para trocar 🔁\n\n` +
    `Confere aí: ${url}${ASSINATURA}`,

  /** Lista pronta para negociar troca */
  listaTroca: (
    nomeColecao: string,
    tenho: string[],
    preciso: string[]
  ) => {
    const partes = [`*${nomeColecao}*`];
    if (tenho.length > 0) {
      partes.push(`\n🔁 *Tenho para trocar* (${tenho.length}):\n${tenho.join(', ')}`);
    }
    if (preciso.length > 0) {
      partes.push(`\n🔍 *Preciso* (${preciso.length}):\n${preciso.join(', ')}`);
    }
    return partes.join('\n') + ASSINATURA;
  },

  /** Cobrança da mensalidade */
  cobranca: (
    nome: string,
    valor: string,
    situacao: 'vencida' | 'vencendo' | 'em_dia',
    vencimento: string
  ) => {
    const abertura = `Oi ${nome}, tudo bem?`;

    const meio =
      situacao === 'vencida'
        ? `Sua assinatura do Coleção Fácil venceu em ${vencimento}.\n\nPara voltar a cadastrar itens, é só acertar a mensalidade de ${valor}.`
        : situacao === 'vencendo'
          ? `Passando para lembrar que sua assinatura do Coleção Fácil vence em ${vencimento}.\n\nA mensalidade é de ${valor}.`
          : `Sua assinatura do Coleção Fácil está em dia, válida até ${vencimento}.\n\nMensalidade de ${valor}.`;

    return `${abertura}\n\n${meio}${ASSINATURA}`;
  },

  /** Mesma lista, separada por coleção */
  listaTrocaVarias: (
    grupos: { nome: string; itens: string[] }[],
    lado: 'tenho' | 'preciso'
  ) => {
    const total = grupos.reduce((soma, g) => soma + g.itens.length, 0);
    const cabecalho =
      lado === 'tenho'
        ? `🔁 *Tenho para trocar* (${total})`
        : `🔍 *Estou procurando* (${total})`;

    const corpo = grupos
      .filter((g) => g.itens.length > 0)
      .map((g) => `*${g.nome}*\n${g.itens.join(', ')}`)
      .join('\n\n');

    return `${cabecalho}\n\n${corpo}${ASSINATURA}`;
  },

};

/** Monta a URL do wa.me com a mensagem já codificada. */
export function linkWhatsApp(texto: string, telefone?: string): string {
  const numero = telefone ? telefone.replace(/\D/g, '') : '';
  const base = numero ? `https://wa.me/${numero}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(texto)}`;
}
