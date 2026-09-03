"use client";

import { Volume2 } from "lucide-react";

import { useSpeak } from "@/components/a11y/use-speak";
import { cn } from "@/lib/cn";

/**
 * Botão "Ouvir" — funciona mesmo com a leitura automática desligada.
 *
 * Some sozinho quando o navegador não suporta fala: nenhum botão morto,
 * nenhum clique sem efeito. `label=""` faz um botão só com ícone (uso ao lado
 * de um texto já visível) — o nome acessível continua garantido.
 */
export function SpeakButton({
  text,
  label = "Ouvir",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const { speak, supported } = useSpeak();
  if (!supported) return null;

  const iconOnly = label === "";

  return (
    <button
      type="button"
      onClick={() => speak(text, { force: true })}
      aria-label={iconOnly ? "Ouvir em voz alta" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-control border-2 border-line bg-surface text-sm font-semibold text-primary transition-colors hover:border-primary",
        iconOnly ? "justify-center px-3" : "px-4",
        className,
      )}
    >
      <Volume2 className="size-5 shrink-0" aria-hidden />
      {label}
    </button>
  );
}
