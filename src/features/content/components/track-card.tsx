import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Chip, ProgressBar } from "@/components/ui/primitives";
import { TINT_CLASSES } from "@/config/palette";
import { ROUTES } from "@/config/routes";
import type { TrackSummary } from "@/core/data/models";
import { cn } from "@/lib/cn";

const CARD_CLASSES =
  "flex h-full flex-col overflow-hidden rounded-card bg-surface shadow-card";

function CardBody({
  track,
  variant,
}: {
  track: TrackSummary;
  variant: "compact" | "action";
}) {
  const tint = TINT_CLASSES[track.tint];

  return (
    <>
      <div className={cn("h-24 shrink-0", tint.cover)} aria-hidden />

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold leading-tight text-ink">{track.title}</h3>
        <p className="mt-0.5 text-xs text-ink-muted">
          Lição {track.currentLesson} de {track.totalLessons}
        </p>

        <div className="mt-3">
          <ProgressBar
            value={track.progressPct}
            tint={track.tint}
            label={`Progresso da trilha ${track.title}`}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          {variant === "action" ? (
            <Link
              href={ROUTES.student.track(track.id)}
              className={cn(
                "inline-flex min-h-11 items-center gap-1 rounded-control px-3 text-sm font-semibold text-ink-inverse transition-opacity hover:opacity-90",
                tint.bar,
              )}
            >
              Continuar
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          ) : (
            // O nome do módulo em texto: a cor identifica de relance, o rótulo
            // garante a informação para quem não a distingue.
            <Chip tint={track.tint}>{track.moduleName}</Chip>
          )}

          <span className={cn("text-sm font-semibold tabular-nums", tint.ink)}>
            {track.progressPct}%
          </span>
        </div>
      </div>
    </>
  );
}

/**
 * Card de trilha.
 *
 * `compact` — o card inteiro é o link (tela inicial).
 * `action`  — o card é estático e traz o botão "Continuar" dentro (tela de
 *             trilhas), como nas telas recebidas.
 */
export function TrackCard({
  track,
  variant = "compact",
}: {
  track: TrackSummary;
  variant?: "compact" | "action";
}) {
  if (variant === "action") {
    return (
      <article className={CARD_CLASSES}>
        <CardBody track={track} variant="action" />
      </article>
    );
  }

  return (
    <Link
      href={ROUTES.student.track(track.id)}
      aria-label={`Abrir trilha ${track.title}, lição ${track.currentLesson} de ${track.totalLessons}, ${track.progressPct}% concluída`}
      className={cn(
        CARD_CLASSES,
        "transition-shadow hover:shadow-raised focus-visible:shadow-raised",
      )}
    >
      <CardBody track={track} variant="compact" />
    </Link>
  );
}
