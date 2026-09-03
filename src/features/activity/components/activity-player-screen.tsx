"use client";

import { ErrorState } from "@/components/feedback/states";
import { Skeleton } from "@/components/ui/primitives";
import { useActivities, useLesson } from "@/features/content/hooks";
import { ActivityPlayer } from "@/features/activity/components/activity-player";

/**
 * Resolve o que a rota `/licoes/[id]/atividades/[id]` não carrega — trilha
 * dona da lição e título da atividade — antes de entrar no player.
 */
export function ActivityPlayerScreen({
  lessonId,
  activityId,
  isReview,
}: {
  lessonId: string;
  activityId: string;
  isReview: boolean;
}) {
  const lesson = useLesson(lessonId);
  const activities = useActivities(lessonId);

  if (lesson.isPending || activities.isPending) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <Skeleton className="h-2 w-full rounded-pill" />
        <Skeleton className="h-40 rounded-card" />
      </div>
    );
  }

  if (lesson.isError || activities.isError || !lesson.data) {
    return (
      <ErrorState
        onRetry={() => {
          lesson.refetch();
          activities.refetch();
        }}
      />
    );
  }

  const activity = activities.data.find((item) => item.id === activityId);
  if (!activity) {
    return (
      <ErrorState
        title="Atividade não encontrada"
        description="Volte para a lição e escolha outra atividade."
      />
    );
  }

  return (
    <ActivityPlayer
      lessonId={lessonId}
      trackId={lesson.data.trackId}
      activityId={activityId}
      activityTitle={activity.title}
      isReview={isReview}
    />
  );
}
