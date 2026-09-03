"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ItemAnswer } from "@/core/domain/grading";
import type { Item } from "@/core/domain/types";

export function FillBlanksItem({
  item,
  disabled,
  onSubmit,
}: {
  item: Extract<Item, { type: "fill_blanks" }>;
  disabled: boolean;
  onSubmit: (answer: ItemAnswer) => void;
}) {
  const blankCount = item.content.acceptedAnswers.length;
  const [values, setValues] = useState<string[]>(() =>
    Array.from({ length: blankCount }, () => ""),
  );

  const allFilled = values.every((value) => value.trim().length > 0);

  function setBlank(index: number, value: string) {
    setValues((current) =>
      current.map((existing, i) => (i === index ? value : existing)),
    );
  }

  const segments = item.content.segments;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-pretty text-xl leading-relaxed text-ink">
        {segments.map((segment, index) => {
          if (segment !== null) {
            return <span key={index}>{segment}</span>;
          }
          // Posição da lacuna entre as demais lacunas, não entre os
          // segmentos — não dá pra mutar um contador durante o render.
          const thisBlank = segments
            .slice(0, index)
            .filter((value) => value === null).length;
          return (
            <input
              key={index}
              type="text"
              disabled={disabled}
              value={values[thisBlank]}
              onChange={(event) => setBlank(thisBlank, event.target.value)}
              aria-label={`Lacuna ${thisBlank + 1}`}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="mx-1 inline-block w-24 rounded-control border-2 border-line bg-surface px-2 py-1 text-center text-xl font-semibold text-ink focus-visible:border-primary focus-visible:outline-none"
            />
          );
        })}
      </p>

      <Button
        disabled={!allFilled}
        isLoading={disabled}
        className="self-end"
        onClick={() => onSubmit({ type: "fill_blanks", values })}
      >
        Responder
      </Button>
    </div>
  );
}
