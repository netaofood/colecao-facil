import { useState, useEffect } from 'react';
import { T, TS } from '../theme';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { BotaoWhatsApp } from '../components/BotaoWhatsApp';
import { BotaoCopiarLink } from '../components/BotaoCopiarLink';
import { msg } from '../lib/mensagens';

export function Perfil() {
  const { perfil, recarregarPerfil } = useAuth();

  const [nome, setNome] = useState('');
  const [apelido, setApelido] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappPublico, setWhatsappPublico] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!perfil) return;
    setNome(perfil.nome ?? '');
    setApelido(perfil.apelido ?? '');
    setCidade(perfil.cidade ?? '');
    setEstado(perfil.estado ?? '');
    setWhatsapp(perfil.whatsapp ?? '');
    setWhatsappPublico(perfil.whatsapp_publico);
  }, [perfil]);

  if (!perfil) return null;

  const urlPublica = apelido
    ? `${window.location.origin}/u/${apelido}`
    : null;

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setOk(false);
    setSalvando(true);

    const apelidoLimpo = apelido.trim().toLowerCase();
    if (apelidoLimpo && !/^[a-z0-9_.-]{3,30}$/.test(apelidoLimpo)) {
      setErro(
        'O apelido deve ter de 3 a 30 caracteres, usando apenas letras minúsculas, números, ponto, hífen e underline.'
      );
      setSalvando(false);
      return;
    }

    const { error } = await supabase
      .from('usuarios')
      .update({
        nome: nome.trim() || null,
        apelido: apelidoLimpo || null,
        cidade: cidade.trim() || null,
        estado: estado.trim().toUpperCase() || null,
        whatsapp: whatsapp.replace(/\D/g, '') || null,
        whatsapp_publico: whatsappPublico,
      })
      .eq('id', perfil!.id);

    if (error) {
      setErro(
        error.code === '23505'
          ? 'Esse apelido já está em uso. Escolha outro.'
          : error.message
      );
    } else {
      setOk(true);
      await recarregarPerfil();
      setTimeout(() => setOk(false), 2500);
    }
    setSalvando(false);
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <h1 style={{ ...TS.titulo, fontSize: 22, marginBottom: 4 }}>Meu perfil</h1>
      <p
        style={{
          fontFamily: T.fontBody,
          fontSize: 13.5,
          color: T.textSecondary,
          marginTop: 0,
          marginBottom: 24,
          lineHeight: 1.6,
        }}
      >
        Seu perfil só aparece na busca de trocas depois que você definir um
        apelido.
      </p>

      <form onSubmit={salvar} style={TS.card}>
        <Campo rotulo="Nome" id="nome">
          <input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            style={TS.input}
          />
        </Campo>

        <Campo
          rotulo="Apelido"
          id="apelido"
          dica="Vira o endereço do seu perfil público."
        >
          <input
            id="apelido"
            value={apelido}
            onChange={(e) => setApelido(e.target.value)}
            placeholder="ex: netao"
            style={TS.input}
          />
        </Campo>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Campo rotulo="Cidade" id="cidade">
              <input
                id="cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                style={TS.input}
              />
            </Campo>
          </div>
          <div style={{ width: 90 }}>
            <Campo rotulo="UF" id="estado">
              <input
                id="estado"
                value={estado}
                maxLength={2}
                onChange={(e) => setEstado(e.target.value)}
                style={{ ...TS.input, textTransform: 'uppercase' }}
              />
            </Campo>
          </div>
        </div>

        <Campo rotulo="WhatsApp" id="whatsapp" dica="Com DDD. Só números.">
          <input
            id="whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="ex: 11987654321"
            inputMode="numeric"
            style={TS.input}
          />
        </Campo>

        {/* Item 5.4 — privacidade do WhatsApp, oculto por padrão */}
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '12px 14px',
            background: T.bgElevated,
            border: `1px solid ${T.border}`,
            borderRadius: T.radiusSm,
            marginBottom: 18,
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={whatsappPublico}
            onChange={(e) => setWhatsappPublico(e.target.checked)}
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
            Mostrar meu WhatsApp no perfil público.
            <br />
            <span style={{ color: T.textMuted, fontSize: 12 }}>
              Desmarcado, ele só é revelado depois que você aceitar uma troca.
            </span>
          </span>
        </label>

        {erro && (
          <div
            role="alert"
            style={{
              background: T.erroFaint,
              border: `1px solid ${T.erro}`,
              borderRadius: T.radiusSm,
              padding: '10px 12px',
              marginBottom: 14,
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
          disabled={salvando}
          style={{
            ...TS.botaoPrimario,
            width: '100%',
            opacity: salvando ? 0.6 : 1,
          }}
        >
          {salvando ? 'Salvando...' : ok ? 'Salvo!' : 'Salvar alterações'}
        </button>
      </form>

      {/* Compartilhar — botões padrão da casa */}
      {urlPublica && (
        <div style={{ ...TS.card, marginTop: 18 }}>
          <div style={{ ...TS.label, marginBottom: 10 }}>
            Compartilhar meu perfil
          </div>
          <code
            style={{
              display: 'block',
              fontSize: 12.5,
              color: T.neon,
              background: T.bgElevated,
              border: `1px solid ${T.border}`,
              borderRadius: T.radiusSm,
              padding: '9px 12px',
              marginBottom: 12,
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {urlPublica}
          </code>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 160px' }}>
              <BotaoWhatsApp
                mensagem={msg.perfil(apelido, urlPublica)}
                variant="full"
                rotulo="Compartilhar"
              />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <BotaoCopiarLink url={urlPublica} variant="full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({
  rotulo,
  id,
  dica,
  children,
}: {
  rotulo: string;
  id: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={TS.label} htmlFor={id}>
        {rotulo}
      </label>
      {children}
      {dica && (
        <div
          style={{
            fontSize: 11.5,
            color: T.textMuted,
            marginTop: 5,
            fontFamily: T.fontBody,
          }}
        >
          {dica}
        </div>
      )}
    </div>
  );
}
