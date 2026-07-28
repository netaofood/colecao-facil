import { useId } from 'react';
import { T } from '../theme';

/* ---------------------------------------------------------------- */
/* ROSCA — composição de um todo                                     */
/* ---------------------------------------------------------------- */

export interface Fatia {
  rotulo: string;
  valor: number;
  cor: string;
}

export function Rosca({
  fatias,
  tamanho = 168,
  centroTitulo,
  centroTexto,
}: {
  fatias: Fatia[];
  tamanho?: number;
  centroTitulo?: string;
  centroTexto?: string;
}) {
  const total = fatias.reduce((s, f) => s + f.valor, 0);
  const raio = tamanho / 2;
  const espessura = tamanho * 0.17;
  const r = raio - espessura / 2;
  const circunferencia = 2 * Math.PI * r;

  let acumulado = 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ position: 'relative', width: tamanho, height: tamanho }}>
        <svg width={tamanho} height={tamanho} role="img">
          <circle
            cx={raio}
            cy={raio}
            r={r}
            fill="none"
            stroke={T.bgHover}
            strokeWidth={espessura}
          />
          {total > 0 &&
            fatias.map((f, i) => {
              const fracao = f.valor / total;
              const traco = fracao * circunferencia;
              const deslocamento = -acumulado * circunferencia;
              acumulado += fracao;

              if (f.valor === 0) return null;

              return (
                <circle
                  key={i}
                  cx={raio}
                  cy={raio}
                  r={r}
                  fill="none"
                  stroke={f.cor}
                  strokeWidth={espessura}
                  strokeDasharray={`${traco} ${circunferencia - traco}`}
                  strokeDashoffset={deslocamento}
                  transform={`rotate(-90 ${raio} ${raio})`}
                  style={{ transition: 'stroke-dasharray 0.4s ease' }}
                />
              );
            })}
        </svg>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontFamily: T.fontTitle,
              fontSize: tamanho * 0.17,
              fontWeight: 700,
              color: T.textPrimary,
              lineHeight: 1,
            }}
          >
            {centroTitulo}
          </span>
          {centroTexto && (
            <span
              style={{
                fontFamily: T.fontBody,
                fontSize: 10.5,
                color: T.textMuted,
                marginTop: 4,
              }}
            >
              {centroTexto}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fatias.map((f, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: T.fontBody,
              fontSize: 12.5,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: f.cor,
                flexShrink: 0,
              }}
            />
            <span style={{ color: T.textSecondary }}>{f.rotulo}</span>
            <strong style={{ color: T.textPrimary, marginLeft: 'auto' }}>
              {f.valor}
            </strong>
            <span style={{ color: T.textMuted, fontSize: 11, minWidth: 34 }}>
              {total > 0 ? Math.round((f.valor / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* BARRAS HORIZONTAIS — comparação com rótulos longos                */
/* ---------------------------------------------------------------- */

export interface Barra {
  rotulo: string;
  valor: number;
  total?: number;
  cor?: string;
  detalhe?: string;
}

export function BarrasHorizontais({
  barras,
  mostrarPorcentagem = false,
  limite,
}: {
  barras: Barra[];
  mostrarPorcentagem?: boolean;
  limite?: number;
}) {
  const lista = limite ? barras.slice(0, limite) : barras;
  const maximo = Math.max(1, ...lista.map((b) => b.total ?? b.valor));

  if (lista.length === 0) return <Vazio />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      {lista.map((b, i) => {
        const referencia = b.total ?? maximo;
        const largura = referencia > 0 ? (b.valor / referencia) * 100 : 0;
        const cor = b.cor ?? T.neon;

        return (
          <div key={i}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
                marginBottom: 5,
                fontFamily: T.fontBody,
                fontSize: 12.5,
              }}
            >
              <span
                style={{
                  color: T.textSecondary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {b.rotulo}
              </span>
              <span style={{ color: T.textMuted, whiteSpace: 'nowrap' }}>
                {b.detalhe ??
                  (mostrarPorcentagem
                    ? `${b.valor} de ${b.total} · ${Math.round(largura)}%`
                    : b.valor)}
              </span>
            </div>

            <div
              style={{
                height: 8,
                background: T.bgHover,
                borderRadius: 99,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, largura)}%`,
                  height: '100%',
                  background: cor,
                  borderRadius: 99,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* COLUNAS — séries pequenas, como itens por categoria               */
/* ---------------------------------------------------------------- */

export function Colunas({
  barras,
  altura = 150,
}: {
  barras: Barra[];
  altura?: number;
}) {
  if (barras.length === 0) return <Vazio />;

  const maximo = Math.max(1, ...barras.map((b) => b.valor));

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        height: altura,
        overflowX: 'auto',
        paddingBottom: 4,
      }}
    >
      {barras.map((b, i) => {
        const h = (b.valor / maximo) * (altura - 46);
        return (
          <div
            key={i}
            title={`${b.rotulo}: ${b.valor}`}
            style={{
              flex: '1 1 34px',
              minWidth: 34,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 5,
              height: '100%',
            }}
          >
            <span
              style={{
                fontFamily: T.fontTitle,
                fontSize: 11,
                fontWeight: 700,
                color: b.cor ?? T.neon,
              }}
            >
              {b.valor}
            </span>
            <div
              style={{
                width: '100%',
                height: Math.max(3, h),
                background: b.cor ?? T.neon,
                borderRadius: '5px 5px 2px 2px',
                transition: 'height 0.4s ease',
              }}
            />
            <span
              style={{
                fontFamily: T.fontBody,
                fontSize: 10,
                color: T.textMuted,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {b.rotulo}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* ÁREA — evolução no tempo                                          */
/* ---------------------------------------------------------------- */

export interface Ponto {
  rotulo: string;
  valor: number;
}

export function AreaEvolucao({
  pontos,
  altura = 170,
  cor = T.neon,
}: {
  pontos: Ponto[];
  altura?: number;
  cor?: string;
}) {
  const id = useId();

  if (pontos.length < 2) {
    return <Vazio texto="Ainda não há histórico suficiente." />;
  }

  const largura = 600;
  const margemBaixo = 24;
  const margemTopo = 12;
  const util = altura - margemBaixo - margemTopo;

  const maximo = Math.max(1, ...pontos.map((p) => p.valor));
  const passo = largura / (pontos.length - 1);

  const coordenadas = pontos.map((p, i) => ({
    x: i * passo,
    y: margemTopo + util - (p.valor / maximo) * util,
  }));

  const linha = coordenadas
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');

  const area = `${linha} L ${largura} ${altura - margemBaixo} L 0 ${altura - margemBaixo} Z`;

  // Mostra no máximo seis rótulos, para não embolar
  const passoRotulo = Math.max(1, Math.ceil(pontos.length / 6));

  return (
    <svg
      viewBox={`0 0 ${largura} ${altura}`}
      width="100%"
      height={altura}
      preserveAspectRatio="none"
      role="img"
    >
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={cor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Linhas de apoio */}
      {[0, 0.5, 1].map((f) => (
        <line
          key={f}
          x1="0"
          x2={largura}
          y1={margemTopo + util * f}
          y2={margemTopo + util * f}
          stroke={T.border}
          strokeWidth="1"
        />
      ))}

      <path d={area} fill={`url(#grad-${id})`} />
      <path
        d={linha}
        fill="none"
        stroke={cor}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      {coordenadas.map((c, i) =>
        i % passoRotulo === 0 || i === coordenadas.length - 1 ? (
          <circle key={i} cx={c.x} cy={c.y} r="3" fill={cor} />
        ) : null
      )}

      {pontos.map((p, i) =>
        i % passoRotulo === 0 || i === pontos.length - 1 ? (
          <text
            key={i}
            x={coordenadas[i].x}
            y={altura - 6}
            textAnchor={
              i === 0 ? 'start' : i === pontos.length - 1 ? 'end' : 'middle'
            }
            fill={T.textMuted}
            fontSize="11"
            fontFamily="Inter, sans-serif"
          >
            {p.rotulo}
          </text>
        ) : null
      )}
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/* MEDIDOR — um número contra uma meta                               */
/* ---------------------------------------------------------------- */

export function Medidor({
  valor,
  total,
  rotulo,
  cor = T.neon,
  tamanho = 130,
}: {
  valor: number;
  total: number;
  rotulo: string;
  cor?: string;
  tamanho?: number;
}) {
  const pct = total > 0 ? Math.min(100, (valor / total) * 100) : 0;
  const raio = tamanho / 2;
  const r = raio - 11;
  const meia = Math.PI * r;
  const preenchido = (pct / 100) * meia;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={tamanho} height={tamanho * 0.62} role="img">
        <path
          d={`M 11 ${raio} A ${r} ${r} 0 0 1 ${tamanho - 11} ${raio}`}
          fill="none"
          stroke={T.bgHover}
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d={`M 11 ${raio} A ${r} ${r} 0 0 1 ${tamanho - 11} ${raio}`}
          fill="none"
          stroke={cor}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${preenchido} ${meia}`}
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
        <text
          x={raio}
          y={raio - 6}
          textAnchor="middle"
          fill={T.textPrimary}
          fontSize="21"
          fontWeight="700"
          fontFamily="Orbitron, sans-serif"
        >
          {Math.round(pct)}%
        </text>
      </svg>
      <div
        style={{
          fontFamily: T.fontBody,
          fontSize: 11.5,
          color: T.textMuted,
          marginTop: -2,
        }}
      >
        {rotulo}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function Vazio({ texto = 'Sem dados para mostrar.' }: { texto?: string }) {
  return (
    <div
      style={{
        fontFamily: T.fontBody,
        fontSize: 12.5,
        color: T.textMuted,
        textAlign: 'center',
        padding: '22px 0',
      }}
    >
      {texto}
    </div>
  );
}
