"use client";

import { Check, ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import Link from "next/link";

import { ErrorState } from "@/components/feedback/states";
import {
  Card,
  HighlightHeading,
  Skeleton,
} from "@/components/ui/primitives";
import { ROUTES } from "@/config/routes";
import { useActivities, useLesson } from "@/features/content/hooks";
import { useTrackProgress } from "@/features/progress/hooks";
import { useCompletedActivityIds } from "@/features/activity/hooks";
import { cn } from "@/lib/cn";

/**
 * Visão da lição: as atividades dela, na ordem, antes de entrar no player.
 *
 * Lição já concluída manda pra revisão (`?revisao=1`) — RN-P4, RN-R5: revisita
 * não altera domínio nem repete a conquista, e paga XP diferente (RN-X4).
 */
export function LessonOverview({ lessonId }: { lessonId: string }) {
  const lesson = useLesson(lessonId);
  const trackId = lesson.data?.trackId ?? "";
  const activities = useActivities(lessonId);
  const completedIds = useCompletedActivityIds(lessonId);
  const trackProgress = useTrackProgress(trackId);

  if (lesson.isPending || activities.isPending || trackProgress.isPending) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
      </div>
    );
  }

  if (lesson.isError || activities.isError || trackProgress.isError) {
    return (
      <ErrorState
        onRetry={() => {
          lesson.refetch();
          activities.refetch();
          trackProgress.refetch();
        }}
      />
    );
  }

  if (!lesson.data) {
    return (
      <ErrorState
        title="Lição não encontrada"
        description="Ela pode ter sido despublicada. Volte para a trilha."
      />
    );
  }

  const progress = trackProgress.data[lessonId];
  const isDone = progress?.status === "completed";
  const completedSet = new Set(completedIds.data ?? []);
  const ordered = [...activities.data].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.student.track(trackId)}
          aria-label="Voltar para a trilha"
          className="grid size-11 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface-muted"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <HighlightHeading
          as="h1"
          highlight={lesson.data.title}
          description={`${lesson.data.estimatedMinutes} min`}
        />
      </div>

      {isDone && (
        <Card className="flex items-center gap-3 bg-primary-soft px-4 py-3">
          <Repeat className="size-5 shrink-0 text-primary" aria-hidden />
          <p className="text-sm font-medium text-primary">
            Você já concluiu esta lição — domínio de {progress.masteryScore}%.
            Pode revisar quando quiser.
          </p>
        </Card>
      )}

      <ol className="flex flex-col gap-3">
        {ordered.map((activity, index) => {
          const done = completedSet.has(activity.id);
          const href = `${ROUTES.student.activity(lessonId, activity.id)}${
            isDone ? "?revisao=1" : ""
          }`;

          return (
            <li key={activity.id}>
              <Link href={href}>
                <Card className="flex items-center gap-4 px-4 py-3.5 transition-shadow hover:shadow-raised focus-visible:shadow-raised">
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-full font-semibold",
                      done
                        ? "bg-primary-soft text-primary"
                        : "bg-surface-muted text-ink-muted",
                    )}
                    aria-hidden
                  >
                    {done ? <Check className="size-5" /> : index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">
                      {activity.title}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {done ? "Concluída" : "Não iniciada"}
                    </p>
                  </div>
                  <ChevronRight
                    className="size-5 shrink-0 text-ink-muted"
                    aria-hidden
                  />
                </Card>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
