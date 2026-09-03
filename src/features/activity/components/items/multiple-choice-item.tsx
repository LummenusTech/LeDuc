"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useSpeak } from "@/components/a11y/use-speak";
import { cn } from "@/lib/cn";
import type { ItemAnswer } from "@/core/domain/grading";
import type { Item } from "@/core/domain/types";

export function MultipleChoiceItem({
  item,
  disabled,
  onSubmit,
}: {
  item: Extract<Item, { type: "multiple_choice" }>;
  disabled: boolean;
  onSubmit: (answer: ItemAnswer) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const { speak } = useSpeak();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5" role="radiogroup">
        {item.content.options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected === option.id}
            disabled={disabled}
            onClick={() => {
              setSelected(option.id);
              speak(option.label);
            }}
            className={cn(
              "min-h-touch rounded-control border-2 px-5 text-left text-base font-medium transition-colors",
              selected === option.id
                ? "border-primary bg-primary-soft text-primary"
                : "border-line bg-surface text-ink hover:border-primary/50",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Button
        disabled={!selected}
        isLoading={disabled}
        className="self-end"
        onClick={() =>
          selected && onSubmit({ type: "multiple_choice", optionId: selected })
        }
      >
        Responder
      </Button>
    </div>
  );
}
