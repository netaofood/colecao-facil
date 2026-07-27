import { T } from '../theme';

/**
 * Marca do Coleção Fácil.
 *
 * A versão completa existe em dois arquivos: a palavra "Coleção" é branca
 * no tema escuro e azul-escura no claro, senão ela some no fundo branco.
 * A troca é feita por CSS (ver index.css), sem depender de estado.
 */
export function Logo({
  variante = 'completa',
  altura = 90,
}: {
  variante?: 'completa' | 'simbolo';
  altura?: number;
}) {
  if (variante === 'simbolo') {
    return (
      <img
        src="/marca/simbolo.png"
        alt="Coleção Fácil"
        style={{ height: altura, width: 'auto', display: 'block' }}
      />
    );
  }

  return (
    <span
      style={{ display: 'inline-block', lineHeight: 0 }}
      aria-label="Coleção Fácil"
      role="img"
    >
      <img
        className="marca-escuro"
        src="/marca/logo.png"
        alt=""
        style={{ height: altura, width: 'auto', display: 'block' }}
      />
      <img
        className="marca-claro"
        src="/marca/logo-claro.png"
        alt=""
        style={{ height: altura, width: 'auto', display: 'none' }}
      />
    </span>
  );
}

/** Símbolo + nome escrito, para barras estreitas. */
export function LogoLinha({ tamanho = 26 }: { tamanho?: number }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
      <img
        src="/marca/simbolo.png"
        alt=""
        style={{ height: tamanho, width: tamanho, flexShrink: 0 }}
      />
      <span
        style={{
          fontFamily: T.fontTitle,
          fontWeight: 700,
          fontSize: tamanho * 0.52,
          color: T.neon,
          letterSpacing: 0.5,
          textShadow: T.glowNeonSm,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        COLEÇÃO FÁCIL
      </span>
    </span>
  );
}
