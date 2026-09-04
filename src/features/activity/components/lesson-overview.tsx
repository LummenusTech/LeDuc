"use client";

import {
  AlignLeft,
  ArrowLeftRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  PenLine,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { ErrorState } from "@/components/feedback/states";
import {
  Card,
  HighlightHeading,
  Skeleton,
} from "@/components/ui/primitives";
import { ROUTES } from "@/config/routes";
import type { Activity, ItemType } from "@/core/domain/types";
import { useActivities, useItems, useLesson } from "@/features/content/hooks";
import { useTrackProgress } from "@/features/progress/hooks";
import { useCompletedActivityIds } from "@/features/activity/hooks";
import { cn } from "@/lib/cn";

/** Um ícone por tipo de item — mostra na hora o que a atividade vai pedir. */
const ITEM_TYPE_META: Record<ItemType, { icon: LucideIcon; label: string }> = {
  multiple_choice: { icon: ListChecks, label: "Escolha" },
  column_match: { icon: ArrowLeftRight, label: "Ligar" },
  fill_blanks: { icon: AlignLeft, label: "Completar" },
  short_answer: { icon: PenLine, label: "Escrever" },
};

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
        {ordered.map((activity, index) => (
          <li key={activity.id}>
            <ActivityRow
              activity={activity}
              index={index}
              done={completedSet.has(activity.id)}
              href={`${ROUTES.student.activity(lessonId, activity.id)}${
                isDone ? "?revisao=1" : ""
              }`}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

function ActivityRow({
  activity,
  index,
  done,
  href,
}: {
  activity: Activity;
  index: number;
  done: boolean;
  href: string;
}) {
  const items = useItems(activity.id);
  const itemCount = items.data?.length ?? 0;
  const types = [...new Set((items.data ?? []).map((item) => item.type))];

  return (
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
          <p className="truncate font-semibold text-ink">{activity.title}</p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
            <span>{done ? "Concluída" : "Não iniciada"}</span>
            {itemCount > 0 && (
              <>
                <span aria-hidden>·</span>
                <span>
                  {itemCount} {itemCount === 1 ? "questão" : "questões"}
                </span>
              </>
            )}
          </div>
        </div>
        {types.length > 0 && (
          <div className="hidden shrink-0 items-center gap-1.5 sm:flex" aria-hidden>
            {types.map((type) => {
              const Icon = ITEM_TYPE_META[type].icon;
              return (
                <span
                  key={type}
                  className="grid size-7 place-items-center rounded-full bg-surface-muted text-ink-muted"
                  title={ITEM_TYPE_META[type].label}
                >
                  <Icon className="size-3.5" />
                </span>
              );
            })}
          </div>
        )}
        <ChevronRight className="size-5 shrink-0 text-ink-muted" aria-hidden />
      </Card>
    </Link>
  );
}
