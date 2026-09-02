"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/**
 * Preferências de acessibilidade.
 *
 * Não é um ajuste escondido em configurações: o botão "Acessibilidade" vive na
 * barra superior, disponível de qualquer tela. O público em alfabetização
 * precisa poder aumentar a fonte no momento em que trava numa palavra.
 *
 * O `localStorage` é a fonte da verdade, lido por `useSyncExternalStore` — e
 * não copiado para dentro do estado do React na montagem. Além de ser o modelo
 * correto para um store externo, evita a classe de bug em que um efeito grava
 * os valores padrão por cima da escolha do usuário antes de ela ser lida.
 *
 * O estado é aplicado como atributo no <html>; os tokens de cor e a escala de
 * fonte reagem em `globals.css`. Nenhum componente lê estas preferências para
 * escolher cor por conta própria.
 */

export const FONT_SCALES = ["normal", "grande", "maior"] as const;
export const CONTRASTS = ["normal", "alto"] as const;

export type FontScale = (typeof FONT_SCALES)[number];
export type Contrast = (typeof CONTRASTS)[number];

export const FONT_SCALE_LABELS: Record<FontScale, string> = {
  normal: "Normal",
  grande: "Grande",
  maior: "Maior",
};

export const CONTRAST_LABELS: Record<Contrast, string> = {
  normal: "Padrão",
  alto: "Alto contraste",
};

export type A11yPrefs = {
  fontScale: FontScale;
  contrast: Contrast;
  /** Leitura em voz alta e reforço sonoro no feedback. */
  sound: boolean;
};

export const DEFAULT_A11Y_PREFS: A11yPrefs = {
  fontScale: "normal",
  contrast: "normal",
  sound: true,
};

export const A11Y_STORAGE_KEY = "leduc.a11y";

/* -------------------------------------------------------------------------- */
/* Store externo sobre o localStorage                                          */
/* -------------------------------------------------------------------------- */

function parsePrefs(raw: string | null): A11yPrefs {
  if (!raw) return DEFAULT_A11Y_PREFS;

  try {
    const parsed = JSON.parse(raw) as Partial<A11yPrefs>;
    return {
      fontScale: FONT_SCALES.includes(parsed.fontScale as FontScale)
        ? (parsed.fontScale as FontScale)
        : DEFAULT_A11Y_PREFS.fontScale,
      contrast: CONTRASTS.includes(parsed.contrast as Contrast)
        ? (parsed.contrast as Contrast)
        : DEFAULT_A11Y_PREFS.contrast,
      sound:
        typeof parsed.sound === "boolean"
          ? parsed.sound
          : DEFAULT_A11Y_PREFS.sound,
    };
  } catch {
    return DEFAULT_A11Y_PREFS;
  }
}

const listeners = new Set<() => void>();

// `useSyncExternalStore` exige um snapshot com referência estável: devolver um
// objeto novo a cada chamada faria o React re-renderizar sem parar.
let cachedRaw: string | null = null;
let cachedPrefs: A11yPrefs = DEFAULT_A11Y_PREFS;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(A11Y_STORAGE_KEY);
  } catch {
    // Janela privada ou armazenamento bloqueado: segue com o padrão.
    return null;
  }
}

function getSnapshot(): A11yPrefs {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedPrefs = parsePrefs(raw);
  }
  return cachedPrefs;
}

function getServerSnapshot(): A11yPrefs {
  return DEFAULT_A11Y_PREFS;
}

function handleStorageEvent(event: StorageEvent) {
  if (event.key === A11Y_STORAGE_KEY) {
    for (const listener of listeners) listener();
  }
}

function subscribe(onStoreChange: () => void): () => void {
  if (listeners.size === 0) {
    window.addEventListener("storage", handleStorageEvent);
  }
  listeners.add(onStoreChange);

  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

function writePrefs(next: A11yPrefs) {
  const serialized = JSON.stringify(next);

  try {
    window.localStorage.setItem(A11Y_STORAGE_KEY, serialized);
  } catch {
    // Não persiste entre sessões, mas continua valendo nesta.
  }

  cachedRaw = serialized;
  cachedPrefs = next;
  for (const listener of listeners) listener();
}

/* -------------------------------------------------------------------------- */
/* Provider                                                                    */
/* -------------------------------------------------------------------------- */

type A11yContextValue = A11yPrefs & {
  setPrefs: (patch: Partial<A11yPrefs>) => void;
  reset: () => void;
};

const A11yContext = createContext<A11yContextValue | null>(null);

export function A11yProvider({ children }: { children: ReactNode }) {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Sincroniza um sistema externo (o DOM) com o estado — o uso correto de
  // efeito. O script em `layout.tsx` já fez isso antes da primeira pintura;
  // aqui mantemos os atributos em dia a cada mudança.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.fontScale = prefs.fontScale;
    root.dataset.contrast = prefs.contrast;
  }, [prefs]);

  const setPrefs = useCallback((patch: Partial<A11yPrefs>) => {
    writePrefs({ ...getSnapshot(), ...patch });
  }, []);

  const reset = useCallback(() => writePrefs(DEFAULT_A11Y_PREFS), []);

  const value = useMemo<A11yContextValue>(
    () => ({ ...prefs, setPrefs, reset }),
    [prefs, setPrefs, reset],
  );

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}

export function useA11yPrefs(): A11yContextValue {
  const context = useContext(A11yContext);
  if (!context) {
    throw new Error("useA11yPrefs precisa estar dentro de <A11yProvider>.");
  }
  return context;
}

/**
 * Script executado antes da primeira pintura, para que quem escolheu fonte
 * maior ou alto contraste não veja a tela piscar no tamanho padrão.
 */
export const A11Y_BOOTSTRAP_SCRIPT = `
(function () {
  try {
    var raw = localStorage.getItem(${JSON.stringify(A11Y_STORAGE_KEY)});
    if (!raw) return;
    var p = JSON.parse(raw);
    var root = document.documentElement;
    if (p.fontScale) root.dataset.fontScale = p.fontScale;
    if (p.contrast) root.dataset.contrast = p.contrast;
  } catch (e) {}
})();
`;
