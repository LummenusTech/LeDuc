"use client";

import { Check } from "lucide-react";
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
        {item.content.options.map((option, index) => (
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
              "flex min-h-16 items-center gap-4 rounded-control border-2 px-4 text-left text-base font-medium shadow-sm transition-[border-color,background-color,box-shadow,transform] active:translate-y-px",
              selected === option.id
                ? "border-primary bg-primary-soft text-primary"
                : "border-line bg-surface text-ink hover:border-tint-violeta-cover hover:shadow-card",
            )}
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full border-2 text-sm font-bold",
                selected === option.id
                  ? "border-primary bg-primary text-ink-inverse"
                  : "border-line bg-surface-muted text-ink-muted",
              )}
              aria-hidden
            >
              {selected === option.id ? <Check className="size-5" /> : String.fromCharCode(65 + index)}
            </span>
            <span className="flex-1">{option.label}</span>
          </button>
        ))}
      </div>

      <Button
        disabled={!selected}
        isLoading={disabled}
        className="w-full sm:self-end sm:w-auto"
        onClick={() =>
          selected && onSubmit({ type: "multiple_choice", optionId: selected })
        }
      >
        Responder
      </Button>
    </div>
  );
}
