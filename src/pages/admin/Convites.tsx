import { useState, useEffect, useCallback } from 'react';
import { Plus, Ticket } from 'lucide-react';
import { T, TS } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { BotaoWhatsApp } from '../../components/BotaoWhatsApp';
import { BotaoCopiarLink } from '../../components/BotaoCopiarLink';
import { msg } from '../../lib/mensagens';

interface Convite {
  id: string;
  codigo: string;
  email: string | null;
  observacao: string | null;
  usado_em: string | null;
  expira_em: string;
  created_at: string;
}

export function Convites() {
  const { perfil } = useAuth();
  const [convites, setConvites] = useState<Convite[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [observacao, setObservacao] = useState('');
  const [gerando, setGerando] = useState(false);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('convites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) setErro(error.message);
    else setConvites((data ?? []) as Convite[]);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function gerar(e: React.FormEvent) {
    e.preventDefault();
    if (!perfil) return;
    setErro(null);
    setGerando(true);

    const { error } = await supabase.from('convites').insert({
      codigo: gerarCodigo(),
      email: email.trim().toLowerCase() || null,
      observacao: observacao.trim() || null,
      criado_por: perfil.id,
    });

    if (error) setErro(error.message);
    else {
      setEmail('');
      setObservacao('');
      await carregar();
    }
    setGerando(false);
  }

  const abertos = convites.filter((c) => !c.usado_em && !venceu(c));
  const usados = convites.filter((c) => c.usado_em);
  const vencidos = convites.filter((c) => !c.usado_em && venceu(c));

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ ...TS.titulo, fontSize: 22, marginBottom: 4 }}>Convites</h1>
      <p
        style={{
          fontFamily: T.fontBody,
          fontSize: 13.5,
          color: T.textSecondary,
          marginTop: 0,
          marginBottom: 22,
          lineHeight: 1.6,
        }}
      >
        O cadastro é fechado. Gere um código e envie o link para quem vai entrar.
        Cada código serve para uma pessoa só e vale por 30 dias.
      </p>

      {/* Gerar novo */}
      <form onSubmit={gerar} style={{ ...TS.card, marginBottom: 24 }}>
        <div style={{ ...TS.label, marginBottom: 12 }}>Gerar convite</div>

        <div style={{ marginBottom: 12 }}>
          <label style={TS.label} htmlFor="obs">
            Para quem é (opcional)
          </label>
          <input
            id="obs"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="ex: João do grupo do álbum"
            style={TS.input}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={TS.label} htmlFor="email-convite">
            Travar num e-mail (opcional)
          </label>
          <input
            id="email-convite"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="deixe vazio para qualquer e-mail"
            style={TS.input}
          />
          <div
            style={{
              fontSize: 11.5,
              color: T.textMuted,
              marginTop: 5,
              fontFamily: T.fontBody,
            }}
          >
            Preenchido, o convite só funciona para esse e-mail.
          </div>
        </div>

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
            }}
          >
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={gerando}
          style={{
            ...TS.botaoPrimario,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: gerando ? 0.6 : 1,
          }}
        >
          <Plus size={17} />
          {gerando ? 'Gerando...' : 'Gerar convite'}
        </button>
      </form>

      {carregando ? (
        <Vazio texto="Carregando..." />
      ) : (
        <>
          <Secao titulo="Abertos" quantidade={abertos.length}>
            {abertos.length === 0 ? (
              <Vazio texto="Nenhum convite aberto." />
            ) : (
              abertos.map((c) => <CartaoConvite key={c.id} convite={c} />)
            )}
          </Secao>

          {usados.length > 0 && (
            <Secao titulo="Usados" quantidade={usados.length}>
              {usados.map((c) => (
                <CartaoConvite key={c.id} convite={c} apagado />
              ))}
            </Secao>
          )}

          {vencidos.length > 0 && (
            <Secao titulo="Vencidos" quantidade={vencidos.length}>
              {vencidos.map((c) => (
                <CartaoConvite key={c.id} convite={c} apagado />
              ))}
            </Secao>
          )}
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- */

function CartaoConvite({
  convite,
  apagado = false,
}: {
  convite: Convite;
  apagado?: boolean;
}) {
  const link = `${window.location.origin}/login?convite=${convite.codigo}`;

  return (
    <div
      style={{
        ...TS.card,
        marginBottom: 10,
        opacity: apagado ? 0.5 : 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: convite.observacao || convite.email ? 8 : 12,
          flexWrap: 'wrap',
        }}
      >
        <Ticket size={18} color={T.neon} style={{ flexShrink: 0 }} />
        <code
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: T.neon,
            letterSpacing: 1.5,
            fontFamily: T.fontTitle,
          }}
        >
          {convite.codigo}
        </code>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11.5,
            color: T.textMuted,
            fontFamily: T.fontBody,
          }}
        >
          {convite.usado_em
            ? `usado em ${dataBR(convite.usado_em)}`
            : `vence em ${dataBR(convite.expira_em)}`}
        </span>
      </div>

      {(convite.observacao || convite.email) && (
        <div
          style={{
            fontSize: 12.5,
            color: T.textSecondary,
            fontFamily: T.fontBody,
            marginBottom: 12,
          }}
        >
          {convite.observacao}
          {convite.observacao && convite.email && ' · '}
          {convite.email}
        </div>
      )}

      {!apagado && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 150px' }}>
            <BotaoWhatsApp
              mensagem={msg.convite(link)}
              variant="full"
              rotulo="Enviar convite"
            />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <BotaoCopiarLink url={link} variant="full" />
          </div>
        </div>
      )}
    </div>
  );
}

function Secao({
  titulo,
  quantidade,
  children,
}: {
  titulo: string;
  quantidade: number;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ ...TS.label, marginBottom: 10 }}>
        {titulo} · {quantidade}
      </div>
      {children}
    </div>
  );
}

function Vazio({ texto }: { texto: string }) {
  return (
    <div
      style={{
        ...TS.card,
        textAlign: 'center',
        color: T.textMuted,
        fontFamily: T.fontBody,
        fontSize: 13.5,
      }}
    >
      {texto}
    </div>
  );
}

/** Código legível: sem 0/O e 1/I, para não confundir na hora de digitar. */
function gerarCodigo(): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bloco = (n: number) =>
    Array.from(
      { length: n },
      () => alfabeto[Math.floor(Math.random() * alfabeto.length)]
    ).join('');
  return `${bloco(4)}-${bloco(4)}`;
}

function venceu(c: Convite) {
  return new Date(c.expira_em) < new Date();
}

function dataBR(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}
