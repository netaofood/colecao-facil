import { useId } from 'react';
import { TS } from '../theme';

interface Props {
  valor: string;
  aoMudar: (v: string) => void;
  /** Valores já usados, oferecidos como sugestão */
  sugestoes: string[];
  id?: string;
  placeholder?: string;
  compacto?: boolean;
}

/**
 * Campo de categoria com digitação livre e sugestão do que já existe.
 * Usa <datalist>, então o teclado do celular continua normal.
 */
export function InputCategoria({
  valor,
  aoMudar,
  sugestoes,
  id,
  placeholder,
  compacto = false,
}: Props) {
  const gerado = useId();
  const listaId = `cat-${gerado}`;

  return (
    <>
      <input
        id={id}
        list={listaId}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        style={
          compacto
            ? { ...TS.input, padding: '8px 10px', fontSize: 13.5 }
            : TS.input
        }
      />
      <datalist id={listaId}>
        {sugestoes.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </>
  );
}
