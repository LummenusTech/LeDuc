"use client";

import { CheckCircle2, CircleDot } from "lucide-react";
import Link from "next/link";

import { EmptyState, ErrorState } from "@/components/feedback/states";
import { Card, Skeleton } from "@/components/ui/primitives";
import { ROUTES } from "@/config/routes";
import { useLessonHistory } from "@/features/progress/hooks";
import { cn } from "@/lib/cn";

/** Histórico do que o aluno já estudou, mais recente primeiro. */
export function ActivityHistory() {
  const history = useLessonHistory();

  if (history.isPending) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-card" />
        ))}
      </div>
    );
  }

  if (history.isError) {
    return <ErrorState onRetry={() => history.refetch()} />;
  }

  if (history.data.length === 0) {
    return (
      <EmptyState
        title="Nada por aqui ainda"
        description="As lições que você concluir ou começar aparecem aqui."
      />
    );
  }

  return (
    <ol className="mx-auto flex max-w-2xl flex-col gap-3">
      {history.data.map(({ lesson, track, progress }) => (
        <li key={lesson.id}>
          <Link href={ROUTES.student.lesson(lesson.id)}>
            <Card className="flex items-center gap-4 px-4 py-3.5 transition-shadow hover:shadow-raised focus-visible:shadow-raised">
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-full",
                  progress.status === "completed"
                    ? "bg-primary-soft text-primary"
                    : "bg-surface-muted text-ink-muted",
                )}
                aria-hidden
              >
                {progress.status === "completed" ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <CircleDot className="size-5" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">
                  {lesson.title}
                </p>
                <p className="text-xs text-ink-muted">
                  {track.title}
                  {progress.status === "completed" &&
                    ` · ${progress.masteryScore}% de domínio`}
                  {progress.status === "in_progress" && " · Em andamento"}
                </p>
              </div>

              {progress.completedAt && (
                <p className="shrink-0 text-xs text-ink-muted">
                  {formatDate(progress.completedAt)}
                </p>
              )}
            </Card>
          </Link>
        </li>
      ))}
    </ol>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}
