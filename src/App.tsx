import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Inicio } from './pages/Inicio';
import { Perfil } from './pages/Perfil';
import { EmBreve } from './pages/EmBreve';
import { Convites } from './pages/admin/Convites';
import { T } from './theme';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Rotas />
      </BrowserRouter>
    </AuthProvider>
  );
}

/** Item 4.5 do plano: sem login -> /login; super admin -> /admin; colecionador -> /inicio */
function Rotas() {
  const { session, carregando } = useAuth();

  if (carregando) return <Carregando />;

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route
          path="/colecoes"
          element={<EmBreve titulo="Coleções" fase="Fase 3" itens="itens 6 e 7 do plano" />}
        />
        <Route
          path="/trocas"
          element={<EmBreve titulo="Trocas" fase="Fase 6" itens="item 9 do plano" />}
        />
        <Route
          path="/descobrir"
          element={<EmBreve titulo="Descobrir" fase="Fase 5" itens="item 10 do plano" />}
        />
        <Route path="/admin" element={<RotaAdmin><Convites /></RotaAdmin>} />
        <Route path="/login" element={<Navigate to="/inicio" replace />} />
        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>
    </Layout>
  );
}

function RotaAdmin({ children }: { children: ReactNode }) {
  const { ehSuperAdmin } = useAuth();
  if (!ehSuperAdmin) return <Navigate to="/inicio" replace />;
  return <>{children}</>;
}

function Carregando(): ReactNode {
  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: T.fontTitle,
      color: T.neon,
      fontSize: 14,
      letterSpacing: 1,
      textShadow: T.glowNeonSm,
    }}>
      CARREGANDO...
    </div>
  );
}
