import { useState, useRef } from 'react';
import { ImagePlus, Trash2, Loader, Camera, Images, X } from 'lucide-react';
import { T } from '../theme';
import { useDispositivo } from '../hooks/useDispositivo';
import { enviarImagem, apagarImagem } from '../lib/api';

interface Props {
  /** URL atual, se já houver imagem */
  valor: string | null;
  aoMudar: (url: string | null) => void;
  /** Pasta dentro do bucket, ex: 'itens' ou 'perfis' */
  pasta: string;
  formato?: 'quadrado' | 'retrato' | 'circulo';
  tamanho?: number;
  /** Texto do botão quando não há imagem */
  rotulo?: string;
  /** Largura fixa, útil para ocupar a faixa inteira */
  largura?: number | string;
}

export function UploadImagem({
  valor,
  aoMudar,
  pasta,
  formato = 'quadrado',
  tamanho = 110,
  rotulo = 'Enviar foto',
  largura,
}: Props) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const galeria = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const { ehMobile } = useDispositivo();
  const [escolhendo, setEscolhendo] = useState(false);

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
      // Limpa os dois, senão escolher o mesmo arquivo de novo não dispara
      if (galeria.current) galeria.current.value = '';
      if (camera.current) camera.current.value = '';
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <button
          type="button"
          onClick={() => {
            if (ehMobile) setEscolhendo(true);
            else galeria.current?.click();
          }}
          disabled={enviando}
          style={{
            width: largura ?? tamanho,
            aspectRatio: largura ? undefined : proporcao,
            minHeight: largura ? tamanho : undefined,
            flexShrink: 0,
            background: valor && !largura ? 'transparent' : T.bgElevated,
            border: largura
              ? `1.5px solid ${T.neonBorder}`
              : `1.5px dashed ${valor ? 'transparent' : T.border}`,
            borderRadius: raio,
            cursor: enviando ? 'wait' : 'pointer',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: largura ? 'row' : 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: largura ? 8 : 6,
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
              <ImagePlus size={largura ? 17 : 20} color={largura ? T.neon : T.textMuted} />
              <span
                style={{
                  fontFamily: T.fontBody,
                  fontSize: largura ? 12.5 : 10.5,
                  fontWeight: largura ? 600 : 400,
                  color: largura ? T.textPrimary : T.textMuted,
                }}
              >
                {rotulo}
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
        ref={galeria}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => void escolher(e.target.files?.[0])}
        style={{ display: 'none' }}
      />

      {/* capture abre a câmera direto. Fica num campo separado para a
          galeria continuar disponível: com capture no mesmo campo, o
          celular deixa de oferecer as fotos já salvas. */}
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => void escolher(e.target.files?.[0])}
        style={{ display: 'none' }}
      />

      {escolhendo && (
        <EscolhaDeOrigem
          aoFechar={() => setEscolhendo(false)}
          aoTirarFoto={() => {
            setEscolhendo(false);
            camera.current?.click();
          }}
          aoAbrirGaleria={() => {
            setEscolhendo(false);
            galeria.current?.click();
          }}
        />
      )}

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


/** Escolha entre câmera e galeria. Só aparece no celular. */
function EscolhaDeOrigem({
  aoFechar,
  aoTirarFoto,
  aoAbrirGaleria,
}: {
  aoFechar: () => void;
  aoTirarFoto: () => void;
  aoAbrirGaleria: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Origem da foto"
      onClick={aoFechar}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 130,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: T.bgCard,
          borderTop: `1px solid ${T.border}`,
          borderRadius: `${T.radiusLg} ${T.radiusLg} 0 0`,
          padding: 16,
          paddingBottom: `calc(16px + env(safe-area-inset-bottom))`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <span
            style={{
              fontFamily: T.fontBody,
              fontSize: 13,
              fontWeight: 600,
              color: T.textSecondary,
            }}
          >
            De onde vem a foto?
          </span>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            style={{
              background: 'transparent',
              border: 'none',
              color: T.textMuted,
              cursor: 'pointer',
              display: 'flex',
              padding: 3,
            }}
          >
            <X size={19} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Opcao Icone={Camera} rotulo="Tirar foto" aoClicar={aoTirarFoto} destaque />
          <Opcao Icone={Images} rotulo="Galeria" aoClicar={aoAbrirGaleria} />
        </div>
      </div>
    </div>
  );
}

function Opcao({
  Icone,
  rotulo,
  aoClicar,
  destaque = false,
}: {
  Icone: typeof Camera;
  rotulo: string;
  aoClicar: () => void;
  destaque?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 9,
        // alvo grande, para acertar de primeira no celular
        padding: '20px 14px',
        background: destaque ? T.neonFaint : T.bgElevated,
        border: `1.5px solid ${destaque ? T.neon : T.border}`,
        borderRadius: T.radius,
        color: destaque ? T.neon : T.textSecondary,
        fontFamily: T.fontBody,
        fontSize: 13.5,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      <Icone size={24} />
      {rotulo}
    </button>
  );
}
