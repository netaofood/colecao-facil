/**
 * Textos do manual, separados por tela.
 * Para editar o manual, mexa só neste arquivo.
 *
 * Formatação aceita nos parágrafos:
 *   ## Título de seção
 *   - item de lista
 *   **negrito**
 */

export interface Ajuda {
  titulo: string;
  texto: string;
}

const INICIO: Ajuda = {
  titulo: 'Bem-vindo ao Coleção Fácil',
  texto: `
O Coleção Fácil serve para você organizar suas coleções: saber o que já tem, o que falta e o que está sobrando para trocar.

## Por onde começar

- Crie uma coleção em **Coleções**
- Cadastre os itens dela
- Marque o que você já tem
- Use **Trocas** para montar a lista do que sobra

## Sobre este ícone

O **?** mostra sempre a ajuda da tela em que você está. Se estiver com dúvida em alguma parte do app, clique nele ali mesmo.
`,
};

const COLECOES: Ajuda = {
  titulo: 'Suas coleções',
  texto: `
Aqui ficam todas as suas coleções, cada uma com a barra de progresso.

## Criar uma coleção

Clique em **Nova coleção** e dê um nome. Categoria e ano são opcionais, mas ajudam a se achar quando você tiver várias.

A categoria guarda o que você já digitou antes e oferece como sugestão nas próximas.

## O cartão de cada coleção

Mostra quantos itens você já tem do total, a porcentagem e quantas repetidas estão disponíveis para troca.

Clique no cartão para abrir a coleção e marcar seus itens.
`,
};

const COLECAO: Ajuda = {
  titulo: 'Marcando sua coleção',
  texto: `
Esta é a tela onde você registra o que tem.

## Os três estados

- **Falta** — você ainda não tem
- **Tenho** — você tem uma unidade
- **Repetida** — você tem sobrando, com a quantidade que quiser

Toque num item para abrir e escolher. Quando marcar como repetida, aparecem os botões **−** e **+** para dizer quantas estão sobrando.

## Filtros rápidos

As pílulas no topo filtram a tela: **Faltam**, **Tenho** e **Repetidas**. Útil para conferir só o que interessa naquele momento.

## Modo conferência

Ligando esse modo, cada toque avança o item direto: falta vira tenho, tenho vira repetida. Serve para passar o álbum inteiro rápido, sem abrir item por item.

## Selecionar vários

Clique em **Selecionar**, toque nos itens e marque todos de uma vez.

## Blocos por subdivisão

Se a coleção tiver subdivisões, cada uma vira uma caixa com o próprio progresso. Clique no título da caixa para recolher.

## Adicionar itens

O botão **Adicionar itens** no topo abre o cadastro sem sair desta tela.
`,
};

const CATALOGO: Ajuda = {
  titulo: 'Editando o catálogo',
  texto: `
Aqui você cadastra e edita os itens da coleção. É diferente da tela anterior: lá você marca o que tem, aqui você define o que existe.

## Os três jeitos de cadastrar

**Numeração em série** — o mais rápido. Diga de qual número até qual e o app cria todos. Marcando várias subdivisões, ele repete o intervalo em cada uma, montando códigos como 26OURO1, 26PRATA1 e assim por diante.

**Grid** — digite item por item numa tabela. Linhas em branco são ignoradas.

**CSV** — cole direto de uma planilha, na ordem número, nome, categoria, raridade.

## Subdivisões

Servem para separar páginas, séries ou categorias dentro da mesma coleção, como Ouro, Prata e Bronze.

Você pode criar pelo botão **Subdivisão** ou durante o cadastro de itens, sem sair da tela.

## Organizar

Se você cadastrou os itens antes de criar as subdivisões, eles ficam soltos. O botão **Organizar** lê o número de cada item, procura o nome da subdivisão dentro dele e faz o vínculo. Ele mostra o que vai fazer antes de aplicar.

## Editar um item

Passe o mouse sobre o item e clique no lápis. Ali você muda número, nome, categoria, raridade e adiciona a foto.
`,
};

const TROCAS: Ajuda = {
  titulo: 'Montando sua lista de trocas',
  texto: `
Esta tela monta o texto pronto para você negociar. O app não intermedeia nada: ele organiza a lista e entrega para você mandar onde quiser.

## As duas abas

**Tenho para trocar** — suas repetidas, com a quantidade de cada uma.

**Estou procurando** — o que ainda falta na coleção.

## Como usar

Escolha a coleção, escolha a aba, toque nos itens que quer incluir. Use a busca para achar rápido, ou **Marcar todos**.

Conforme você escolhe, aparece embaixo a prévia do texto. Confira e mande.

## Os dois botões

**Mandar no WhatsApp** abre o aplicativo com a lista já escrita, e você escolhe para quem enviar.

**Copiar lista** copia o texto para você colar em qualquer lugar: grupo, fórum, rede social.

## Importante

A troca é combinada diretamente entre você e a outra pessoa. O Coleção Fácil não participa e não se responsabiliza pelo combinado.
`,
};

