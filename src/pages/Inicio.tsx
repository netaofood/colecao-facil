import { Library, Repeat, Search, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { T, TS } from '../theme';
import { useAuth } from '../lib/auth';

export function Inicio() {
  const { perfil } = useAuth();
  const primeiroNome = (perfil?.nome ?? '').split(' ')[0];

  return (
    <div>
      <h1 style={{ ...TS.titulo, fontSize: 22, marginBottom: 4 }}>
        {primeiroNome ? `Olá, ${primeiroNome}` : 'Olá'}
      </h1>
      <p style={{ fontFamily: T.fontBody, fontSize: 13.5, color: T.textSecondary, marginTop: 0, marginBottom: 24 }}>
        Por onde você quer começar?
      </p>

      {!perfil?.apelido && (
        <div style={{
          ...TS.card,
          borderColor: T.neonBorder,
          background: T.neonFaint,
          marginBottom: 20,
        }}>
          <div style={{ fontFamily: T.fontBody, fontSize: 14, color: T.textPrimary, lineHeight: 1.6 }}>
            <strong>Defina seu apelido</strong> para aparecer nas buscas de troca.{' '}
            <Link to="/perfil" style={{ color: T.neon, fontWeight: 600 }}>
              Ir para o perfil
            </Link>
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 14,
      }}>
        <Atalho para="/colecoes" Icone={Library} titulo="Minhas coleções" texto="Criar, adotar e acompanhar o progresso." />
        <Atalho para="/trocas" Icone={Repeat} titulo="Trocas" texto="Achar quem tem o que te falta." />
        <Atalho para="/descobrir" Icone={Search} titulo="Descobrir" texto="Coleções oficiais e outros colecionadores." />
        <Atalho para="/relatorios" Icone={BarChart3} titulo="Relatórios" texto="Seu progresso e exportação em CSV." />
      </div>
    </div>
  );
}

function Atalho({ para, Icone, titulo, texto }: {
  para: string; Icone: typeof Library; titulo: string; texto: string;
}) {
  return (
    <Link to={para} style={{ ...TS.card, textDecoration: 'none', display: 'block', transition: 'all 0.15s' }}>
      <Icone size={22} color={T.neon} />
      <div style={{ ...TS.titulo, fontSize: 15, marginTop: 12, marginBottom: 5 }}>{titulo}</div>
      <div style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textSecondary, lineHeight: 1.5 }}>{texto}</div>
    </Link>
  );
}
