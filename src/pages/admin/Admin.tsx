import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  LayoutDashboard,
  UserPlus,
  Power,
  Library,
  Repeat,
  Copy as CopyIcon,
} from 'lucide-react';
import { T, TS } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Modal } from '../Colecoes';
import { CampoSenha } from '../../components/CampoSenha';

type Aba = 'painel' | 'colecionadores';

export function Admin() {
  const [aba, setAba] = useState<Aba>('painel');
  const [recarregar, setRecarregar] = useState(0);

  return (
    <div>
      <h1 style={{ ...TS.titulo, fontSize: 22, marginBottom: 18 }}>
        Administração
      </h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <AbaBotao
          ativa={aba === 'painel'}
          Icone={LayoutDashboard}
          rotulo="Painel"
          aoClicar={() => setAba('painel')}
        />
        <AbaBotao
          ativa={aba === 'colecionadores'}
          Icone={Users}
          rotulo="Colecionadores"
          aoClicar={() => setAba('colecionadores')}
        />
      </div>

      {aba === 'painel' && <Painel chave={recarregar} />}
      {aba === 'colecionadores' && (
        <Colecionadores aoMudar={() => setRecarregar((n) => n + 1)} />
      )}
    </div>
  );
}

/* -------------------------------------------------------------- */
/* PAINEL                                                          */
/* -------------------------------------------------------------- */

interface Numeros {
  usuarios: number;
  ativos: number;
  pendentes: number;
  colecoes: number;
  itens: number;
  repetidas: number;
}

function Painel({ chave }: { chave: number }) {
  const [n, setN] = useState<Numeros | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [usuarios, ativos, pendentes, colecoes, itens, repetidas] =
          await Promise.all([
            supabase.from('usuarios').select('*', { count: 'exact', head: true }),
            supabase
              .from('usuarios')
              .select('*', { count: 'exact', head: true })
              .eq('ativo', true),
            supabase
              .from('usuarios')
              .select('*', { count: 'exact', head: true })
              .is('primeiro_acesso_em', null),
            supabase.from('colecoes').select('*', { count: 'exact', head: true }),
            supabase.from('itens').select('*', { count: 'exact', head: true }),
            supabase
              .from('itens_usuario')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'repetida'),
          ]);

        const primeiroErro = [
          usuarios,
          ativos,
          pendentes,
          colecoes,
          itens,
          repetidas,
        ].find((r) => r.error);
        if (primeiroErro?.error) throw new Error(primeiroErro.error.message);

        setN({
          usuarios: usuarios.count ?? 0,
          ativos: ativos.count ?? 0,
          pendentes: pendentes.count ?? 0,
          colecoes: colecoes.count ?? 0,
          itens: itens.count ?? 0,
          repetidas: repetidas.count ?? 0,
        });
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao carregar.');
      }
    })();
  }, [chave]);

  if (erro) return <Caixa texto={erro} erro />;
  if (!n) return <Caixa texto="Carregando..." />;

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
          marginBottom: 22,
        }}
      >
        <Cartao Icone={Users} rotulo="Colecionadores" valor={n.usuarios} cor={T.neon} />
        <Cartao Icone={Power} rotulo="Contas ativas" valor={n.ativos} cor={T.tenho} />
        <Cartao
          Icone={UserPlus}
          rotulo="Nunca acessaram"
          valor={n.pendentes}
          cor={n.pendentes > 0 ? T.aviso : T.textMuted}
        />
        <Cartao Icone={Library} rotulo="Coleções" valor={n.colecoes} cor={T.textPrimary} />
        <Cartao Icone={CopyIcon} rotulo="Itens cadastrados" valor={n.itens} cor={T.textPrimary} />
        <Cartao Icone={Repeat} rotulo="Repetidas" valor={n.repetidas} cor={T.repetida} />
      </div>

      <div
        style={{
          ...TS.card,
          borderStyle: 'dashed',
          fontFamily: T.fontBody,
          fontSize: 13,
          color: T.textMuted,
          lineHeight: 1.65,
        }}
      >
        <strong style={{ color: T.textSecondary }}>
          Controle de pagamentos
        </strong>
        <br />
        Ainda não construído. Precisa de definição antes: quais planos, como se
        cobra, e o que acontece com a conta quando o pagamento atrasa.
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- */
/* COLECIONADORES                                                  */
/* -------------------------------------------------------------- */

interface UsuarioLinha {
  id: string;
  email: string;
  nome: string | null;
  apelido: string | null;
  cidade: string | null;
  papel: string;
  ativo: boolean;
  primeiro_acesso_em: string | null;
  created_at: string;
}

