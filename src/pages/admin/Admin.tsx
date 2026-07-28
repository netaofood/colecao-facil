import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  LayoutDashboard,
  UserPlus,
  Power,
  Library,
  Repeat,
  Copy as CopyIcon,
  CreditCard,
  Search,
  KeyRound,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { T, TS } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import {
  resumoDoColecionador,
  enviarRedefinicaoSenha,
  registrarPagamento,
  listarPagamentos,
  situacaoAssinatura,
  diasRestantes,
  moeda,
  VALOR_PLANO,
} from '../../lib/api';
import type {
  ResumoColecionador,
  Pagamento,
  SituacaoAssinatura,
} from '../../lib/api';
import { Modal } from '../Colecoes';
import { BotaoWhatsApp } from '../../components/BotaoWhatsApp';
import { BotaoCopiarLink } from '../../components/BotaoCopiarLink';
import { msg } from '../../lib/mensagens';
import { CampoSenha } from '../../components/CampoSenha';

type Aba = 'painel' | 'colecionadores' | 'pagamentos';

export interface UsuarioLinha {
  id: string;
  email: string;
  nome: string | null;
  apelido: string | null;
  cidade: string | null;
  whatsapp: string | null;
  papel: string;
  ativo: boolean;
  isento: boolean;
  assinatura_ate: string | null;
  primeiro_acesso_em: string | null;
  created_at: string;
}

const CAMPOS =
  'id, email, nome, apelido, cidade, whatsapp, papel, ativo, isento, assinatura_ate, primeiro_acesso_em, created_at';

