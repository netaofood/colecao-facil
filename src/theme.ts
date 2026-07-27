/**
 * Design tokens — Coleção Fácil
 * Padrão Netão Apps: preto + azul neon.
 * Uso: import { T, TS } from '@/theme'
 */

export const T = {
  // --- Cores base ---
  bg: 'var(--bg)',
  bgElevated: 'var(--bg-elevated)',
  bgCard: 'var(--bg-card)',
  bgHover: 'var(--bg-hover)',

  // --- Azul neon (cor primária) ---
  neon: 'var(--neon)',
  neonDark: 'var(--neon-dark)',
  neonBorder: 'var(--neon-border)',
  neonFaint: 'var(--neon-faint)',
  neonSoft: 'var(--neon-soft)',

  // --- Brilhos ---
  glowNeon: 'var(--glow)',
  glowNeonSm: 'var(--glow-sm)',

  // --- Texto ---
  textPrimary: 'var(--texto-primario)',
  textSecondary: 'var(--texto-secundario)',
  textMuted: 'var(--texto-apagado)',

  // --- Bordas ---
  border: 'var(--borda)',
  borderStrong: 'var(--borda-forte)',

  // --- Status (usados nos itens da coleção) ---
  tenho: 'var(--tenho)',
  tenhoFaint: 'var(--tenho-faint)',
  falta: 'var(--falta)',
  faltaFaint: 'var(--falta-faint)',
  repetida: 'var(--repetida)',
  repetidaFaint: 'var(--repetida-faint)',

  // --- Feedback ---
  sucesso: 'var(--sucesso)',
  erro: 'var(--erro)',
  erroFaint: 'var(--erro-faint)',
  aviso: 'var(--aviso)',

  // --- WhatsApp (cor oficial da marca) ---
  whatsapp: 'var(--whatsapp)',
  whatsappFaint: 'var(--whatsapp-faint)',
  whatsappBorder: 'var(--whatsapp-border)',

  // --- Texto sobre fundo colorido ---
  textoBotao: 'var(--texto-botao)',
  repetidaTexto: 'var(--repetida-texto)',
  avisoFaint: 'var(--aviso-faint)',

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
    color: 'var(--texto-botao)',
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