const RELATORIOS: Ajuda = {
  titulo: 'Seus relatórios',
  texto: `
Um resumo de como está o seu progresso.

## O que aparece

- Quantas coleções, itens no total, quantos você já tem e quantas repetidas
- Ranking das coleções que estão mais perto de completar

## Exportar

O botão **CSV** baixa a planilha daquela coleção, com todos os itens e o estado de cada um. Abre no Excel e no Google Planilhas com os acentos corretos.

Serve para guardar uma cópia ou trabalhar os dados fora do app.
`,
};

const PERFIL: Ajuda = {
  titulo: 'Seu perfil',
  texto: `
Seus dados pessoais dentro do app.

## Os campos

- **Foto e nome** — como você se identifica
- **Apelido** — como você quer ser chamado
- **Cidade e estado** — opcionais
- **WhatsApp** — usado só se você marcar a opção de incluí-lo nas listas que compartilhar

## Privacidade

O app não expõe seu perfil para ninguém. Seu e-mail nunca é mostrado. O que sai daqui é só o que você mesmo compartilhar pelos botões de WhatsApp e copiar.
`,
};

const ADMIN: Ajuda = {
  titulo: 'Administração',
  texto: `
Área exclusiva do administrador.

## Painel

Mostra os números gerais: quantos colecionadores, quantas contas ativas, quantos nunca acessaram, e o total de coleções, itens e repetidas no sistema.

## Criar uma conta

Só você cria contas. Clique em **Novo colecionador**, informe nome e e-mail, e o app gera uma senha provisória.

Ao terminar, aparece o texto pronto com os dados de acesso, com botões para mandar no WhatsApp ou copiar. **A senha não aparece de novo**, então mande antes de fechar.

No primeiro acesso, a pessoa informa a data de nascimento e aceita os termos.

## Pagamentos

O plano é único: R$ 29,90 por mês, com controle manual.

Cada pagamento registrado estende a assinatura em um mês, contando a partir do vencimento atual — quem paga adiantado não perde os dias que ainda tem.

Quem vence **continua vendo tudo e marcando o que já possui**, mas não cria coleção nova nem cadastra item. A trava está no banco, não só na tela.

Contas novas começam com 7 dias de cortesia.

## Gerenciar contas

A lista mostra todo mundo, com data de criação. Quem ainda não entrou aparece marcado como **nunca acessou**.

Clique num colecionador para abrir a ficha dele: quantas coleções e itens tem, quando acessou pela última vez, e o histórico de pagamentos. Dali você também registra pagamento e envia link de nova senha.

Você pode desativar uma conta e reativar depois. Desativar não apaga nada.
`,
};

const LOGIN: Ajuda = {
  titulo: 'Entrando no Coleção Fácil',
  texto: `
## Já tenho conta

Use o e-mail e a senha do cadastro. Esqueceu a senha? Clique em **Esqueci minha senha** e você recebe um link por e-mail.

## Ainda não tenho conta

As contas são criadas pelo administrador. Se você ainda não tem acesso, fale com quem te indicou e peça seu e-mail e senha.

No primeiro acesso o app pede sua data de nascimento (é preciso ter 18 anos ou mais) e o aceite dos termos de uso.

## Instalar no celular

O botão **Instalar App** coloca o Coleção Fácil na sua tela de início, funcionando como um aplicativo normal. No iPhone, ele mostra o passo a passo pelo menu Compartilhar do Safari.
`,
};

/**
 * Escolhe o texto conforme a rota aberta.
 * Rota sem texto próprio cai no manual do início.
 */
export function ajudaDaRota(caminho: string): Ajuda {
  if (caminho.startsWith('/login')) return LOGIN;
  if (caminho.startsWith('/admin')) return ADMIN;
  if (caminho.startsWith('/perfil')) return PERFIL;
  if (caminho.startsWith('/relatorios')) return RELATORIOS;
  if (caminho.startsWith('/trocas')) return TROCAS;
  if (caminho.endsWith('/catalogo')) return CATALOGO;
  if (/^\/colecoes\/[^/]+$/.test(caminho)) return COLECAO;
  if (caminho.startsWith('/colecoes')) return COLECOES;
  return INICIO;
}
