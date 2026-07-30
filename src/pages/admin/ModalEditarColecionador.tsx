import { useState } from 'react';
import { AlertTriangle, KeyRound, Mail, User } from 'lucide-react';
import { T, TS } from '../../theme';
import {
  editarDadosColecionador,
  editarAcessoColecionador,
} from '../../lib/api';
import { Modal } from '../Colecoes';
import { CampoSenha } from '../../components/CampoSenha';
import type { UsuarioLinha } from './Admin';

type Aba = 'dados' | 'acesso' | 'assinatura';

export function ModalEditarColecionador({
  usuario,
  aoFechar,
  aoSalvar,
}: {
  usuario: UsuarioLinha;
  aoFechar: () => void;
  aoSalvar: () => Promise<void>;
}) {
  const [aba, setAba] = useState<Aba>('dados');

  return (
    <Modal titulo="Editar colecionador" aoFechar={aoFechar}>
      <div
        style={{
          fontFamily: T.fontBody,
          fontSize: 12.5,
          color: T.textMuted,
          marginBottom: 14,
        }}
      >
        {usuario.email}
      </div>

      <div style={{ display: 'flex', gap: 7, marginBottom: 18 }}>
        <AbaBotao ativa={aba === 'dados'} Icone={User} rotulo="Dados" aoClicar={() => setAba('dados')} />
        <AbaBotao ativa={aba === 'acesso'} Icone={KeyRound} rotulo="Acesso" aoClicar={() => setAba('acesso')} />
        <AbaBotao ativa={aba === 'assinatura'} Icone={Mail} rotulo="Assinatura" aoClicar={() => setAba('assinatura')} />
      </div>

      {aba === 'dados' && (
        <AbaDados usuario={usuario} aoSalvar={aoSalvar} />
      )}
      {aba === 'acesso' && (
        <AbaAcesso usuario={usuario} aoSalvar={aoSalvar} />
      )}
      {aba === 'assinatura' && (
        <AbaAssinatura usuario={usuario} aoSalvar={aoSalvar} />
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------- */

function AbaDados({
  usuario,
  aoSalvar,
}: {
  usuario: UsuarioLinha;
  aoSalvar: () => Promise<void>;
}) {
  const [nome, setNome] = useState(usuario.nome ?? '');
  const [apelido, setApelido] = useState(usuario.apelido ?? '');
  const [cidade, setCidade] = useState(usuario.cidade ?? '');
  const [whatsapp, setWhatsapp] = useState(usuario.whatsapp ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setErro(null);
        setOk(false);

        const apelidoLimpo = apelido.trim().toLowerCase();
        if (apelidoLimpo && !/^[a-z0-9_.-]{3,30}$/.test(apelidoLimpo)) {
          return setErro(
            'Apelido: 3 a 30 caracteres, só letras minúsculas, números, ponto, hífen e underline.'
          );
        }

        setSalvando(true);
        try {
          await editarDadosColecionador(usuario.id, {
            nome: nome.trim() || null,
            apelido: apelidoLimpo || null,
            cidade: cidade.trim() || null,
            whatsapp: whatsapp.replace(/\D/g, '') || null,
          });
          setOk(true);
          await aoSalvar();
        } catch (err) {
          setErro(err instanceof Error ? err.message : 'Erro ao salvar.');
        } finally {
          setSalvando(false);
        }
      }}
    >
      <Campo rotulo="Nome" id="ec-nome">
        <input id="ec-nome" value={nome} onChange={(e) => setNome(e.target.value)} style={TS.input} />
      </Campo>

      <Campo rotulo="Apelido" id="ec-apelido">
        <input id="ec-apelido" value={apelido} onChange={(e) => setApelido(e.target.value)} style={TS.input} />
      </Campo>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Campo rotulo="Cidade" id="ec-cidade">
            <input id="ec-cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} style={TS.input} />
          </Campo>
        </div>
        <div style={{ flex: 1 }}>
          <Campo rotulo="WhatsApp" id="ec-zap">
            <input
              id="ec-zap"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              inputMode="numeric"
              placeholder="11987654321"
              style={TS.input}
            />
          </Campo>
        </div>
      </div>

      {erro && <Erro>{erro}</Erro>}

      <button
        type="submit"
        disabled={salvando}
        style={{ ...TS.botaoPrimario, width: '100%', opacity: salvando ? 0.6 : 1 }}
      >
        {salvando ? 'Salvando...' : ok ? 'Salvo!' : 'Salvar dados'}
      </button>
    </form>
  );
}

/* -------------------------------------------------------------- */

function AbaAcesso({
  usuario,
  aoSalvar,
}: {
  usuario: UsuarioLinha;
  aoSalvar: () => Promise<void>;
}) {
  const ehAdmin = usuario.papel === 'super_admin';

  const [email, setEmail] = useState('');
  const [emailRepetido, setEmailRepetido] = useState('');
  const [senha, setSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function aplicar(o: 'email' | 'senha') {
    setErro(null);
    setAviso(null);

    if (o === 'email') {
      const a = email.trim().toLowerCase();
      const b = emailRepetido.trim().toLowerCase();
      if (!a) return setErro('Informe o novo e-mail.');
      if (a !== b) return setErro('Os dois e-mails não são iguais.');
      if (a === usuario.email.toLowerCase()) {
        return setErro('Esse já é o e-mail atual.');
      }
    } else if (senha.length < 8) {
      return setErro('A senha precisa ter pelo menos 8 caracteres.');
    }

    setSalvando(true);
    try {
      await editarAcessoColecionador({
        usuarioId: usuario.id,
        ...(o === 'email'
          ? { email: email.trim().toLowerCase() }
          : { senha }),
      });

      if (o === 'email') {
        setAviso(`E-mail alterado. A partir de agora ele entra com ${email.trim().toLowerCase()}.`);
        setEmail('');
        setEmailRepetido('');
      } else {
        setAviso('Senha alterada. Passe a nova senha para ele.');
      }
      await aoSalvar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao alterar.');
    } finally {
      setSalvando(false);
    }
  }

  if (ehAdmin) {
    return (
      <Alerta>
        Esta é a conta do administrador. O e-mail dela é a chave da regra no
        banco, então não pode ser alterado por aqui — mexer nele trancaria você
        fora da própria conta.
      </Alerta>
    );
  }

  return (
    <div>
      {/* Senha */}
      <div style={{ ...TS.label, marginBottom: 10 }}>Definir nova senha</div>
      <div style={{ marginBottom: 10 }}>
        <CampoSenha
          id="ec-senha"
          valor={senha}
          aoMudar={setSenha}
          autoComplete="new-password"
          minLength={8}
          required={false}
          monoespacada
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => setSenha(gerarSenha())}
          style={{ ...TS.botaoSecundario, flex: 1, padding: '11px 14px' }}
        >
          Gerar
        </button>
        <button
          type="button"
          disabled={salvando || senha.length < 8}
          onClick={() => void aplicar('senha')}
          style={{
            ...TS.botaoPrimario,
            flex: 2,
            opacity: salvando || senha.length < 8 ? 0.5 : 1,
          }}
        >
          Alterar senha
        </button>
      </div>
      <Dica>
        Você fica sabendo a senha. Se ele ainda tem acesso ao e-mail, prefira o
        botão <strong>Redefinir senha</strong> na ficha: o link vai para ele e
        ninguém mais conhece a senha.
      </Dica>

      <div
        style={{
          height: 1,
          background: T.border,
          margin: '22px 0 18px',
        }}
      />

      {/* E-mail */}
      <div style={{ ...TS.label, marginBottom: 6 }}>Trocar o e-mail de acesso</div>
      <Dica>Atual: {usuario.email}</Dica>

      <div style={{ marginTop: 10 }}>
        <Campo rotulo="Novo e-mail" id="ec-email">
          <input
            id="ec-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={TS.input}
          />
        </Campo>
        <Campo rotulo="Repita o novo e-mail" id="ec-email2">
          <input
            id="ec-email2"
            type="email"
            value={emailRepetido}
            onChange={(e) => setEmailRepetido(e.target.value)}
            style={{
              ...TS.input,
              borderColor:
                emailRepetido && emailRepetido.trim().toLowerCase() !== email.trim().toLowerCase()
                  ? T.erro
                  : T.border,
            }}
          />
        </Campo>
      </div>

      <Alerta>
        Depois da troca, ele só entra com o e-mail novo. Errar aqui tranca a
        pessoa fora da conta — por isso pedimos duas vezes.
      </Alerta>

      <button
        type="button"
        disabled={salvando || !email.trim()}
        onClick={() => void aplicar('email')}
        style={{
          ...TS.botaoPrimario,
          width: '100%',
          marginTop: 12,
          opacity: salvando || !email.trim() ? 0.5 : 1,
        }}
      >
        {salvando ? 'Alterando...' : 'Alterar e-mail'}
      </button>

      {erro && <Erro>{erro}</Erro>}
      {aviso && <Sucesso>{aviso}</Sucesso>}
    </div>
  );
}

/* -------------------------------------------------------------- */

function AbaAssinatura({
  usuario,
  aoSalvar,
}: {
  usuario: UsuarioLinha;
  aoSalvar: () => Promise<void>;
}) {
  const [ate, setAte] = useState(usuario.assinatura_ate ?? '');
  const [isento, setIsento] = useState(usuario.isento);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  return (
    <div>
      <Dica>
        Use aqui para dar cortesia ou corrigir uma data. Pagamento recebido
        deve ser lançado pelo botão <strong>Lançar pagamento</strong>, que
        também guarda o histórico.
      </Dica>

      <div style={{ marginTop: 14 }}>
        <Campo rotulo="Assinatura válida até" id="ec-ate">
          <input
            id="ec-ate"
            type="date"
            value={ate}
            onChange={(e) => setAte(e.target.value)}
            disabled={isento}
            style={{
              ...TS.input,
              colorScheme: 'dark',
              opacity: isento ? 0.5 : 1,
            }}
          />
        </Campo>
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '12px 14px',
          background: isento ? T.neonFaint : T.bgElevated,
          border: `1px solid ${isento ? T.neonBorder : T.border}`,
          borderRadius: T.radiusSm,
          marginBottom: 16,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={isento}
          onChange={(e) => setIsento(e.target.checked)}
          style={{ marginTop: 2, accentColor: T.neon, width: 16, height: 16 }}
        />
        <span
          style={{
            fontFamily: T.fontBody,
            fontSize: 13,
            color: T.textSecondary,
            lineHeight: 1.5,
          }}
        >
          Isento de pagamento
          <br />
          <span style={{ color: T.textMuted, fontSize: 12 }}>
            Nunca vence e não aparece na lista de cobrança.
          </span>
        </span>
      </label>

      {erro && <Erro>{erro}</Erro>}

      <button
        type="button"
        disabled={salvando}
        onClick={async () => {
          setErro(null);
          setOk(false);
          setSalvando(true);
          try {
            await editarDadosColecionador(usuario.id, {
              assinatura_ate: isento ? null : ate || null,
              isento,
            });
            setOk(true);
            await aoSalvar();
          } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao salvar.');
          } finally {
            setSalvando(false);
          }
        }}
        style={{ ...TS.botaoPrimario, width: '100%', opacity: salvando ? 0.6 : 1 }}
      >
        {salvando ? 'Salvando...' : ok ? 'Salvo!' : 'Salvar assinatura'}
      </button>
    </div>
  );
}

/* -------------------------------------------------------------- */

function gerarSenha(): string {
  const letras = 'abcdefghijkmnopqrstuvwxyz';
  const maius = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const nums = '23456789';
  const todos = letras + maius + nums;
  const s = (f: string) => f[Math.floor(Math.random() * f.length)];
  const base = [s(maius), s(letras), s(nums)];
  for (let i = 0; i < 7; i++) base.push(s(todos));
  return base.sort(() => Math.random() - 0.5).join('');
}

function AbaBotao({
  ativa,
  Icone,
  rotulo,
  aoClicar,
}: {
  ativa: boolean;
  Icone: typeof User;
  rotulo: string;
  aoClicar: () => void;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '9px 10px',
        background: ativa ? T.neonFaint : 'transparent',
        border: `1.5px solid ${ativa ? T.neon : T.border}`,
        borderRadius: T.radiusSm,
        color: ativa ? T.neon : T.textSecondary,
        fontFamily: T.fontBody,
        fontSize: 12.5,
        fontWeight: ativa ? 700 : 500,
        cursor: 'pointer',
      }}
    >
      <Icone size={14} />
      {rotulo}
    </button>
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

function Dica({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: T.fontBody,
        fontSize: 11.5,
        color: T.textMuted,
        lineHeight: 1.55,
      }}
    >
      {children}
    </div>
  );
}

function Alerta({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 9,
        alignItems: 'flex-start',
        background: T.avisoFaint,
        border: `1px solid ${T.aviso}`,
        borderRadius: T.radiusSm,
        padding: '11px 13px',
        marginTop: 12,
        fontFamily: T.fontBody,
        fontSize: 12.5,
        color: T.textSecondary,
        lineHeight: 1.55,
      }}
    >
      <AlertTriangle size={15} color={T.aviso} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{children}</span>
    </div>
  );
}

function Erro({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      style={{
        background: T.erroFaint,
        border: `1px solid ${T.erro}`,
        borderRadius: T.radiusSm,
        padding: '10px 12px',
        margin: '12px 0',
        fontSize: 13,
        color: T.erro,
        fontFamily: T.fontBody,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}

function Sucesso({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: T.tenhoFaint,
        border: `1px solid ${T.tenho}`,
        borderRadius: T.radiusSm,
        padding: '10px 12px',
        margin: '12px 0',
        fontSize: 13,
        color: T.tenho,
        fontFamily: T.fontBody,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}
