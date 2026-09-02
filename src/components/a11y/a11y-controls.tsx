"use client";

import { Check, RotateCcw, Volume2 } from "lucide-react";
import type { ReactNode } from "react";

import {
  CONTRASTS,
  CONTRAST_LABELS,
  FONT_SCALES,
  FONT_SCALE_LABELS,
  useA11yPrefs,
  type Contrast,
  type FontScale,
} from "@/components/a11y/a11y-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Controles de acessibilidade.
 *
 * Usados em dois lugares — o painel da barra superior e a aba Preferências do
 * perfil. São o mesmo componente sobre o mesmo estado, não duas telas que
 * precisam ser mantidas em sincronia.
 */
export function A11yControls() {
  const { fontScale, contrast, sound, setPrefs, reset } = useA11yPrefs();

  return (
    <div className="flex flex-col gap-7">
      <OptionGroup<FontScale>
        legend="Tamanho da letra"
        options={FONT_SCALES}
        labels={FONT_SCALE_LABELS}
        value={fontScale}
        onChange={(next) => setPrefs({ fontScale: next })}
        renderPreview={(option) => (
          <span
            className={cn(
              option === "normal" && "text-base",
              option === "grande" && "text-lg",
              option === "maior" && "text-xl",
            )}
          >
            Aa
          </span>
        )}
      />

      <OptionGroup<Contrast>
        legend="Contraste"
        options={CONTRASTS}
        labels={CONTRAST_LABELS}
        value={contrast}
        onChange={(next) => setPrefs({ contrast: next })}
      />

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Som</p>
        <button
          type="button"
          onClick={() => setPrefs({ sound: !sound })}
          aria-pressed={sound}
          className={cn(
            "flex min-h-touch w-full items-center gap-3 rounded-control border-2 px-4 text-left transition-colors",
            sound
              ? "border-primary bg-primary-soft text-primary"
              : "border-line bg-surface text-ink",
          )}
        >
          <Volume2 className="size-5 shrink-0" aria-hidden />
          <span className="flex-1 text-sm font-semibold">Ler em voz alta</span>
          <span className="text-xs font-semibold uppercase tracking-wide">
            {sound ? "Ligado" : "Desligado"}
          </span>
        </button>
        <p className="mt-2 text-xs text-ink-muted">
          Lê os enunciados e anuncia se você acertou.
        </p>
      </div>

      <Button
        variant="ghost"
        size="compact"
        onClick={reset}
        className="self-start"
      >
        <RotateCcw className="size-4" aria-hidden />
        Voltar ao padrão
      </Button>
    </div>
  );
}

function OptionGroup<T extends string>({
  legend,
  options,
  labels,
  value,
  onChange,
  renderPreview,
}: {
  legend: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (next: T) => void;
  renderPreview?: (option: T) => ReactNode;
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-2 text-sm font-semibold text-ink">{legend}</legend>
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const isSelected = option === value;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={isSelected}
              className={cn(
                "flex min-h-touch items-center gap-3 rounded-control border-2 px-4 text-left transition-colors",
                isSelected
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-line bg-surface text-ink",
              )}
            >
              {renderPreview && (
                <span className="w-8 shrink-0 font-semibold" aria-hidden>
                  {renderPreview(option)}
                </span>
              )}
              <span className="flex-1 text-sm font-semibold">
                {labels[option]}
              </span>
              {/* Ícone além da cor: o selecionado não pode depender só do roxo. */}
              {isSelected && <Check className="size-5 shrink-0" aria-hidden />}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
