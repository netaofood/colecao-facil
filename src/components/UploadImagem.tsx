import { useState, useRef } from 'react';
import { ImagePlus, Trash2, Loader } from 'lucide-react';
import { T } from '../theme';
import { enviarImagem, apagarImagem } from '../lib/api';

interface Props {
  /** URL atual, se já houver imagem */
  valor: string | null;
  aoMudar: (url: string | null) => void;
  /** Pasta dentro do bucket, ex: 'itens' ou 'perfis' */
  pasta: string;
  formato?: 'quadrado' | 'retrato' | 'circulo';
  tamanho?: number;
}

export function UploadImagem({
  valor,
  aoMudar,
  pasta,
  formato = 'quadrado',
  tamanho = 110,
}: Props) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const proporcao =
    formato === 'retrato' ? '3 / 4' : formato === 'circulo' ? '1 / 1' : '1 / 1';
  const raio = formato === 'circulo' ? '50%' : T.radiusSm;

  async function escolher(arquivo: File | undefined) {
    if (!arquivo) return;
    setErro(null);
    setEnviando(true);
    try {
      const url = await enviarImagem(arquivo, pasta);
      // remove a anterior para não acumular lixo no storage
      if (valor) await apagarImagem(valor).catch(() => undefined);
      aoMudar(url);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui enviar a imagem.');
    } finally {
      setEnviando(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={enviando}
          style={{
            width: tamanho,
            aspectRatio: proporcao,
            flexShrink: 0,
            background: valor ? 'transparent' : T.bgElevated,
            border: `1.5px dashed ${valor ? 'transparent' : T.border}`,
            borderRadius: raio,
            cursor: enviando ? 'wait' : 'pointer',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: 0,
          }}
        >
          {valor ? (
            <img
              src={valor}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <>
              <ImagePlus size={20} color={T.textMuted} />
              <span
                style={{
                  fontFamily: T.fontBody,
                  fontSize: 10.5,
                  color: T.textMuted,
                }}
              >
                Enviar foto
              </span>
            </>
          )}

          {enviando && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Loader size={19} color={T.neon} />
            </div>
          )}
        </button>

        {valor && (
          <button
            type="button"
            onClick={async () => {
              await apagarImagem(valor).catch(() => undefined);
              aoMudar(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              background: 'transparent',
              border: `1px solid ${T.erro}`,
              borderRadius: T.radiusSm,
              color: T.erro,
              fontSize: 12,
              fontFamily: T.fontBody,
              cursor: 'pointer',
            }}
          >
            <Trash2 size={13} />
            Remover
          </button>
        )}
      </div>

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => void escolher(e.target.files?.[0])}
        style={{ display: 'none' }}
      />

      {erro && (
        <div
          role="alert"
          style={{
            fontFamily: T.fontBody,
            fontSize: 12,
            color: T.erro,
            marginTop: 7,
          }}
        >
          {erro}
        </div>
      )}
    </div>
  );
}
