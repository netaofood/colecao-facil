import { useState, useEffect, useCallback } from 'react';
import { Users, Ticket, Power } from 'lucide-react';
import { T, TS } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Convites } from './Convites';

type Aba = 'usuarios' | 'convites';

export function Admin() {
  const [aba, setAba] = useState<Aba>('usuarios');

  return (
    <div>
      <h1 style={{ ...TS.titulo, fontSize: 22, marginBottom: 18 }}>
        Administração
      </h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <AbaBotao
          ativa={aba === 'usuarios'}
          Icone={Users}
          rotulo="Usuários"
          aoClicar={() => setAba('usuarios')}
        />
        <AbaBotao
          ativa={aba === 'convites'}
          Icone={Ticket}
          rotulo="Convites"
          aoClicar={() => setAba('convites')}
        />
      </div>

      {aba === 'usuarios' && <ListaUsuarios />}
      {aba === 'convites' && <Convites />}
    </div>
  );
}

/* -------------------------------------------------------------- */

interface UsuarioLinha {
  id: string;
  email: string;
  nome: string | null;
  apelido: string | null;
  cidade: string | null;
  papel: string;
  ativo: boolean;
  perfil_publico: boolean;
  created_at: string;
}

function ListaUsuarios() {
  const { perfil } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioLinha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nome, apelido, cidade, papel, ativo, perfil_publico, created_at')
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
    else await carregar();
  }

  if (carregando) return <Caixa texto="Carregando..." />;
  if (erro) return <Caixa texto={erro} erro />;

  return (
    <div>
      <div style={{ ...TS.label, marginBottom: 12 }}>
        {usuarios.length} {usuarios.length === 1 ? 'usuário' : 'usuários'}
      </div>

      {usuarios.map((u) => (
        <div key={u.id} style={{ ...TS.card, marginBottom: 8, opacity: u.ativo ? 1 : 0.5 }}>
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
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 10,
                      fontWeight: 700,
                      color: T.neon,
                      border: `1px solid ${T.neon}`,
                      borderRadius: 99,
                      padding: '2px 7px',
                      letterSpacing: 0.4,
                    }}
                  >
                    ADMIN
                  </span>
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
                entrou em {new Date(u.created_at).toLocaleDateString('pt-BR')}
                {u.perfil_publico ? ' · perfil público' : ' · perfil privado'}
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
    </div>
  );
}

/* -------------------------------------------------------------- */

/* -------------------------------------------------------------- */

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
      }}
    >
      {texto}
    </div>
  );
}
