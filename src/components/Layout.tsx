import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Library,
  Repeat,
  Search,
  User,
  BarChart3,
  Shield,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { T, TS, RODAPE } from '../theme';
import { useDispositivo } from '../hooks/useDispositivo';
import { useAuth } from '../lib/auth';

interface Destino {
  para: string;
  rotulo: string;
  Icone: typeof LayoutGrid;
  /** Aparece na bottom nav do celular (item 2.4: 4 a 5 destinos) */
  noMobile: boolean;
  soAdmin?: boolean;
}

const DESTINOS: Destino[] = [
  { para: '/inicio', rotulo: 'Início', Icone: LayoutGrid, noMobile: true },
  { para: '/colecoes', rotulo: 'Coleções', Icone: Library, noMobile: true },
  { para: '/trocas', rotulo: 'Trocas', Icone: Repeat, noMobile: true },
  { para: '/descobrir', rotulo: 'Descobrir', Icone: Search, noMobile: true },
  { para: '/relatorios', rotulo: 'Relatórios', Icone: BarChart3, noMobile: false },
  { para: '/perfil', rotulo: 'Perfil', Icone: User, noMobile: true },
  { para: '/admin', rotulo: 'Admin', Icone: Shield, noMobile: false, soAdmin: true },
];

export function Layout({ children }: { children: ReactNode }) {
  const { ehDesktop } = useDispositivo();
  const { ehSuperAdmin } = useAuth();

  const destinos = DESTINOS.filter((d) => !d.soAdmin || ehSuperAdmin);

  // Item 2.6: um componente decide qual navegação renderizar.
  return ehDesktop ? (
    <LayoutDesktop destinos={destinos}>{children}</LayoutDesktop>
  ) : (
    <LayoutMobile destinos={destinos.filter((d) => d.noMobile)}>
      {children}
    </LayoutMobile>
  );
}

/* ---------------------------------------------------------------- */
/* DESKTOP — menu lateral fixo, colapsável (itens 2.2 e 2.3)         */
/* ---------------------------------------------------------------- */

function LayoutDesktop({
  destinos,
  children,
}: {
  destinos: Destino[];
  children: ReactNode;
}) {
  const [colapsado, setColapsado] = useState(false);
  const { perfil, sair } = useAuth();
  const navigate = useNavigate();
  const largura = colapsado ? T.sidebarWidthCollapsed : T.sidebarWidth;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg }}>
      <aside
        style={{
          width: largura,
          flexShrink: 0,
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          background: T.bgElevated,
          borderRight: `1px solid ${T.border}`,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s ease',
          zIndex: 20,
        }}
      >
        {/* Marca */}
        <div
          style={{
            padding: colapsado ? '20px 0' : '20px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: colapsado ? 'center' : 'space-between',
            gap: 8,
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          {!colapsado && (
            <span
              style={{
                ...TS.titulo,
                fontSize: 16,
                color: T.neon,
                textShadow: T.glowNeonSm,
                whiteSpace: 'nowrap',
              }}
            >
              COLEÇÃO FÁCIL
            </span>
          )}
          <button
            type="button"
            onClick={() => setColapsado((c) => !c)}
            aria-label={colapsado ? 'Expandir menu' : 'Recolher menu'}
            style={{
              background: 'transparent',
              border: 'none',
              color: T.textMuted,
              cursor: 'pointer',
              display: 'flex',
              padding: 4,
            }}
          >
            {colapsado ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Navegação */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {destinos.map(({ para, rotulo, Icone }) => (
            <NavLink
              key={para}
              to={para}
              title={colapsado ? rotulo : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: colapsado ? 'center' : 'flex-start',
                gap: 12,
                padding: colapsado ? '11px 0' : '11px 12px',
                marginBottom: 3,
                borderRadius: T.radiusSm,
                textDecoration: 'none',
                fontFamily: T.fontBody,
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? T.neon : T.textSecondary,
                background: isActive ? T.neonFaint : 'transparent',
                borderLeft: isActive
                  ? `2px solid ${T.neon}`
                  : '2px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              <Icone size={19} style={{ flexShrink: 0 }} />
              {!colapsado && rotulo}
            </NavLink>
          ))}
        </nav>

        {/* Usuário e saída */}
        <div style={{ padding: 10, borderTop: `1px solid ${T.border}` }}>
          {!colapsado && perfil && (
            <div style={{ padding: '4px 12px 10px' }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.textPrimary,
                  fontFamily: T.fontBody,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {perfil.nome ?? perfil.email}
              </div>
              {perfil.apelido && (
                <div
                  style={{
                    fontSize: 12,
                    color: T.textMuted,
                    fontFamily: T.fontBody,
                  }}
                >
                  @{perfil.apelido}
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={async () => {
              await sair();
              navigate('/login');
            }}
            title={colapsado ? 'Sair' : undefined}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: colapsado ? 'center' : 'flex-start',
              gap: 12,
              padding: colapsado ? '11px 0' : '11px 12px',
              background: 'transparent',
              border: 'none',
              borderRadius: T.radiusSm,
              color: T.textMuted,
              fontSize: 14,
              fontFamily: T.fontBody,
              cursor: 'pointer',
            }}
          >
            <LogOut size={19} style={{ flexShrink: 0 }} />
            {!colapsado && 'Sair'}
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main
        style={{
          flex: 1,
          marginLeft: largura,
          minWidth: 0,
          transition: 'margin-left 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            flex: 1,
            width: '100%',
            maxWidth: 1400,
            margin: '0 auto',
            padding: '28px 32px',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </div>
        <Rodape />
      </main>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* MOBILE — bottom navigation (itens 2.4 e 2.5)                      */
/* ---------------------------------------------------------------- */

function LayoutMobile({
  destinos,
  children,
}: {
  destinos: Destino[];
  children: ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 15,
          padding: '14px 16px',
          background: T.bgElevated,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <span
          style={{
            ...TS.titulo,
            fontSize: 15,
            color: T.neon,
            textShadow: T.glowNeonSm,
          }}
        >
          COLEÇÃO FÁCIL
        </span>
      </header>

      <main
        style={{
          flex: 1,
          padding: '16px 14px',
          // espaço para a bottom nav não cobrir o conteúdo
          paddingBottom: T.bottomNavHeight + 24,
          boxSizing: 'border-box',
        }}
      >
        {children}
      </main>

      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: T.bottomNavHeight,
          display: 'flex',
          background: T.bgElevated,
          borderTop: `1px solid ${T.border}`,
          zIndex: 30,
          // respeita a área segura do iPhone
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {destinos.map(({ para, rotulo, Icone }) => (
          <NavLink
            key={para}
            to={para}
            style={({ isActive }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              textDecoration: 'none',
              fontFamily: T.fontBody,
              fontSize: 10.5,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? T.neon : T.textMuted,
              transition: 'color 0.15s',
            })}
          >
            {({ isActive }) => (
              <>
                <Icone size={21} strokeWidth={isActive ? 2.4 : 2} />
                <span>{rotulo}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function Rodape() {
  return (
    <footer
      style={{
        padding: '18px 32px',
        borderTop: `1px solid ${T.border}`,
        textAlign: 'center',
        fontFamily: T.fontBody,
        fontSize: 12,
        color: T.textMuted,
      }}
    >
      <strong style={{ color: T.textSecondary }}>{RODAPE.site}</strong>
      {' · '}
      {RODAPE.slogan}
    </footer>
  );
}