export function Admin() {
  const [aba, setAba] = useState<Aba>('painel');
  const [usuarios, setUsuarios] = useState<UsuarioLinha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select(CAMPOS)
      .order('created_at', { ascending: false });

    if (error) setErro(error.message);
    else setUsuarios((data ?? []) as UsuarioLinha[]);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

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
        <AbaBotao
          ativa={aba === 'pagamentos'}
          Icone={CreditCard}
          rotulo="Pagamentos"
          aoClicar={() => setAba('pagamentos')}
        />
      </div>

      {erro && <Caixa texto={erro} erro />}

      {carregando ? (
        <Caixa texto="Carregando..." />
      ) : (
        <>
          {aba === 'painel' && <Painel usuarios={usuarios} />}
          {aba === 'colecionadores' && (
            <Colecionadores usuarios={usuarios} aoMudar={carregar} />
          )}
          {aba === 'pagamentos' && (
            <Pagamentos usuarios={usuarios} aoMudar={carregar} />
          )}
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- */
/* PAINEL                                                          */
/* -------------------------------------------------------------- */

function Painel({ usuarios }: { usuarios: UsuarioLinha[] }) {
  const [totais, setTotais] = useState<{
    colecoes: number;
    itens: number;
    repetidas: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const [colecoes, itens, repetidas] = await Promise.all([
        supabase.from('colecoes').select('*', { count: 'exact', head: true }),
        supabase.from('itens').select('*', { count: 'exact', head: true }),
        supabase
          .from('itens_usuario')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'repetida'),
      ]);
      setTotais({
        colecoes: colecoes.count ?? 0,
        itens: itens.count ?? 0,
        repetidas: repetidas.count ?? 0,
      });
    })();
  }, []);

  const pagantes = usuarios.filter((u) => !u.isento);
  const emDia = pagantes.filter(
    (u) => situacaoAssinatura(u.isento, u.assinatura_ate) === 'em_dia'
  );
  const vencendo = pagantes.filter(
    (u) => situacaoAssinatura(u.isento, u.assinatura_ate) === 'vencendo'
  );
  const vencidas = pagantes.filter(
    (u) => situacaoAssinatura(u.isento, u.assinatura_ate) === 'vencida'
  );
  const nuncaAcessaram = usuarios.filter(
    (u) => !u.primeiro_acesso_em && u.papel !== 'super_admin'
  );

  const receitaPrevista = (emDia.length + vencendo.length) * VALOR_PLANO;

  return (
    <div>
      <div style={{ ...TS.label, marginBottom: 10 }}>Assinaturas</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
          gap: 10,
          marginBottom: 24,
        }}
      >
        <Cartao Icone={CheckCircle2} rotulo="Em dia" valor={emDia.length} cor={T.tenho} />
        <Cartao
          Icone={AlertTriangle}
          rotulo="Vencendo em 7 dias"
          valor={vencendo.length}
          cor={vencendo.length > 0 ? T.aviso : T.textMuted}
        />
        <Cartao
          Icone={X}
          rotulo="Vencidas"
          valor={vencidas.length}
          cor={vencidas.length > 0 ? T.erro : T.textMuted}
        />
        <Cartao
          Icone={CreditCard}
          rotulo="Receita no mês"
          valor={receitaPrevista}
          cor={T.neon}
          moedaBRL
        />
      </div>

      <div style={{ ...TS.label, marginBottom: 10 }}>Uso</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
          gap: 10,
          marginBottom: 24,
        }}
      >
        <Cartao Icone={Users} rotulo="Colecionadores" valor={usuarios.length} cor={T.textPrimary} />
        <Cartao
          Icone={UserPlus}
          rotulo="Nunca acessaram"
          valor={nuncaAcessaram.length}
          cor={nuncaAcessaram.length > 0 ? T.aviso : T.textMuted}
        />
        <Cartao Icone={Library} rotulo="Coleções" valor={totais?.colecoes ?? 0} cor={T.textPrimary} />
        <Cartao Icone={CopyIcon} rotulo="Itens" valor={totais?.itens ?? 0} cor={T.textPrimary} />
        <Cartao Icone={Repeat} rotulo="Repetidas" valor={totais?.repetidas ?? 0} cor={T.repetida} />
      </div>

      {(vencidas.length > 0 || vencendo.length > 0) && (
        <>
          <div style={{ ...TS.label, marginBottom: 10 }}>Precisam de atenção</div>
          {[...vencidas, ...vencendo].map((u) => (
            <div
              key={u.id}
              style={{
                ...TS.card,
                marginBottom: 7,
                padding: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontFamily: T.fontBody,
                  fontSize: 13.5,
                  color: T.textPrimary,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {u.nome ?? u.email}
              </span>
              <SeloAssinatura usuario={u} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- */
/* COLECIONADORES                                                  */
/* -------------------------------------------------------------- */

type Filtro = 'todos' | 'em_dia' | 'vencidas' | 'nunca_acessaram' | 'inativos';

function Colecionadores({
  usuarios,
  aoMudar,
}: {
  usuarios: UsuarioLinha[];
  aoMudar: () => Promise<void>;
}) {
  const { perfil } = useAuth();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [novo, setNovo] = useState(false);
  const [ficha, setFicha] = useState<UsuarioLinha | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const lista = useMemo(() => {
    let l = usuarios;

    if (filtro === 'em_dia') {
      l = l.filter((u) =>
        ['em_dia', 'vencendo', 'isento'].includes(
          situacaoAssinatura(u.isento, u.assinatura_ate)
        )
      );
    } else if (filtro === 'vencidas') {
      l = l.filter(
        (u) => situacaoAssinatura(u.isento, u.assinatura_ate) === 'vencida'
      );
    } else if (filtro === 'nunca_acessaram') {
      l = l.filter((u) => !u.primeiro_acesso_em && u.papel !== 'super_admin');
    } else if (filtro === 'inativos') {
      l = l.filter((u) => !u.ativo);
    }

    const t = busca.trim().toLowerCase();
    if (!t) return l;
    return l.filter(
      (u) =>
        u.email.toLowerCase().includes(t) ||
        (u.nome ?? '').toLowerCase().includes(t) ||
        (u.apelido ?? '').toLowerCase().includes(t) ||
        (u.cidade ?? '').toLowerCase().includes(t)
    );
  }, [usuarios, filtro, busca]);

  async function alternarAtivo(u: UsuarioLinha) {
    const { error } = await supabase
      .from('usuarios')
      .update({ ativo: !u.ativo })
      .eq('id', u.id);
    if (error) setErro(error.message);
    else await aoMudar();
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setNovo(true)}
        style={{
          ...TS.botaoPrimario,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          marginBottom: 18,
        }}
      >
        <UserPlus size={17} />
        Novo colecionador
      </button>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search
          size={16}
          color={T.textMuted}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, e-mail, apelido ou cidade"
          style={{ ...TS.input, paddingLeft: 36 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
        <Pilula ativa={filtro === 'todos'} aoClicar={() => setFiltro('todos')}>
          Todos · {usuarios.length}
        </Pilula>
        <Pilula
          ativa={filtro === 'em_dia'}
          cor={T.tenho}
          aoClicar={() => setFiltro('em_dia')}
        >
          Em dia
        </Pilula>
        <Pilula
          ativa={filtro === 'vencidas'}
          cor={T.erro}
          aoClicar={() => setFiltro('vencidas')}
        >
          Vencidas
        </Pilula>
        <Pilula
          ativa={filtro === 'nunca_acessaram'}
          cor={T.aviso}
          aoClicar={() => setFiltro('nunca_acessaram')}
        >
          Nunca acessaram
        </Pilula>
        <Pilula
          ativa={filtro === 'inativos'}
          cor={T.textMuted}
          aoClicar={() => setFiltro('inativos')}
        >
          Desativados
        </Pilula>
      </div>

      {erro && <Caixa texto={erro} erro />}

      {lista.length === 0 ? (
        <Caixa texto="Nenhum colecionador neste filtro." />
      ) : (
        lista.map((u) => (
          <div
            key={u.id}
            style={{ ...TS.card, marginBottom: 8, opacity: u.ativo ? 1 : 0.55 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => setFicha(u)}
                style={{
                  flex: '1 1 200px',
                  minWidth: 0,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    fontFamily: T.fontBody,
                    fontSize: 14,
                    fontWeight: 600,
                    color: T.textPrimary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    flexWrap: 'wrap',
                  }}
                >
                  {u.nome ?? u.email}
                  {u.papel === 'super_admin' && <Selo cor={T.neon}>ADMIN</Selo>}
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
                  {u.cidade && ` · ${u.cidade}`}
                </div>
                <div style={{ marginTop: 7 }}>
                  <SeloAssinatura usuario={u} />
                </div>
              </button>

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
        ))
      )}

      {novo && (
        <ModalNovaConta
          aoFechar={() => setNovo(false)}
          aoCriar={async () => {
            setNovo(false);
            await aoMudar();
          }}
        />
      )}

      {ficha && (
        <FichaColecionador
          usuario={ficha}
          aoFechar={() => setFicha(null)}
          aoMudar={aoMudar}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------- */
/* FICHA                                                           */
/* -------------------------------------------------------------- */

function FichaColecionador({
  usuario,
  aoFechar,
  aoMudar,
}: {
  usuario: UsuarioLinha;
  aoFechar: () => void;
  aoMudar: () => Promise<void>;
}) {
  const [resumo, setResumo] = useState<ResumoColecionador | null>(null);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [cobrando, setCobrando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([
        resumoDoColecionador(usuario.id),
        listarPagamentos(usuario.id),
      ]);
      setResumo(r);
      setPagamentos(p);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar.');
    }
  }, [usuario.id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <Modal titulo={usuario.nome ?? usuario.email} aoFechar={aoFechar}>
      <div
        style={{
          fontFamily: T.fontBody,
          fontSize: 12.5,
          color: T.textMuted,
          marginBottom: 4,
        }}
      >
        {usuario.email}
      </div>
      <div style={{ marginBottom: 18 }}>
        <SeloAssinatura usuario={usuario} />
      </div>

      {erro && <Caixa texto={erro} erro />}

      {/* Números */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))',
          gap: 8,
          marginBottom: 18,
        }}
      >
        <Mini rotulo="Coleções" valor={resumo?.colecoes ?? 0} cor={T.neon} />
        <Mini rotulo="Itens" valor={resumo?.itens ?? 0} cor={T.textPrimary} />
        <Mini rotulo="Já tem" valor={resumo?.tenho ?? 0} cor={T.tenho} />
        <Mini rotulo="Repetidas" valor={resumo?.repetidas ?? 0} cor={T.repetida} />
      </div>

      <Linha
        rotulo="Conta criada em"
        valor={new Date(usuario.created_at).toLocaleDateString('pt-BR')}
      />
      <Linha
        rotulo="Primeiro acesso"
        valor={
          usuario.primeiro_acesso_em
            ? new Date(usuario.primeiro_acesso_em).toLocaleDateString('pt-BR')
            : 'Ainda não acessou'
        }
      />
      <Linha
        rotulo="Última atividade"
        valor={
          resumo?.ultimaAtividade
            ? new Date(resumo.ultimaAtividade).toLocaleDateString('pt-BR')
            : 'Sem registro'
        }
      />

      {/* Pagamentos */}
      <div style={{ ...TS.label, marginTop: 20, marginBottom: 9 }}>
        Pagamentos · {pagamentos.length}
      </div>
      {pagamentos.length === 0 ? (
        <div
          style={{
            fontFamily: T.fontBody,
            fontSize: 12.5,
            color: T.textMuted,
            marginBottom: 14,
          }}
        >
          Nenhum pagamento registrado.
        </div>
      ) : (
        <div style={{ marginBottom: 14 }}>
          {pagamentos.slice(0, 6).map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
                padding: '8px 11px',
                background: T.bgElevated,
                border: `1px solid ${T.border}`,
                borderRadius: T.radiusSm,
                marginBottom: 5,
                fontFamily: T.fontBody,
                fontSize: 12.5,
                color: T.textSecondary,
              }}
            >
              <span>{new Date(`${p.pago_em}T12:00`).toLocaleDateString('pt-BR')}</span>
              <span style={{ color: T.tenho, fontWeight: 600 }}>
                {moeda(Number(p.valor))}
                {p.meses > 1 && ` · ${p.meses}m`}
              </span>
            </div>
          ))}
        </div>
      )}

      {aviso && (
        <div
          style={{
            background: T.tenhoFaint,
            border: `1px solid ${T.tenho}`,
            borderRadius: T.radiusSm,
            padding: '10px 12px',
            marginBottom: 12,
            fontSize: 13,
            color: T.tenho,
            fontFamily: T.fontBody,
          }}
        >
          {aviso}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!usuario.isento && (
          <button
            type="button"
            onClick={() => setCobrando(true)}
            style={{
              ...TS.botaoPrimario,
              flex: '1 1 160px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
            }}
          >
            <CreditCard size={16} />
            Registrar pagamento
          </button>
        )}
        <button
          type="button"
          onClick={async () => {
            setErro(null);
            try {
              await enviarRedefinicaoSenha(usuario.email);
              setAviso('Enviamos o link de nova senha para o e-mail dele.');
            } catch (e) {
              setErro(e instanceof Error ? e.message : 'Erro ao enviar.');
            }
          }}
          style={{
            ...TS.botaoSecundario,
            flex: '1 1 150px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
          }}
        >
          <KeyRound size={15} />
          Redefinir senha
        </button>
      </div>

      {cobrando && (
        <ModalPagamento
          usuario={usuario}
          aoFechar={() => setCobrando(false)}
          aoRegistrar={async (novaVigencia) => {
            setCobrando(false);
            setAviso(
              `Pagamento registrado. Assinatura válida até ${new Date(
                `${novaVigencia}T12:00`
              ).toLocaleDateString('pt-BR')}.`
            );
            await carregar();
            await aoMudar();
          }}
        />
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------- */
/* PAGAMENTOS                                                      */
/* -------------------------------------------------------------- */

function Pagamentos({
  usuarios,
  aoMudar,
}: {
  usuarios: UsuarioLinha[];
  aoMudar: () => Promise<void>;
}) {
  const [historico, setHistorico] = useState<Pagamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [cobrando, setCobrando] = useState<UsuarioLinha | null>(null);
  const [verHistorico, setVerHistorico] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setHistorico(await listarPagamentos());
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const nomes = new Map(usuarios.map((u) => [u.id, u.nome ?? u.email]));

  const mesAtual = new Date().toISOString().slice(0, 7);
  const doMes = historico.filter((p) => p.pago_em.startsWith(mesAtual));
  const recebidoNoMes = doMes.reduce((s, p) => s + Number(p.valor), 0);

  // Último pagamento de cada um, para mostrar na linha
  const ultimoPagamento = new Map<string, Pagamento>();
  for (const p of historico) {
    if (!ultimoPagamento.has(p.usuario_id)) ultimoPagamento.set(p.usuario_id, p);
  }

  // Quem está devendo aparece primeiro
  const ordem: Record<SituacaoAssinatura, number> = {
    vencida: 0,
    vencendo: 1,
    em_dia: 2,
    isento: 3,
  };

  const clientes = usuarios
    .filter((u) => !u.isento)
    .sort((a, b) => {
      const sa = ordem[situacaoAssinatura(a.isento, a.assinatura_ate)];
      const sb = ordem[situacaoAssinatura(b.isento, b.assinatura_ate)];
      if (sa !== sb) return sa - sb;
      return (a.nome ?? a.email).localeCompare(b.nome ?? b.email, 'pt-BR');
    });

  const aReceber = clientes.filter((u) =>
    ['vencida', 'vencendo'].includes(
      situacaoAssinatura(u.isento, u.assinatura_ate)
    )
  );

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
        <Cartao
          Icone={CreditCard}
          rotulo="Recebido no mês"
          valor={recebidoNoMes}
          cor={T.tenho}
          moedaBRL
        />
        <Cartao
          Icone={Receipt}
          rotulo="Lançamentos no mês"
          valor={doMes.length}
          cor={T.textPrimary}
        />
        <Cartao
          Icone={Users}
          rotulo="Assinantes"
          valor={clientes.length}
          cor={T.neon}
        />
        <Cartao
          Icone={AlertTriangle}
          rotulo="A cobrar"
          valor={aReceber.length}
          cor={aReceber.length > 0 ? T.aviso : T.textMuted}
        />
      </div>

      {erro && <Caixa texto={erro} erro />}

      <div style={{ ...TS.label, marginBottom: 10 }}>
        Clientes · {clientes.length}
      </div>

      {clientes.length === 0 ? (
        <Caixa texto="Nenhum assinante cadastrado." />
      ) : (
        clientes.map((u) => {
          const situacao = situacaoAssinatura(u.isento, u.assinatura_ate);
          const ultimo = ultimoPagamento.get(u.id);

          return (
            <div
              key={u.id}
              style={{
                ...TS.card,
                marginBottom: 8,
                padding: 14,
                borderColor:
                  situacao === 'vencida'
                    ? T.erro
                    : situacao === 'vencendo'
                      ? T.aviso
                      : T.border,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 12,
                }}
              >
                <div style={{ flex: '1 1 190px', minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: T.fontBody,
                      fontSize: 14,
                      fontWeight: 600,
                      color: T.textPrimary,
                    }}
                  >
                    {u.nome ?? u.email}
                  </div>
                  <div
                    style={{
                      fontFamily: T.fontBody,
                      fontSize: 11.5,
                      color: T.textMuted,
                      marginTop: 3,
                    }}
                  >
                    {ultimo
                      ? `último em ${new Date(`${ultimo.pago_em}T12:00`).toLocaleDateString('pt-BR')} · ${moeda(Number(ultimo.valor))}`
                      : 'nenhum pagamento registrado'}
                  </div>
                </div>

                <SeloAssinatura usuario={u} />
              </div>

              {/* Ações */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setCobrando(u)}
                  style={{
                    ...TS.botaoPrimario,
                    flex: '1 1 150px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    padding: '10px 14px',
                  }}
                >
                  <Receipt size={15} />
                  Lançar pagamento
                </button>

                <div style={{ flex: '1 1 150px' }}>
                  <BotaoWhatsApp
                    mensagem={msg.cobranca(
                      (u.nome ?? '').split(' ')[0] || 'tudo bem',
                      moeda(VALOR_PLANO),
                      situacao === 'isento' ? 'em_dia' : situacao,
                      formatarData(u.assinatura_ate)
                    )}
                    telefone={u.whatsapp ?? undefined}
                    variant="full"
                    rotulo={u.whatsapp ? 'Cobrar' : 'Cobrar (escolher)'}
                  />
                </div>

                <div style={{ flex: '0 1 130px' }}>
                  <BotaoCopiarLink
                    texto={msg.cobranca(
                      (u.nome ?? '').split(' ')[0] || 'tudo bem',
                      moeda(VALOR_PLANO),
                      situacao === 'isento' ? 'em_dia' : situacao,
                      formatarData(u.assinatura_ate)
                    )}
                    variant="full"
                    rotulo="Copiar"
                  />
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Histórico */}
      <button
        type="button"
        onClick={() => setVerHistorico((v) => !v)}
        style={{
          ...TS.botaoSecundario,
          marginTop: 18,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}
      >
        <Receipt size={15} />
        {verHistorico
          ? 'Ocultar histórico'
          : `Ver histórico completo (${historico.length})`}
      </button>

      {verHistorico &&
        (carregando ? (
          <Caixa texto="Carregando..." />
        ) : historico.length === 0 ? (
          <Caixa texto="Nenhum pagamento registrado ainda." />
        ) : (
          historico.map((p) => (
            <div
              key={p.id}
              style={{
                ...TS.card,
                padding: 12,
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: T.fontBody,
                    fontSize: 13,
                    fontWeight: 600,
                    color: T.textPrimary,
                  }}
                >
                  {nomes.get(p.usuario_id) ?? 'Conta removida'}
                </div>
                <div
                  style={{
                    fontFamily: T.fontBody,
                    fontSize: 11,
                    color: T.textMuted,
                    marginTop: 2,
                  }}
                >
                  {new Date(`${p.pago_em}T12:00`).toLocaleDateString('pt-BR')}
                  {' · vale até '}
                  {new Date(`${p.vigencia_ate}T12:00`).toLocaleDateString('pt-BR')}
                  {p.forma && ` · ${p.forma}`}
                </div>
              </div>
              <span
                style={{
                  fontFamily: T.fontTitle,
                  fontSize: 14,
                  fontWeight: 700,
                  color: T.tenho,
                }}
              >
                {moeda(Number(p.valor))}
              </span>
            </div>
          ))
        ))}

      {cobrando && (
        <ModalPagamento
          usuario={cobrando}
          aoFechar={() => setCobrando(null)}
          aoRegistrar={async () => {
            setCobrando(null);
            await carregar();
            await aoMudar();
          }}
        />
      )}
    </div>
  );
}

function ModalPagamento({
  usuario,
  aoFechar,
  aoRegistrar,
}: {
  usuario: UsuarioLinha;
  aoFechar: () => void;
  aoRegistrar: (novaVigencia: string) => Promise<void>;
}) {
  const [meses, setMeses] = useState(1);
  const [valor, setValor] = useState(String(VALOR_PLANO.toFixed(2)));
  const [forma, setForma] = useState('Pix');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  return (
    <Modal titulo="Registrar pagamento" aoFechar={aoFechar}>
      <p
        style={{
          fontFamily: T.fontBody,
          fontSize: 13.5,
          color: T.textSecondary,
          marginTop: 0,
          marginBottom: 16,
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: T.textPrimary }}>
          {usuario.nome ?? usuario.email}
        </strong>
        <br />
        Assinatura atual{' '}
        {usuario.assinatura_ate
          ? `até ${new Date(`${usuario.assinatura_ate}T12:00`).toLocaleDateString('pt-BR')}`
          : 'sem registro'}
        .
      </p>

      <div style={{ marginBottom: 14 }}>
        <label style={TS.label}>Quantos meses</label>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {[1, 3, 6, 12].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMeses(m);
                setValor((VALOR_PLANO * m).toFixed(2));
              }}
              style={{
                flex: '1 1 60px',
                padding: '10px 12px',
                borderRadius: T.radiusSm,
                border: `1.5px solid ${meses === m ? T.neon : T.border}`,
                background: meses === m ? T.neonFaint : 'transparent',
                color: meses === m ? T.neon : T.textSecondary,
                fontFamily: T.fontBody,
                fontSize: 13,
                fontWeight: meses === m ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {m}
              {m === 1 ? ' mês' : ' meses'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={TS.label} htmlFor="pg-valor">
            Valor recebido
          </label>
          <input
            id="pg-valor"
            type="number"
            step="0.01"
            min="0"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            style={TS.input}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={TS.label} htmlFor="pg-forma">
            Forma
          </label>
          <select
            id="pg-forma"
            value={forma}
            onChange={(e) => setForma(e.target.value)}
            style={{ ...TS.input, colorScheme: 'dark' }}
          >
            {['Pix', 'Dinheiro', 'Cartão', 'Transferência', 'Outro'].map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={TS.label} htmlFor="pg-obs">
          Observação
        </label>
        <input
          id="pg-obs"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="opcional"
          style={TS.input}
        />
      </div>

      {erro && <Caixa texto={erro} erro />}

      <button
        type="button"
        disabled={salvando}
        onClick={async () => {
          setErro(null);
          setSalvando(true);
          try {
            const nova = await registrarPagamento({
              usuarioId: usuario.id,
              meses,
              valor: Number(valor),
              forma,
              observacao: observacao || null,
            });
            await aoRegistrar(nova);
          } catch (e) {
            setErro(e instanceof Error ? e.message : 'Erro ao registrar.');
            setSalvando(false);
          }
        }}
        style={{ ...TS.botaoPrimario, width: '100%', opacity: salvando ? 0.6 : 1 }}
      >
        {salvando
          ? 'Registrando...'
          : `Registrar ${moeda(Number(valor) || 0)}`}
      </button>
    </Modal>
  );
}

/* -------------------------------------------------------------- */
/* NOVA CONTA                                                      */
/* -------------------------------------------------------------- */

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
          Copie os dados e envie para a pessoa.{' '}
          <strong style={{ color: T.aviso }}>
            Esta senha não aparece de novo.
          </strong>
          <br />A conta começa com 7 dias de cortesia.
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
        </Campo>

        {erro && <Caixa texto={erro} erro />}

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
/* PEÇAS                                                           */
/* -------------------------------------------------------------- */

function SeloAssinatura({ usuario }: { usuario: UsuarioLinha }) {
  const situacao = situacaoAssinatura(usuario.isento, usuario.assinatura_ate);
  const dias = diasRestantes(usuario.assinatura_ate);

  const config: Record<SituacaoAssinatura, { cor: string; texto: string }> = {
    isento: { cor: T.neon, texto: 'Isento' },
    em_dia: {
      cor: T.tenho,
      texto: `Em dia · até ${formatarData(usuario.assinatura_ate)}`,
    },
    vencendo: {
      cor: T.aviso,
      texto:
        dias === 0
          ? 'Vence hoje'
          : `Vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}`,
    },
    vencida: {
      cor: T.erro,
      texto: usuario.assinatura_ate
        ? `Vencida em ${formatarData(usuario.assinatura_ate)}`
        : 'Sem pagamento',
    },
  };

  const { cor, texto } = config[situacao];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 99,
        border: `1px solid ${cor}`,
        color: cor,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: T.fontBody,
        whiteSpace: 'nowrap',
      }}
    >
      {texto}
    </span>
  );
}

function formatarData(iso: string | null) {
  if (!iso) return '—';
  return new Date(`${iso}T12:00`).toLocaleDateString('pt-BR');
}

function gerarSenha(): string {
  const letras = 'abcdefghijkmnopqrstuvwxyz';
  const maius = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const nums = '23456789';
  const todos = letras + maius + nums;
  const sorteio = (f: string) => f[Math.floor(Math.random() * f.length)];
  const base = [sorteio(maius), sorteio(letras), sorteio(nums)];
  for (let i = 0; i < 7; i++) base.push(sorteio(todos));
  return base.sort(() => Math.random() - 0.5).join('');
}

function Mini({
  rotulo,
  valor,
  cor,
}: {
  rotulo: string;
  valor: number;
  cor: string;
}) {
  return (
    <div
      style={{
        background: T.bgElevated,
        border: `1px solid ${T.border}`,
        borderRadius: T.radiusSm,
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          fontFamily: T.fontTitle,
          fontSize: 17,
          fontWeight: 700,
          color: cor,
        }}
      >
        {valor}
      </div>
      <div
        style={{
          fontFamily: T.fontBody,
          fontSize: 10.5,
          color: T.textMuted,
          marginTop: 2,
        }}
      >
        {rotulo}
      </div>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 10,
        padding: '7px 0',
        borderBottom: `1px solid ${T.border}`,
        fontFamily: T.fontBody,
        fontSize: 12.5,
      }}
    >
      <span style={{ color: T.textMuted }}>{rotulo}</span>
      <span style={{ color: T.textSecondary }}>{valor}</span>
    </div>
  );
}

function Cartao({
  Icone,
  rotulo,
  valor,
  cor,
  moedaBRL = false,
}: {
  Icone: typeof Users;
  rotulo: string;
  valor: number;
  cor: string;
  moedaBRL?: boolean;
}) {
  return (
    <div style={{ ...TS.card, padding: 14 }}>
      <Icone size={17} color={cor} />
      <div
        style={{
          fontFamily: T.fontTitle,
          fontSize: moedaBRL ? 17 : 21,
          fontWeight: 700,
          color: cor,
          marginTop: 8,
        }}
      >
        {moedaBRL ? moeda(valor) : valor}
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

function Pilula({
  ativa,
  cor = T.neon,
  aoClicar,
  children,
}: {
  ativa: boolean;
  cor?: string;
  aoClicar: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      style={{
        padding: '7px 13px',
        borderRadius: 99,
        border: `1.5px solid ${ativa ? cor : T.border}`,
        background: ativa ? T.bgHover : 'transparent',
        color: ativa ? cor : T.textSecondary,
        fontSize: 12.5,
        fontWeight: ativa ? 700 : 500,
        fontFamily: T.fontBody,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

function Selo({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <span
      style={{
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