function Colecionadores({ aoMudar }: { aoMudar: () => void }) {
  const { perfil } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioLinha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modal, setModal] = useState(false);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select(
        'id, email, nome, apelido, cidade, papel, ativo, primeiro_acesso_em, created_at'
      )
      .order('created_at', { ascending: false });

    if (error) setErro(error.message);
    else setUsuarios((data ?? []) as UsuarioLinha[]);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function alternarAtivo(u: UsuarioLinha) {
    const { error } = await supabase
      .from('usuarios')
      .update({ ativo: !u.ativo })
      .eq('id', u.id);

    if (error) setErro(error.message);
    else {
      await carregar();
      aoMudar();
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setModal(true)}
        style={{
          ...TS.botaoPrimario,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          marginBottom: 20,
        }}
      >
        <UserPlus size={17} />
        Novo colecionador
      </button>

      {erro && <Caixa texto={erro} erro />}

      {carregando ? (
        <Caixa texto="Carregando..." />
      ) : (
        <>
          <div style={{ ...TS.label, marginBottom: 12 }}>
            {usuarios.length} {usuarios.length === 1 ? 'conta' : 'contas'}
          </div>

          {usuarios.map((u) => (
            <div
              key={u.id}
              style={{ ...TS.card, marginBottom: 8, opacity: u.ativo ? 1 : 0.5 }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: T.fontBody,
                      fontSize: 14,
                      fontWeight: 600,
                      color: T.textPrimary,
                    }}
                  >
                    {u.nome ?? u.email}
                    {u.papel === 'super_admin' && (
                      <Selo cor={T.neon}>ADMIN</Selo>
                    )}
                    {!u.primeiro_acesso_em && u.papel !== 'super_admin' && (
                      <Selo cor={T.aviso}>NUNCA ACESSOU</Selo>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: T.fontBody,
                      fontSize: 12,
                      color: T.textMuted,
                      marginTop: 3,
                    }}
                  >
                    {u.email}
                    {u.apelido && ` · @${u.apelido}`}
                    {u.cidade && ` · ${u.cidade}`}
                  </div>
                  <div
                    style={{
                      fontFamily: T.fontBody,
                      fontSize: 11.5,
                      color: T.textMuted,
                      marginTop: 3,
                    }}
                  >
                    criada em{' '}
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                {u.id !== perfil?.id && (
                  <button
                    type="button"
                    onClick={() => void alternarAtivo(u)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 13px',
                      background: 'transparent',
                      border: `1px solid ${u.ativo ? T.erro : T.tenho}`,
                      borderRadius: T.radiusSm,
                      color: u.ativo ? T.erro : T.tenho,
                      fontSize: 12.5,
                      fontWeight: 600,
                      fontFamily: T.fontBody,
                      cursor: 'pointer',
                    }}
                  >
                    <Power size={14} />
                    {u.ativo ? 'Desativar' : 'Reativar'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {modal && (
        <ModalNovaConta
          aoFechar={() => setModal(false)}
          aoCriar={async () => {
            setModal(false);
            await carregar();
            aoMudar();
          }}
        />
      )}
    </div>
  );
}

function ModalNovaConta({
  aoFechar,
  aoCriar,
}: {
  aoFechar: () => void;
  aoCriar: () => Promise<void>;
}) {
  const { criarColecionador } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState(gerarSenha());
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [pronto, setPronto] = useState(false);

  if (pronto) {
    const texto =
      `Sua conta no Coleção Fácil está pronta!\n\n` +
      `Acesse: ${window.location.origin}\n` +
      `E-mail: ${email}\n` +
      `Senha: ${senha}\n\n` +
      `Troque a senha depois de entrar.`;

    return (
      <Modal titulo="Conta criada" aoFechar={() => void aoCriar()}>
        <p
          style={{
            fontFamily: T.fontBody,
            fontSize: 13.5,
            color: T.textSecondary,
            marginTop: 0,
            lineHeight: 1.6,
          }}
        >
          Copie os dados abaixo e envie para a pessoa.{' '}
          <strong style={{ color: T.aviso }}>
            Esta senha não aparece de novo.
          </strong>
        </p>

        <pre
          style={{
            background: T.bgElevated,
            border: `1px solid ${T.border}`,
            borderRadius: T.radiusSm,
            padding: '12px 14px',
            fontFamily: T.fontBody,
            fontSize: 12.5,
            color: T.textPrimary,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: '14px 0',
          }}
        >
          {texto}
        </pre>

        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...TS.botaoSecundario,
              flex: '1 1 150px',
              textAlign: 'center',
              textDecoration: 'none',
              color: T.whatsapp,
              borderColor: T.whatsappBorder,
            }}
          >
            Enviar no WhatsApp
          </a>
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(texto)}
            style={{ ...TS.botaoSecundario, flex: '1 1 130px' }}
          >
            Copiar
          </button>
        </div>

        <button
          type="button"
          onClick={() => void aoCriar()}
          style={{ ...TS.botaoPrimario, width: '100%', marginTop: 12 }}
        >
          Concluir
        </button>
      </Modal>
    );
  }

  return (
    <Modal titulo="Novo colecionador" aoFechar={aoFechar}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setErro(null);
          setSalvando(true);
          try {
            await criarColecionador({ nome, email, senha });
            setPronto(true);
          } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao criar.');
          } finally {
            setSalvando(false);
          }
        }}
      >
        <Campo rotulo="Nome" id="nc-nome">
          <input
            id="nc-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            autoFocus
            style={TS.input}
          />
        </Campo>

        <Campo rotulo="E-mail" id="nc-email">
          <input
            id="nc-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={TS.input}
          />
        </Campo>

        <Campo rotulo="Senha provisória" id="nc-senha">
          <div style={{ display: 'flex', gap: 7 }}>
            <div style={{ flex: 1 }}>
              <CampoSenha
                id="nc-senha"
                valor={senha}
                aoMudar={setSenha}
                autoComplete="new-password"
                minLength={8}
                monoespacada
              />
            </div>
            <button
              type="button"
              onClick={() => setSenha(gerarSenha())}
              style={{ ...TS.botaoSecundario, padding: '0 14px' }}
            >
              Gerar
            </button>
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: T.textMuted,
              marginTop: 5,
              fontFamily: T.fontBody,
            }}
          >
            A pessoa troca depois de entrar, em Esqueci minha senha.
          </div>
        </Campo>

        {erro && (
          <div
            role="alert"
            style={{
              background: T.erroFaint,
              border: `1px solid ${T.erro}`,
              borderRadius: T.radiusSm,
              padding: '10px 12px',
              marginBottom: 12,
              fontSize: 13,
              color: T.erro,
              fontFamily: T.fontBody,
              lineHeight: 1.5,
            }}
          >
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={salvando}
          style={{ ...TS.botaoPrimario, width: '100%', opacity: salvando ? 0.6 : 1 }}
        >
          {salvando ? 'Criando...' : 'Criar conta'}
        </button>
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------- */

function gerarSenha(): string {
  const letras = 'abcdefghijkmnopqrstuvwxyz';
  const maius = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const nums = '23456789';
  const todos = letras + maius + nums;
  const sorteio = (fonte: string) =>
    fonte[Math.floor(Math.random() * fonte.length)];

  const base = [sorteio(maius), sorteio(letras), sorteio(nums)];
  for (let i = 0; i < 7; i++) base.push(sorteio(todos));
  return base.sort(() => Math.random() - 0.5).join('');
}

function Selo({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        marginLeft: 8,
        fontSize: 9.5,
        fontWeight: 700,
        color: cor,
        border: `1px solid ${cor}`,
        borderRadius: 99,
        padding: '2px 7px',
        letterSpacing: 0.4,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function Cartao({
  Icone,
  rotulo,
  valor,
  cor,
}: {
  Icone: typeof Users;
  rotulo: string;
  valor: number;
  cor: string;
}) {
  return (
    <div style={{ ...TS.card, padding: 14 }}>
      <Icone size={17} color={cor} />
      <div
        style={{
          fontFamily: T.fontTitle,
          fontSize: 21,
          fontWeight: 700,
          color: cor,
          marginTop: 8,
        }}
      >
        {valor}
      </div>
      <div
        style={{
          fontFamily: T.fontBody,
          fontSize: 11.5,
          color: T.textMuted,
          marginTop: 2,
        }}
      >
        {rotulo}
      </div>
    </div>
  );
}

function Campo({
  rotulo,
  id,
  children,
}: {
  rotulo: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={TS.label} htmlFor={id}>
        {rotulo}
      </label>
      {children}
    </div>
  );
}

function AbaBotao({
  ativa,
  Icone,
  rotulo,
  aoClicar,
}: {
  ativa: boolean;
  Icone: typeof Users;
  rotulo: string;
  aoClicar: () => void;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '10px 15px',
        background: ativa ? T.neonFaint : 'transparent',
        border: `1.5px solid ${ativa ? T.neon : T.border}`,
        borderRadius: T.radius,
        color: ativa ? T.neon : T.textSecondary,
        fontSize: 13,
        fontWeight: ativa ? 700 : 500,
        fontFamily: T.fontBody,
        cursor: 'pointer',
      }}
    >
      <Icone size={16} />
      {rotulo}
    </button>
  );
}

function Caixa({ texto, erro = false }: { texto: string; erro?: boolean }) {
  return (
    <div
      style={{
        ...TS.card,
        textAlign: 'center',
        color: erro ? T.erro : T.textMuted,
        borderColor: erro ? T.erro : T.border,
        fontFamily: T.fontBody,
        fontSize: 13.5,
        marginBottom: 14,
      }}
    >
      {texto}
    </div>
  );
}
