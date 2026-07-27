import { useState, useEffect, useCallback } from 'react';
import { Repeat, ArrowRight, ArrowLeft, MapPin, Info } from 'lucide-react';
import { T, TS } from '../theme';
import { useAuth } from '../lib/auth';
import { listarMinhasColecoes, buscarMatches } from '../lib/api';
import type { Match } from '../lib/api';
import type { ColecaoComProgresso, Item } from '../lib/tipos';
import { BotaoWhatsApp } from '../components/BotaoWhatsApp';
import { msg } from '../lib/mensagens';

export function Trocas() {
  const { perfil } = useAuth();
  const [colecoes, setColecoes] = useState<ColecaoComProgresso[]>([]);
  const [colecaoId, setColecaoId] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!perfil) return;
    listarMinhasColecoes(perfil.id)
      .then((c) => {
        setColecoes(c);
        if (c.length > 0) setColecaoId(c[0].id);
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [perfil]);

  const procurar = useCallback(async () => {
    if (!perfil || !colecaoId) return;
    setBuscando(true);
    setErro(null);
    try {
      setMatches(await buscarMatches(perfil.id, colecaoId));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao buscar.');
    } finally {
      setBuscando(false);
    }
  }, [perfil, colecaoId]);

  useEffect(() => {
    if (colecaoId) void procurar();
  }, [colecaoId, procurar]);

  const colecao = colecoes.find((c) => c.id === colecaoId);

  return (
    <div>
      <h1 style={{ ...TS.titulo, fontSize: 22, marginBottom: 4 }}>Trocas</h1>
      <p
        style={{
          fontFamily: T.fontBody,
          fontSize: 13.5,
          color: T.textSecondary,
          marginTop: 0,
          marginBottom: 18,
          lineHeight: 1.6,
        }}
      >
        Colecionadores que têm o que te falta e precisam do que te sobra.
      </p>

      {!perfil?.perfil_publico && (
        <div
          style={{
            ...TS.card,
            borderColor: T.aviso,
            background: 'rgba(245,158,11,0.08)',
            marginBottom: 18,
            display: 'flex',
            gap: 11,
            alignItems: 'flex-start',
          }}
        >
          <Info size={18} color={T.aviso} style={{ flexShrink: 0, marginTop: 2 }} />
          <div
            style={{
              fontFamily: T.fontBody,
              fontSize: 13.5,
              color: T.textSecondary,
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: T.textPrimary }}>
              Seu perfil está privado.
            </strong>{' '}
            Você enxerga os outros, mas ninguém te encontra. Ative o perfil
            público em <a href="/perfil" style={{ color: T.neon }}>Perfil</a> para
            aparecer nas buscas.
          </div>
        </div>
      )}

      {carregando ? (
        <Caixa texto="Carregando..." />
      ) : colecoes.length === 0 ? (
        <Caixa texto="Você precisa ter uma coleção para procurar trocas." />
      ) : (
        <>
          <div style={{ marginBottom: 18 }}>
            <label style={TS.label} htmlFor="col-troca">
              Coleção
            </label>
            <select
              id="col-troca"
              value={colecaoId}
              onChange={(e) => setColecaoId(e.target.value)}
              style={{ ...TS.input, colorScheme: 'dark' }}
            >
              {colecoes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {erro && <Caixa texto={erro} erro />}

          {buscando ? (
            <Caixa texto="Procurando colecionadores..." />
          ) : matches.length === 0 ? (
            <Caixa
              texto={
                colecao && colecao.total_repetidas === 0
                  ? 'Marque suas repetidas para aparecerem trocas possíveis.'
                  : 'Ninguém compatível por enquanto. Volte depois que mais gente marcar suas coleções.'
              }
            />
          ) : (
            <>
              <div style={{ ...TS.label, marginBottom: 12 }}>
                {matches.length}{' '}
                {matches.length === 1
                  ? 'colecionador compatível'
                  : 'colecionadores compatíveis'}
              </div>
              {matches.map((m) => (
                <CartaoMatch key={m.perfil.id} match={m} />
              ))}
            </>
          )}
        </>
      )}

      <Rodape />
    </div>
  );
}

/* -------------------------------------------------------------- */

function CartaoMatch({ match }: { match: Match }) {
  const { perfil, eleTem, euTenho } = match;
  const mutuo = eleTem.length > 0 && euTenho.length > 0;

  const mensagem = msg.propostaTroca(
    perfil.apelido,
    euTenho.slice(0, 12).map(rotulo),
    eleTem.slice(0, 12).map(rotulo)
  );

  return (
    <div
      style={{
        ...TS.card,
        marginBottom: 12,
        borderColor: mutuo ? T.neonBorder : T.border,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: T.fontBody,
              fontSize: 14.5,
              fontWeight: 600,
              color: T.textPrimary,
            }}
          >
            {perfil.nome ?? `@${perfil.apelido}`}
          </div>
          <div
            style={{
              fontFamily: T.fontBody,
              fontSize: 12,
              color: T.textMuted,
              marginTop: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            @{perfil.apelido}
            {perfil.cidade && (
              <>
                <MapPin size={11} />
                {perfil.cidade}
                {perfil.estado && `/${perfil.estado}`}
              </>
            )}
          </div>
        </div>

        {mutuo && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 99,
              background: T.neonFaint,
              border: `1px solid ${T.neon}`,
              color: T.neon,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: T.fontBody,
            }}
          >
            <Repeat size={11} />
            Troca dos dois lados
          </span>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <Coluna
          Icone={ArrowLeft}
          cor={T.tenho}
          titulo={`Ele tem o que te falta (${eleTem.length})`}
          itens={eleTem}
        />
        <Coluna
          Icone={ArrowRight}
          cor={T.repetida}
          titulo={`Você tem o que falta a ele (${euTenho.length})`}
          itens={euTenho}
        />
      </div>

      <BotaoWhatsApp
        mensagem={mensagem}
        telefone={perfil.whatsapp ?? undefined}
        variant="full"
        rotulo={
          perfil.whatsapp ? 'Chamar no WhatsApp' : 'Enviar proposta'
        }
      />

      {!perfil.whatsapp && (
        <div
          style={{
            fontFamily: T.fontBody,
            fontSize: 11.5,
            color: T.textMuted,
            marginTop: 8,
            textAlign: 'center',
          }}
        >
          Este colecionador não divulgou o WhatsApp. Você escolhe por onde falar.
        </div>
      )}
    </div>
  );
}

function Coluna({
  Icone,
  cor,
  titulo,
  itens,
}: {
  Icone: typeof ArrowLeft;
  cor: string;
  titulo: string;
  itens: Item[];
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          marginBottom: 7,
          fontFamily: T.fontBody,
          fontSize: 11.5,
          fontWeight: 600,
          color: cor,
          letterSpacing: 0.2,
        }}
      >
        <Icone size={13} />
        {titulo}
      </div>
      {itens.length === 0 ? (
        <div
          style={{
            fontFamily: T.fontBody,
            fontSize: 12,
            color: T.textMuted,
          }}
        >
          Nada por aqui.
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {itens.slice(0, 14).map((i) => (
            <span
              key={i.id}
              title={i.nome}
              style={{
                padding: '3px 7px',
                borderRadius: 4,
                background: T.bgElevated,
                border: `1px solid ${T.border}`,
                fontFamily: T.fontBody,
                fontSize: 11,
                color: T.textSecondary,
              }}
            >
              {rotulo(i)}
            </span>
          ))}
          {itens.length > 14 && (
            <span
              style={{
                padding: '3px 7px',
                fontFamily: T.fontBody,
                fontSize: 11,
                color: T.textMuted,
              }}
            >
              +{itens.length - 14}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function rotulo(i: Item) {
  return i.numero || i.nome;
}

function Rodape() {
  return (
    <div
      style={{
        marginTop: 28,
        padding: '14px 16px',
        background: T.bgElevated,
        border: `1px solid ${T.border}`,
        borderRadius: T.radiusSm,
        fontFamily: T.fontBody,
        fontSize: 12,
        color: T.textMuted,
        lineHeight: 1.6,
      }}
    >
      O Coleção Fácil apenas mostra a compatibilidade. A troca é combinada
      diretamente entre vocês, por sua conta e risco. Em encontros presenciais,
      prefira locais públicos.
    </div>
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
      }}
    >
      {texto}
    </div>
  );
}
