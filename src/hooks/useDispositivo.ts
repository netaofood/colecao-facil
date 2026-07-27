import { useState, useEffect } from 'react';
import { T } from '../theme';

/**
 * Item 2.1 do plano: breakpoint único em 1024px decidindo desktop x mobile.
 * Um só lugar define isso — nada de media query espalhada.
 */
export function useDispositivo() {
  const consultar = () =>
    typeof window !== 'undefined'
      ? window.matchMedia(`(min-width: ${T.breakpoint}px)`).matches
      : true;

  const [ehDesktop, setEhDesktop] = useState(consultar);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${T.breakpoint}px)`);
    const handler = (e: MediaQueryListEvent) => setEhDesktop(e.matches);
    mq.addEventListener('change', handler);
    setEhDesktop(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return { ehDesktop, ehMobile: !ehDesktop };
}
