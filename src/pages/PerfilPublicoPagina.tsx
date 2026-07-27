import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Copy, UserX } from 'lucide-react';
import { T, TS, RODAPE } from '../theme';
import { buscarPerfilPublico, listarRepetidasPublicas } from '../lib/api';
import type { PerfilPublico, RepetidaPublica } from '../lib/api';
import { BotaoWhatsApp } from '../components/BotaoWhatsApp';
import { BotaoCopiarLink } from '../components/BotaoCopiarLink';
import { msg } from '../lib/mensagens';

export function PerfilPublicoPagina() {
  const { apelido } = useParams<{ apelido: string }>();
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [repetidas, setRepetidas] = useState<RepetidaPublica[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!apelido) return;
    let ativo = true;

    (async () => {
      try {
        const p = await buscarPerfilPublico(apelido);
        if (!ativo) return;
        setPerfil(p);
        if (p) {
          const r = await listarRepetidasPublicas(p.id);
          if (ativo) setRepetidas(r);
        }
      } catch {
        if (ativo) setPerfil(null);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [apelido]);

  const url = window.location.href;

  // Agrupa as repetidas por coleção
  const porColecao = new Map<string, RepetidaPublica[]>();
  for (const r of repetidas) {
    if (!porColecao.has(r.colecaoNome)) porColecao.set(r.colecaoNome, []);
    porColecao.get(r.colecaoNome)!.push(r);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '28px 16px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: 640 }}>
        <Link
          to="/"
          style={{
            ...TS.titulo,
            fontSize: 15,
            color: T.neon,
            textShadow: T.glowNeonSm,
            textDecoration: 'none',
            display: 'block',
            textAlign: 'center',
            marginBottom: 26,
          }}
        >
          COLEÇÃO FÁCIL
        </Link>

        {carregando ? (
          <Caixa texto="Carregando..." />
        ) : !perfil ? (
          <div style={{ ...TS.card, textAlign: 'center', padding: 30 }}>
            <UserX size={30} color={T.textMuted} />
            <div
              style={{
                ...TS.titulo,
                fontSize: 15,
                marginTop: 14,
                marginBottom: 6,
              }}
            >
              Perfil não encontrado
            </div>
            <div
              style={{
                fontFamily: T.fontBody,
                fontSize: 13,
                color: T.textSecondary,
                lineHeight: 1.6,
              }}
            >
              Este colecionador não existe ou mantém o perfil privado.
            </div>
          </div>
        ) : (
          <>
            {/* Cabeçalho */}
            <div style={{ ...TS.card, marginBottom: 16, textAlign: 'center' }}>
              {perfil.foto_url ? (
                <img
                  src={perfil.foto_url}
                  alt=""
                  style={{
                    width: 74,
                    height: 74,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `2px solid ${T.neonBorder}`,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 74,
                    height: 74,
                    borderRadius: '50%',
                    background: T.neonFaint,
                    border: `2px solid ${T.neonBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    fontFamily: T.fontTitle,
                    fontSize: 26,
                    fontWeight: 700,
                    color: T.neon,
                  }}
                >
                  {(perfil.nome ?? perfil.apelido).charAt(0).toUpperCase()}
                </div>
              )}

              <h1 style={{ ...TS.titulo, fontSize: 19, margin: '14px 0 3px' }}>
                {perfil.nome ?? `@${perfil.apelido}`}
              </h1>
              <div
                style={{
                  fontFamily: T.fontBody,
                  fontSize: 13,
                  color: T.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  flexWrap: 'wrap',
                }}
              >
                @{perfil.apelido}
                {perfil.cidade && (
                  <>
                    <MapPin size={12} />
                    {perfil.cidade}
                    {perfil.estado && `/${perfil.estado}`}
                  </>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 18,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 150px' }}>
                  <BotaoWhatsApp
                    mensagem={msg.perfil(perfil.apelido, url)}
                    telefone={perfil.whatsapp ?? undefined}
                    variant="full"
                    rotulo={perfil.whatsapp ? 'Chamar' : 'Compartilhar'}
                  />
                </div>
                <div style={{ flex: '1 1 150px' }}>
                  <BotaoCopiarLink url={url} variant="full" />
                </div>
              </div>
            </div>

            {/* Repetidas disponíveis */}
            <div style={{ ...TS.label, marginBottom: 10 }}>
              <Copy size={13} style={{ verticalAlign: -2, marginRight: 5 }} />
              Disponíveis para troca · {repetidas.length}
            </div>

            {repetidas.length === 0 ? (
              <Caixa texto="Nenhuma repetida disponível no momento." />
            ) : (
              [...porColecao.entries()].map(([nomeColecao, lista]) => (
                <div key={nomeColecao} style={{ ...TS.card, marginBottom: 10 }}>
                  <div style={{ ...TS.titulo, fontSize: 13.5, marginBottom: 10 }}>
                    {nomeColecao}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {lista.map((r) => (
                      <span
                        key={r.item.id}
                        title={r.item.nome}
                        style={{
                          padding: '4px 9px',
                          borderRadius: 5,
                          background: T.repetidaFaint,
                          border: `1px solid ${T.repetida}`,
                          fontFamily: T.fontBody,
                          fontSize: 11.5,
                          color: T.repetida,
                          fontWeight: 600,
                        }}
                      >
                        {r.item.numero || r.item.nome}
                        {r.quantidade > 1 && ` ×${r.quantidade}`}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}

            <div
              style={{
                marginTop: 22,
                padding: '13px 15px',
                background: T.bgElevated,
                border: `1px solid ${T.border}`,
                borderRadius: T.radiusSm,
                fontFamily: T.fontBody,
                fontSize: 11.5,
                color: T.textMuted,
                lineHeight: 1.6,
              }}
            >
              O Coleção Fácil apenas apresenta os colecionadores. A troca é
              combinada diretamente entre vocês, por conta e risco de cada um.
            </div>
          </>
        )}

        <p
          style={{
            textAlign: 'center',
            marginTop: 26,
            fontFamily: T.fontBody,
            fontSize: 11.5,
            color: T.textMuted,
          }}
        >
          <strong style={{ color: T.textSecondary }}>{RODAPE.site}</strong>
          {' · '}
          {RODAPE.slogan}
        </p>
      </div>
    </div>
  );
}

function Caixa({ texto }: { texto: string }) {
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
