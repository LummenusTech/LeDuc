"use client";

import { useCallback, useEffect } from "react";

import { useA11yPrefs } from "@/components/a11y/a11y-provider";

/**
 * Ponte para a leitura em voz alta (Web Speech API).
 *
 * Existe porque "Ler em voz alta" nas preferências não bastava sozinho — uma
 * preferência que nada lê é só um interruptor decorativo. Este hook é o que
 * qualquer tela usa para de fato falar um texto, e é o único lugar que sabe
 * como o navegador faz isso.
 *
 * `speak(text)` respeita a preferência do usuário (não fala se "sound" estiver
 * desligado). `speak(text, { force: true })` fala mesmo assim — para o botão
 * manual "Ouvir", que precisa funcionar mesmo com a leitura automática
 * desligada.
 */
export function useSpeak() {
  const { sound } = useA11yPrefs();
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
  }, [supported]);

  useEffect(() => stop, [stop]);

  const speak = useCallback(
    (text: string, options?: { force?: boolean }) => {
      if (!supported) return;
      if (!sound && !options?.force) return;
      if (!text.trim()) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    },
    [sound, supported],
  );

  return { speak, stop, supported, autoReadEnabled: sound };
}
