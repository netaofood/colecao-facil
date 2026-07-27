import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { PrimeiroAcesso } from './pages/PrimeiroAcesso';
import { Inicio } from './pages/Inicio';
import { Perfil } from './pages/Perfil';
import { Admin } from './pages/admin/Admin';
import { Colecoes } from './pages/Colecoes';
import { ColecaoDetalhe } from './pages/ColecaoDetalhe';
import { MinhaColecao } from './pages/MinhaColecao';
import { Trocas } from './pages/Trocas';
import { Relatorios } from './pages/Relatorios';
import { T } from './theme';
import { useTema } from './hooks/useTema';

export default function App() {
  // Garante o tema aplicado em qualquer rota, mesmo sem o botão na tela
  useTema();

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
  const { session, perfil, carregando } = useAuth();

  if (carregando) return <Carregando />;

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Conta criada pelo admin: falta a pessoa informar nascimento e aceitar termos
  if (perfil && !perfil.primeiro_acesso_em) return <PrimeiroAcesso />;

  return (
    <Layout>
      <Routes>
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/colecoes" element={<Colecoes />} />
        <Route path="/colecoes/:id" element={<MinhaColecao />} />
        <Route path="/colecoes/:id/catalogo" element={<ColecaoDetalhe />} />
        <Route path="/trocas" element={<Trocas />} />
        <Route path="/admin" element={<RotaAdmin><Admin /></RotaAdmin>} />
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
