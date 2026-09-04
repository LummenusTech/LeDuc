"use client";

import { useState } from "react";
import { WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormField, TextArea } from "@/components/ui/form-field";
import type { ItemAnswer } from "@/core/domain/grading";
import type { Item } from "@/core/domain/types";

export function ShortAnswerItem({
  item,
  disabled,
  isOnline,
  onSubmit,
}: {
  item: Extract<Item, { type: "short_answer" }>;
  disabled: boolean;
  isOnline: boolean;
  onSubmit: (answer: ItemAnswer) => void;
}) {
  const [text, setText] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <FormField
        id={`short-answer-${item.id}`}
        label="Sua resposta"
        hint="Escreva com suas palavras. Sua resposta fica salva neste aparelho."
      >
        <TextArea
          id={`short-answer-${item.id}`}
          disabled={disabled}
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          placeholder="Escreva aqui"
        />
      </FormField>

      {!isOnline && (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <WifiOff className="size-4 shrink-0" aria-hidden />
          Sem conexão: sua resposta fica salva e é conferida quando você
          voltar a ficar online.
        </p>
      )}

      <Button
        disabled={text.trim().length === 0}
        isLoading={disabled}
        className="self-end"
        onClick={() => onSubmit({ type: "short_answer", text })}
      >
        Responder
      </Button>
    </div>
  );
}
