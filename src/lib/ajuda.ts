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

## Organização por categoria

Tendo coleções de categorias diferentes, elas aparecem agrupadas, cada categoria numa caixa com o progresso somado. Clique no título para recolher.

Os botões **Por categoria** e **Tudo junto** trocam entre as duas visões. Coleções sem categoria ficam num grupo no fim.

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

## Renomear a coleção

O lápis ao lado do nome abre a renomeação rápida. Para mudar também categoria, ano e descrição, use o lápis dentro de **Editar catálogo**.

## Foto do item

Toque num item e envie a foto ali mesmo. Se ele já tiver foto, o botão no canto superior direito troca por outra.

A foto aparece na grade, colorida quando você tem o item e cinza quando falta.

## Blocos por subdivisão

Se a coleção tiver subdivisões, cada uma vira uma caixa com o próprio progresso. Clique no título da caixa para recolher.

## Renomear a coleção

O lápis ao lado do nome abre a renomeação rápida. Para mudar também categoria, ano e descrição, use o lápis dentro de **Editar catálogo**.

## Foto e subdivisão do item

Toque no item e envie a foto ali mesmo. Já tendo foto, aparece o botão **Trocar foto** sobre a imagem.

No fim do card também dá para mover o item de subdivisão. A mudança vale na hora, e o item pula para o bloco certo.

Não precisa ir até o catálogo para isso.

## Divulgar

Os botões no fim da tela mandam a **lista em texto**, não um endereço. Sua coleção é privada: um link não abriria para quem recebe.

**O que me falta** manda a lista dos faltantes. **Minhas repetidas** manda o que está sobrando, com a quantidade. Cada um tem o botão de copiar ao lado, para você mandar por onde quiser.

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

Marcando **Sem numeração**, ele cria um item por subdivisão usando só o prefixo. Bom para nome de jogador: com o prefixo Messi e as quatro subdivisões marcadas, saem MESSIOURO, MESSIPRATA, MESSIBRONZE e MESSIREGULAR — sem o número no fim.

**Grid** — digite item por item numa tabela. Linhas em branco são ignoradas.

**CSV** — cole direto de uma planilha, na ordem número, nome, categoria, raridade.

## Subdivisões

Servem para separar páginas, séries ou categorias dentro da mesma coleção, como Ouro, Prata e Bronze.

Você pode criar pelo botão **Subdivisão** ou durante o cadastro de itens, sem sair da tela.

## Nomes

Itens criados por numeração em série antes desta melhoria ficaram com o nome igual ao número, e a tela mostrava a mesma coisa duas vezes.

O botão **Nomes** troca isso por algo legível: "26OURO1" vira "Ouro 1". O número não muda, e itens que já têm nome de verdade são preservados.

## Organizar

Se você cadastrou os itens antes de criar as subdivisões, eles ficam soltos. O botão **Organizar** lê o número de cada item, procura o nome da subdivisão dentro dele e faz o vínculo. Ele mostra o que vai fazer antes de aplicar.

## Editar um item

Passe o mouse sobre o item e clique no lápis. Ali você muda número, nome, categoria, raridade, subdivisão e a foto.
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

Escolha a coleção — ou deixe em **Todas as coleções** para juntar tudo numa lista só. Escolha a aba, toque nos itens que quer incluir. Use a busca para achar rápido, ou **Marcar todos**.

Com várias coleções, os itens aparecem separados por coleção, e a mensagem sai organizada do mesmo jeito.

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
Aqui você vê o retrato do seu acervo, com filtros e gráficos.

## Filtros

- **Coleção** — analisa uma só ou todas juntas
- **Categoria** — olha só um tipo, como Figurinhas ou Miniaturas
- **Período** — muda a janela do gráfico de evolução

Tudo na tela responde aos filtros, inclusive a exportação.

## Os gráficos

**Composição** — a rosca mostra quanto você já tem, quanto está repetido e quanto falta, com a porcentagem no centro.

**Indicadores** — dois medidores: quanto do acervo está completo, e quanto do que você tem está repetido. Repetida demais é sinal de que vale trocar.

**Evolução do acervo** — quantos itens você acumulou ao longo do tempo, contando de quando cada um foi marcado.

**Mais perto de completar** — suas coleções ordenadas por porcentagem. A barra fica verde quando chega a 100%.

**Progresso por raridade** — mostra se o que falta são as comuns ou justamente as lendárias.

**Itens por categoria** — o tamanho de cada categoria no seu acervo.

**Onde falta mais** — as coleções com mais itens faltando, em número absoluto.

## Exportar

O botão no fim baixa a planilha do que está filtrado, com coleção, subdivisão, número, nome, categoria, raridade e o estado de cada item. Abre no Excel e no Google Planilhas com os acentos corretos.
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

## Cobrar

Na aba **Pagamentos**, cada cliente aparece numa linha com a situação da assinatura e o último pagamento. Quem está devendo vem primeiro.

Cada linha tem três ações: **Lançar pagamento**, **Cobrar** pelo WhatsApp com a mensagem já escrita conforme a situação, e **Copiar** o mesmo texto para mandar por outro caminho.

Se o colecionador cadastrou o WhatsApp, o botão já abre a conversa dele. Senão, abre o WhatsApp para você escolher o contato.

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
