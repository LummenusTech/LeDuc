"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { Card, ProgressBar } from "@/components/ui/primitives";
import { TINT_CLASSES, type TrackTint } from "@/config/palette";
import type { ModulePerformance } from "@/core/data/models";
import { cn } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/* StatTile                                                                    */
/* -------------------------------------------------------------------------- */

const TILE_TINTS = {
  violeta: "bg-tint-violeta-soft text-tint-violeta-ink",
  verde: "bg-tint-verde-soft text-tint-verde-ink",
  pessego: "bg-tint-pessego-soft text-tint-pessego-ink",
  azul: "bg-tint-azul-soft text-tint-azul-ink",
} satisfies Record<TrackTint, string>;

export function StatTile({
  icon: Icon,
  value,
  label,
  tint,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  tint: TrackTint;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-card px-4 py-3",
        TILE_TINTS[tint],
      )}
    >
      <Icon className="size-6 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="text-xl font-bold leading-tight tabular-nums">{value}</p>
        {/* Sem truncar: "taxa de retenção" cortado vira "taxa de ret…", que não
            comunica nada. Prefere-se quebrar em duas linhas. */}
        <p className="text-xs font-medium leading-tight opacity-90">{label}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* DonutProgress                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Anel de progresso.
 *
 * O número no centro é o dado; o anel é reforço visual. Quem não enxerga o
 * gráfico ainda lê "25% de concluído".
 */
export function DonutProgress({
  value,
  caption,
}: {
  value: number;
  caption: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center">
      <div className="relative size-32">
        <svg viewBox="0 0 128 128" className="size-full -rotate-90" aria-hidden>
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            strokeWidth="14"
            className="stroke-surface-muted"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            strokeWidth="14"
            strokeLinecap="round"
            className="stroke-primary transition-[stroke-dashoffset] duration-700"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped / 100)}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <p className="text-2xl font-bold tabular-nums text-ink">{clamped}%</p>
        </div>
      </div>
      <p className="mt-1 text-xs text-ink-muted">{caption}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MetricRow                                                                   */
/* -------------------------------------------------------------------------- */

export function MetricRow({
  icon: Icon,
  label,
  value,
  href,
  tint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
  tint: TrackTint;
}) {
  const content = (
    <>
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-control",
          TILE_TINTS[tint],
        )}
        aria-hidden
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-ink-muted">{label}</span>
        <span className="block font-semibold text-ink">{value}</span>
      </span>
      {href && (
        <ChevronRight className="size-5 shrink-0 text-ink-muted" aria-hidden />
      )}
    </>
  );

  const className =
    "flex min-h-touch w-full items-center gap-3 rounded-control px-2 text-left transition-colors";

  return href ? (
    <Link href={href} className={cn(className, "hover:bg-surface-muted")}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

/* -------------------------------------------------------------------------- */
/* AreaPerformanceBar                                                          */
/* -------------------------------------------------------------------------- */

export function AreaPerformanceBar({ item }: { item: ModulePerformance }) {
  const tint = TINT_CLASSES[item.tint];

  return (
    <li className="flex items-center gap-3">
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-control text-xs font-bold",
          tint.chip,
          tint.ink,
        )}
        aria-hidden
      >
        {item.moduleName.slice(0, 1)}
      </span>

      <span className="w-28 shrink-0 truncate text-sm text-ink">
        {item.moduleName}
      </span>

      <ProgressBar
        value={item.score}
        tint={item.tint}
        label={`Desempenho em ${item.moduleName}`}
        className="flex-1"
      />

      <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-ink">
        {item.score}%
      </span>
    </li>
  );
}

export { Card };
