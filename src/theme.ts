/**
 * Design tokens — Coleção Fácil
 * Padrão Netão Apps: preto + azul neon.
 * Uso: import { T, TS } from '@/theme'
 */

export const T = {
  // --- Cores base ---
  bg: '#000000',
  bgElevated: '#0A0E14',
  bgCard: '#0F1520',
  bgHover: '#151D2B',

  // --- Azul neon (cor primária) ---
  neon: '#00B4FF',
  neonDark: '#0066CC',
  neonBorder: 'rgba(0, 180, 255, 0.45)',
  neonFaint: 'rgba(0, 180, 255, 0.08)',
  neonSoft: 'rgba(0, 180, 255, 0.18)',

  // --- Brilhos ---
  glowNeon: '0 0 20px rgba(0, 180, 255, 0.35)',
  glowNeonSm: '0 0 10px rgba(0, 180, 255, 0.18)',

  // --- Texto ---
  textPrimary: '#F0F6FC',
  textSecondary: '#8B98A9',
  textMuted: '#5A6675',

  // --- Bordas ---
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',

  // --- Status (usados nos itens da coleção) ---
  tenho: '#22C55E',
  tenhoFaint: 'rgba(34, 197, 94, 0.12)',
  falta: '#5A6675',
  faltaFaint: 'rgba(90, 102, 117, 0.12)',
  repetida: '#F59E0B',
  repetidaFaint: 'rgba(245, 158, 11, 0.12)',

  // --- Feedback ---
  sucesso: '#22C55E',
  erro: '#EF4444',
  erroFaint: 'rgba(239, 68, 68, 0.10)',
  aviso: '#F59E0B',

  // --- WhatsApp (cor oficial da marca) ---
  whatsapp: '#25D366',
  whatsappFaint: 'rgba(37, 211, 102, 0.10)',
  whatsappBorder: 'rgba(37, 211, 102, 0.45)',

  // --- Forma ---
  radius: '10px',
  radiusSm: '6px',
  radiusLg: '16px',

  // --- Tipografia ---
  fontTitle: "'Orbitron', system-ui, sans-serif",
  fontBody: "'Inter', system-ui, -apple-system, sans-serif",

  // --- Layout responsivo (item 2 do plano) ---
  sidebarWidth: 248,
  sidebarWidthCollapsed: 68,
  bottomNavHeight: 64,
  breakpoint: 1024,
} as const;

/** Estilos compostos reutilizáveis */
export const TS = {
  card: {
    background: T.bgCard,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius,
    padding: 16,
  },

  botaoPrimario: {
    background: T.neon,
    color: '#00121F',
    border: 'none',
    borderRadius: T.radius,
    padding: '12px 20px',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: T.fontBody,
    cursor: 'pointer',
    letterSpacing: '0.3px',
    boxShadow: T.glowNeonSm,
    transition: 'all 0.2s',
  },

  botaoSecundario: {
    background: 'transparent',
    color: T.neon,
    border: `1.5px solid ${T.neonBorder}`,
    borderRadius: T.radius,
    padding: '12px 20px',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: T.fontBody,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  input: {
    width: '100%',
    background: T.bgElevated,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius,
    padding: '12px 14px',
    fontSize: 15,
    color: T.textPrimary,
    fontFamily: T.fontBody,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },

  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: T.textSecondary,
    marginBottom: 6,
    letterSpacing: '0.4px',
    textTransform: 'uppercase' as const,
    fontFamily: T.fontBody,
  },

  titulo: {
    fontFamily: T.fontTitle,
    fontWeight: 700,
    color: T.textPrimary,
    letterSpacing: '0.5px',
  },
} as const;

/** Rodapé padrão Netão Apps (item 1.4 do plano) */
export const RODAPE = {
  site: 'netao.app.br',
  slogan: 'Soluções que te MOVEM, na palma da sua MÃO',
} as const;
