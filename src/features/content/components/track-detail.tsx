"use client";

import { Check, ChevronRight, Lock, Play, Trophy } from "lucide-react";
import Link from "next/link";

import { ErrorState } from "@/components/feedback/states";
import {
  Card,
  Chip,
  HighlightHeading,
  ProgressBar,
  Skeleton,
} from "@/components/ui/primitives";
import { TINT_CLASSES } from "@/config/palette";
import { ROUTES } from "@/config/routes";
import { useLessons, useTrack } from "@/features/content/hooks";
import { useTrackProgress } from "@/features/progress/hooks";
import {
  computeTrackProgress,
  isTrackComplete,
  resolveLessonStatuses,
} from "@/core/domain/unlock-rules";
import type { LessonStatus } from "@/core/domain/types";
import { cn } from "@/lib/cn";

/**
 * Mapa da trilha: as lições em sequência, com o estado de cada uma.
 *
 * O estado vem inteiro de `resolveLessonStatuses` — nenhum `if` de negócio
 * aqui. O componente só traduz o estado do domínio em cadeado, toque
 * bloqueado ou link.
 */
export function TrackDetail({ trackId }: { trackId: string }) {
  const track = useTrack(trackId);
  const lessons = useLessons(trackId);
  const progress = useTrackProgress(trackId);

  if (track.isPending || lessons.isPending || progress.isPending) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <Skeleton className="h-24 rounded-card" />
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-card" />
        ))}
      </div>
    );
  }

  if (track.isError || lessons.isError || progress.isError) {
    return (
      <ErrorState
        onRetry={() => {
          track.refetch();
          lessons.refetch();
          progress.refetch();
        }}
      />
    );
  }

  if (!track.data) {
    return (
      <ErrorState
        title="Trilha não encontrada"
        description="Ela pode ter sido despublicada. Volte e escolha outra."
      />
    );
  }

  const ordered = [...lessons.data].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );
  const statuses = resolveLessonStatuses(ordered, progress.data);
  const trackDone = isTrackComplete(ordered, progress.data);
  const progressPct = computeTrackProgress(ordered, progress.data);
  const tint = TINT_CLASSES[track.data.tint];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <HighlightHeading
          before=""
          highlight={track.data.title}
          description={track.data.description}
        />
        <Chip tint={track.data.tint}>Nível {track.data.level}</Chip>
      </div>

      <Card variant="featured" className="p-5 sm:p-6">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-medium text-ink-muted">Progresso</span>
          <span className={cn("font-semibold tabular-nums", tint.ink)}>
            {progressPct}%
          </span>
        </div>
        <ProgressBar
          value={progressPct}
          tint={track.data.tint}
          label={`Progresso da trilha ${track.data.title}`}
        />
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Conclua uma lição para liberar a próxima. Você pode revisar as concluídas quando quiser.
        </p>
      </Card>

      {trackDone && (
        <Card
          className={cn(
            "flex items-center gap-3 border-2 px-4 py-3",
            tint.border,
          )}
        >
          <Trophy className={cn("size-6 shrink-0", tint.ink)} aria-hidden />
          <div>
            <p className="font-semibold text-ink">Trilha concluída!</p>
            <p className="text-sm text-ink-muted">
              Você terminou todas as lições. Pode revisitar qualquer uma
              quando quiser.
            </p>
          </div>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-bold text-ink">Mapa da trilha</h2>
      <ol className="relative flex flex-col gap-3 before:absolute before:bottom-8 before:left-9 before:top-8 before:w-0.5 before:bg-line">
        {ordered.map((lesson, index) => (
          <li key={lesson.id} className="relative">
            <LessonRow
              title={lesson.title}
              estimatedMinutes={lesson.estimatedMinutes}
              orderIndex={index}
              status={statuses.get(lesson.id) ?? "locked"}
              masteryScore={progress.data[lesson.id]?.masteryScore ?? null}
              href={ROUTES.student.lesson(lesson.id)}
              tint={track.data!.tint}
            />
          </li>
        ))}
      </ol>
      </div>
    </div>
  );
}

function LessonRow({
  title,
  estimatedMinutes,
  orderIndex,
  status,
  masteryScore,
  href,
  tint: tintToken,
}: {
  title: string;
  estimatedMinutes: number;
  orderIndex: number;
  status: LessonStatus;
  masteryScore: number | null;
  href: string;
  tint: keyof typeof TINT_CLASSES;
}) {
  const tint = TINT_CLASSES[tintToken];
  const locked = status === "locked";

  const icon =
    status === "completed" ? (
      <Check className="size-5" aria-hidden />
    ) : status === "locked" ? (
      <Lock className="size-4" aria-hidden />
    ) : (
      <Play className="size-4" aria-hidden />
    );

  const content = (
    <Card
      className={cn(
        "relative flex min-h-20 items-center gap-4 px-5 py-4 transition-[border-color,box-shadow,transform]",
        locked
          ? "opacity-60"
          : "hover:-translate-y-0.5 hover:border-tint-violeta-cover hover:shadow-raised focus-visible:shadow-raised",
      )}
    >
      <span
        className={cn(
            "z-10 grid size-10 shrink-0 place-items-center rounded-full ring-4 ring-canvas",
          status === "completed"
            ? cn(tint.chip, tint.ink)
            : status === "locked"
              ? "bg-surface-muted text-ink-muted"
              : cn(tint.bar, "text-ink-inverse"),
        )}
        aria-hidden
      >
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-bold text-ink">
          Lição {orderIndex + 1}: {title}
        </p>
        <p className="text-xs text-ink-muted">
          {locked
            ? "Bloqueada até concluir a anterior"
            : `${estimatedMinutes} min${
                masteryScore !== null ? ` · ${masteryScore}% de domínio` : ""
              }`}
        </p>
      </div>

      {!locked && (
        <ChevronRight
          className="size-5 shrink-0 text-ink-muted"
          aria-hidden
        />
      )}
    </Card>
  );

  if (locked) {
    return (
      <div
        aria-disabled
        aria-label={`Lição ${orderIndex + 1}: ${title}, bloqueada até concluir a anterior`}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      aria-label={`Abrir lição ${orderIndex + 1}: ${title}${
        status === "completed" ? ", concluída" : ""
      }`}
    >
      {content}
    </Link>
  );
}
