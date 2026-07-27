import { useState, useEffect, useCallback } from 'react';

export type Tema = 'escuro' | 'claro';

const CHAVE = 'colecao-facil-tema';

function temaInicial(): Tema {
  if (typeof window === 'undefined') return 'escuro';

  const salvo = window.localStorage.getItem(CHAVE);
  if (salvo === 'claro' || salvo === 'escuro') return salvo;

  // Sem escolha salva: segue a preferência do sistema
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'claro'
    : 'escuro';
}

function aplicar(tema: Tema) {
  const raiz = document.documentElement;
  if (tema === 'claro') raiz.setAttribute('data-tema', 'claro');
  else raiz.removeAttribute('data-tema');

  // Mantém a barra do navegador no celular coerente com o tema
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', tema === 'claro' ? '#FFFFFF' : '#000000');
  }
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(temaInicial);

  useEffect(() => {
    aplicar(tema);
  }, [tema]);

  const alternar = useCallback(() => {
    setTema((atual) => {
      const novo: Tema = atual === 'escuro' ? 'claro' : 'escuro';
      window.localStorage.setItem(CHAVE, novo);
      return novo;
    });
  }, []);

  return { tema, alternar, ehClaro: tema === 'claro' };
}
