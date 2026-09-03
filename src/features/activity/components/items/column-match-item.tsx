"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useSpeak } from "@/components/a11y/use-speak";
import { cn } from "@/lib/cn";
import type { ItemAnswer } from "@/core/domain/grading";
import type { Item } from "@/core/domain/types";

/**
 * Associação de colunas: toca a esquerda, toca a direita, forma um par.
 *
 * Sem arrastar — arrastar é ruim no toque e pior ainda em acessibilidade
 * motora, e não é isso que a regra pede (RN-G2 é tudo-ou-nada, não posição).
 * Tocar um par já formado desfaz — dá pra corrigir sem recomeçar a atividade.
 */
export function ColumnMatchItem({
  item,
  disabled,
  onSubmit,
}: {
  item: Extract<Item, { type: "column_match" }>;
  disabled: boolean;
  onSubmit: (answer: ItemAnswer) => void;
}) {
  const [pairs, setPairs] = useState<{ leftId: string; rightId: string }[]>(
    [],
  );
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const { speak } = useSpeak();

  const pairedLeftIds = new Set(pairs.map((pair) => pair.leftId));
  const pairedRightIds = new Set(pairs.map((pair) => pair.rightId));

  function tapLeft(leftId: string, label: string) {
    if (disabled) return;
    speak(label);
    if (pairedLeftIds.has(leftId)) {
      setPairs((current) => current.filter((pair) => pair.leftId !== leftId));
      return;
    }
    setSelectedLeft(leftId);
  }

  function tapRight(rightId: string, label: string) {
    if (disabled) return;
    speak(label);
    if (pairedRightIds.has(rightId)) {
      setPairs((current) =>
        current.filter((pair) => pair.rightId !== rightId),
      );
      return;
    }
    if (!selectedLeft) return;
    setPairs((current) => [
      ...current,
      { leftId: selectedLeft, rightId },
    ]);
    setSelectedLeft(null);
  }

  const complete = pairs.length === item.content.left.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2.5">
          {item.content.left.map((choice) => (
            <button
              key={choice.id}
              type="button"
              disabled={disabled}
              aria-pressed={pairedLeftIds.has(choice.id)}
              onClick={() => tapLeft(choice.id, choice.label)}
              className={cn(
                "min-h-touch rounded-control border-2 px-4 text-left font-medium transition-colors",
                pairedLeftIds.has(choice.id)
                  ? "border-tint-verde-solid bg-tint-verde-soft text-tint-verde-ink"
                  : selectedLeft === choice.id
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-line bg-surface text-ink hover:border-primary/50",
              )}
            >
              {choice.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          {item.content.right.map((choice) => (
            <button
              key={choice.id}
              type="button"
              disabled={disabled}
              aria-pressed={pairedRightIds.has(choice.id)}
              onClick={() => tapRight(choice.id, choice.label)}
              className={cn(
                "min-h-touch rounded-control border-2 px-4 text-left font-medium transition-colors",
                pairedRightIds.has(choice.id)
                  ? "border-tint-verde-solid bg-tint-verde-soft text-tint-verde-ink"
                  : "border-line bg-surface text-ink hover:border-primary/50",
              )}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-ink-muted">
        {selectedLeft
          ? "Agora toque no par certo à direita."
          : "Toque num item da esquerda, depois no par dele à direita."}
      </p>

      <Button
        disabled={!complete}
        isLoading={disabled}
        className="self-end"
        onClick={() => onSubmit({ type: "column_match", pairs })}
      >
        Responder
      </Button>
    </div>
  );
}
