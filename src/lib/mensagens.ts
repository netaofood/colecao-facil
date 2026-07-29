/**
 * Templates de mensagem centralizados (item 3.4 do plano).
 * Editar aqui muda o texto em todo o app.
 */

const ASSINATURA = '\n\n— via Coleção Fácil · netao.app.br';

export const msg = {
  /**
   * Divulgar o que falta.
   * Sem link: a coleção é privada, então um endereço não abriria para
   * quem recebe. Quem manda a lista é o próprio texto.
   */
  faltantes: (nomeColecao: string, itens: string[]) =>
    `Procuro da coleção *${nomeColecao}* 🔍\n\n` +
    `Faltam ${itens.length} ${itens.length === 1 ? 'item' : 'itens'}:\n` +
    `${itens.join(', ')}${ASSINATURA}`,

  /** Divulgar repetidas disponíveis para troca */
  repetidas: (nomeColecao: string, itens: string[]) =>
    `Tenho para trocar da coleção *${nomeColecao}* 🔁\n\n` +
    `${itens.length} ${itens.length === 1 ? 'item' : 'itens'}:\n` +
    `${itens.join(', ')}${ASSINATURA}`,

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
