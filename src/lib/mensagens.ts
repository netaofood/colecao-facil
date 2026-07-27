/**
 * Templates de mensagem centralizados (item 3.4 do plano).
 * Editar aqui muda o texto em todo o app.
 */

const ASSINATURA = '\n\n— via Coleção Fácil · netao.app.br';

export const msg = {
  /** Compartilhar o perfil público do colecionador */
  perfil: (apelido: string, url: string) =>
    `Olha minha coleção no Coleção Fácil! 👀\n\nPerfil: @${apelido}\n${url}${ASSINATURA}`,

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

  /** Abrir conversa de troca */
  propostaTroca: (apelidoDestino: string, ofereco: string[], peco: string[]) =>
    `Oi @${apelidoDestino}! Vi que a gente pode fechar uma troca 🤝\n\n` +
    `*Eu tenho:* ${ofereco.join(', ')}\n` +
    `*Eu preciso:* ${peco.join(', ')}\n\n` +
    `Topa?${ASSINATURA}`,

  /** Convite genérico para o app */
  convite: (url: string) =>
    `Tô usando o Coleção Fácil pra organizar minhas coleções e achar trocas 📱\n\n${url}${ASSINATURA}`,
};

/** Monta a URL do wa.me com a mensagem já codificada. */
export function linkWhatsApp(texto: string, telefone?: string): string {
  const numero = telefone ? telefone.replace(/\D/g, '') : '';
  const base = numero ? `https://wa.me/${numero}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(texto)}`;
}
