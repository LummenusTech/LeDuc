import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Card, Chip, ProgressBar } from "@/components/ui/primitives";
import { TINT_CLASSES } from "@/config/palette";
import { ROUTES } from "@/config/routes";
import type { TrackSummary } from "@/core/data/models";
import { cn } from "@/lib/cn";

/**
 * "Trilha em andamento" — o destaque da tela inicial.
 *
 * É o caminho de volta ao estudo em um toque, e por isso ocupa o topo: quem
 * abre o aplicativo quase sempre quer continuar de onde parou.
 */
export function ContinueTrackBanner({ track }: { track: TrackSummary }) {
  const tint = TINT_CLASSES[track.tint];

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-start gap-4">
        <div
          className={cn("hidden size-24 shrink-0 rounded-card sm:block", tint.cover)}
          aria-hidden
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Chip tint={track.tint}>Trilha em andamento</Chip>
              <h2 className="mt-2 truncate text-xl font-bold text-ink sm:text-2xl">
                {track.title}
              </h2>
              <p className="mt-0.5 text-sm text-ink-muted">
                Lição {track.currentLesson} de {track.totalLessons}
              </p>
            </div>

            <Link
              href={ROUTES.student.track(track.id)}
              aria-label={`Abrir a trilha ${track.title}`}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-ink-inverse transition-colors hover:bg-primary-hover"
            >
              <ChevronRight className="size-6" aria-hidden />
            </Link>
          </div>

          <div className="mt-4">
            <ProgressBar
              value={track.progressPct}
              tint={track.tint}
              label={`Progresso da trilha ${track.title}`}
            />
            <p className={cn("mt-1.5 text-sm font-semibold", tint.ink)}>
              {track.progressPct}% concluída
            </p>
          </div>
        </div>
      </div>

      <Link
        href={ROUTES.student.track(track.id)}
        className="mt-5 flex min-h-touch w-full items-center justify-center rounded-control bg-primary px-6 font-semibold text-ink-inverse transition-colors hover:bg-primary-hover"
      >
        Continuar trilha
      </Link>
    </Card>
  );
}
