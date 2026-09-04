import type { HTMLAttributes, ReactNode } from "react";

import { TINT_CLASSES, type TrackTint } from "@/config/palette";
import { cn } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/* Card                                                                        */
/* -------------------------------------------------------------------------- */

export function Card({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "interactive" | "featured" | "metric";
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-line/80 bg-surface shadow-card",
        variant === "interactive" &&
          "transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-tint-violeta-cover hover:shadow-raised",
        variant === "featured" && "border-primary/15 shadow-raised",
        variant === "metric" && "shadow-none",
        className,
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* HighlightHeading                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Título de duas cores — a assinatura visual que aparece em três telas:
 * "Tudo bem, user?", "Olá, user?", "Bem vindo, Usuario ao leduc".
 *
 * Existe como componente para não virar markup repetido a cada página.
 */
export function HighlightHeading({
  before,
  highlight,
  after,
  description,
  as: Tag = "h1",
  className,
}: {
  before?: string;
  highlight: string;
  after?: string;
  description?: string;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div className={className}>
      <Tag className="text-pretty text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {before}
        <span className="text-primary">{highlight}</span>
        {after}
      </Tag>
      {description && (
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ProgressBar                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Barra de progresso.
 *
 * O valor também é anunciado por `aria-valuenow`, e quem usa o componente
 * mostra o percentual em texto ao lado — a cor da barra sozinha não informa
 * nada a quem não enxerga bem ou não lê com fluência.
 */
export function ProgressBar({
  value,
  tint,
  label,
  className,
}: {
  value: number;
  tint?: TrackTint;
  label: string;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "h-2 w-full overflow-hidden rounded-pill bg-surface-muted",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-pill transition-[width] duration-500",
          tint ? TINT_CLASSES[tint].bar : "bg-primary",
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Chip                                                                        */
/* -------------------------------------------------------------------------- */

export function Chip({
  tint,
  children,
  className,
}: {
  tint?: TrackTint;
  children: ReactNode;
  className?: string;
}) {
  const tintClasses = tint ? TINT_CLASSES[tint] : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold",
        tintClasses
          ? `${tintClasses.chip} ${tintClasses.ink}`
          : "bg-primary-soft text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                    */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-control bg-surface-muted", className)}
      aria-hidden
    />
  );
}
