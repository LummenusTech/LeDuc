"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Check, ChevronLeft, Lightbulb, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/feedback/states";
import { Card, Chip, ProgressBar, Skeleton } from "@/components/ui/primitives";
import { SpeakButton } from "@/components/a11y/speak-button";
import { useSpeak } from "@/components/a11y/use-speak";
import { MAX_ATTEMPTS_PER_ITEM } from "@/config/activity-rules";
import { ROUTES } from "@/config/routes";
import { DIFFICULTY_LABELS } from "@/core/domain/types";
import { useActivityPlayer } from "@/features/activity/hooks";
import { ColumnMatchItem } from "@/features/activity/components/items/column-match-item";
import { FillBlanksItem } from "@/features/activity/components/items/fill-blanks-item";
import { MultipleChoiceItem } from "@/features/activity/components/items/multiple-choice-item";
import { ShortAnswerItem } from "@/features/activity/components/items/short-answer-item";
import { cn } from "@/lib/cn";

const CORRECT_AUTO_ADVANCE_MS = 1400;

export function ActivityPlayer({
  lessonId,
  trackId,
  activityId,
  activityTitle,
  isReview,
}: {
  lessonId: string;
  trackId: string;
  activityId: string;
  activityTitle: string;
  isReview: boolean;
}) {
  const player = useActivityPlayer({ lessonId, trackId, activityId, isReview });
  const { speak } = useSpeak();

  const resolution = player.currentState?.resolution ?? null;

  // Acertou: segue sozinho. Errado com tentativa sobrando, revelado ou
  // pendente exigem toque explícito — o aluno decide a hora de seguir.
  useEffect(() => {
    if (!player.feedback || resolution !== "correct") return;
    const timeout = setTimeout(() => player.advance(), CORRECT_AUTO_ADVANCE_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.feedback, resolution]);

  // Lê o enunciado sozinho quando um item novo aparece — só com a leitura
  // automática ligada; o botão "Ouvir" continua funcionando de qualquer jeito.
  useEffect(() => {
    if (player.feedback || !player.currentItem) return;
    speak(player.currentItem.prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.currentItem?.id, player.feedback]);

  // Lê o feedback assim que ele chega — é o momento em que o aluno mais
  // precisa entender o que aconteceu sem depender de ler o texto.
  useEffect(() => {
    if (!player.feedback) return;
    speak(feedbackSpeechText(resolution, player.feedback));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.feedback, resolution]);

  if (player.items.isPending || !player.session) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <Skeleton className="h-2 w-full rounded-pill" />
        <Skeleton className="h-40 rounded-card" />
        <Skeleton className="h-14 rounded-control" />
      </div>
    );
  }

  if (player.items.isError) {
    return <ErrorState onRetry={() => player.items.refetch()} />;
  }

  if (!player.currentItem || player.totalItems === 0) {
    return (
      <ErrorState
        title="Esta atividade ainda não tem conteúdo"
        description="Volte para a lição e escolha outra atividade."
      />
    );
  }

  const item = player.currentItem;
  const isBusy = player.phase === "finishing";
  const showingFeedback = Boolean(player.feedback);
  const attemptsUsed = player.currentState?.attempts ?? 0;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-4">
        <Link
          href={ROUTES.student.lesson(lessonId)}
          aria-label="Voltar para a lição"
          className="grid size-11 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface-muted"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
            {activityTitle}
          </p>
          <p className="text-sm font-semibold tabular-nums text-ink">
            Questão {player.displayIndex + 1} de {player.totalItems}
          </p>
          </div>
          <ProgressBar
            value={((player.displayIndex + (showingFeedback ? 1 : 0)) /
              player.totalItems) *
              100}
            label={`Item ${player.displayIndex + 1} de ${player.totalItems}`}
            className="mt-1"
          />
        </div>
      </div>

      <Card variant="featured" className="p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Chip>{DIFFICULTY_LABELS[item.difficulty]}</Chip>
          <p className="text-sm font-medium text-ink-muted">
            {attemptsUsed === 0
              ? `Você tem ${MAX_ATTEMPTS_PER_ITEM} tentativas`
              : `${MAX_ATTEMPTS_PER_ITEM - attemptsUsed} tentativas restantes`}
          </p>
        </div>

        <div className="mb-6 flex items-start justify-between gap-4 border-b border-line pb-5">
          <p className="text-pretty text-xl font-bold leading-relaxed text-ink sm:text-2xl">
            {item.prompt}
          </p>
          <SpeakButton text={item.prompt} label="" className="shrink-0" />
        </div>

      <fieldset disabled={isBusy || showingFeedback} className="contents">
        {item.type === "multiple_choice" && (
          <MultipleChoiceItem
            key={item.id}
            item={item}
            disabled={isBusy}
            onSubmit={player.submit}
          />
        )}
        {item.type === "column_match" && (
          <ColumnMatchItem
            key={item.id}
            item={item}
            disabled={isBusy}
            onSubmit={player.submit}
          />
        )}
        {item.type === "fill_blanks" && (
          <FillBlanksItem
            key={item.id}
            item={item}
            disabled={isBusy}
            onSubmit={player.submit}
          />
        )}
        {item.type === "short_answer" && (
          <ShortAnswerItem
            key={item.id}
            item={item}
            disabled={isBusy}
            isOnline={player.isOnline}
            onSubmit={player.submit}
          />
        )}
      </fieldset>
      </Card>

      {player.feedback && (
        <FeedbackBanner
          resolution={resolution}
          outcome={player.feedback}
          attemptsUsed={attemptsUsed}
          onRetry={player.retry}
          onAdvance={player.advance}
          isBusy={isBusy}
        />
      )}

      {player.error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {player.error}
        </p>
      )}
    </div>
  );
}

/** O que a leitura em voz alta fala quando o feedback aparece. */
function feedbackSpeechText(
  resolution: "correct" | "revealed" | "pending_review" | null,
  outcome: { explanation?: string; message?: string },
): string {
  if (resolution === "correct") {
    return `Isso mesmo! ${outcome.explanation ?? ""}`;
  }
  if (resolution === "revealed") {
    return `Essa não era a resposta. ${outcome.explanation ?? ""}`;
  }
  if (resolution === "pending_review") {
    return outcome.message ?? "Resposta guardada.";
  }
  return "Não foi dessa vez. Tente de novo.";
}

function FeedbackBanner({
  resolution,
  outcome,
  attemptsUsed,
  onRetry,
  onAdvance,
  isBusy,
}: {
  resolution: "correct" | "revealed" | "pending_review" | null;
  outcome: { status: string; explanation?: string; message?: string };
  attemptsUsed: number;
  onRetry: () => void;
  onAdvance: () => void;
  isBusy: boolean;
}) {
  if (resolution === "correct") {
    return (
      <div className="flex items-start gap-3 rounded-card bg-success-soft px-4 py-3.5 text-success">
        <Check className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">Isso mesmo!</p>
          {outcome.explanation && (
            <p className="mt-0.5 text-sm">{outcome.explanation}</p>
          )}
        </div>
      </div>
    );
  }

  if (resolution === "pending_review") {
    return (
      <div className="flex flex-col items-stretch gap-3 rounded-card border border-line bg-surface-muted px-4 py-4 sm:flex-row sm:items-start">
        <Lightbulb className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden />
        <div className="flex-1">
          <p className="font-semibold text-ink">Resposta guardada</p>
          <p className="mt-0.5 text-sm text-ink-muted">{outcome.message}</p>
        </div>
        <Button size="compact" isLoading={isBusy} onClick={onAdvance}>
          Avançar
        </Button>
      </div>
    );
  }

  if (resolution === "revealed") {
    return (
      <div className="flex flex-col items-stretch gap-3 rounded-card border border-danger/15 bg-danger-soft px-4 py-4 text-danger sm:flex-row sm:items-start">
        <X className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="flex-1">
          <p className="font-semibold">Essa não era a resposta</p>
          {outcome.explanation && (
            <p className="mt-0.5 text-sm text-ink">{outcome.explanation}</p>
          )}
        </div>
        <Button size="compact" isLoading={isBusy} onClick={onAdvance}>
          Avançar
        </Button>
      </div>
    );
  }

  // Errou, ainda sobra tentativa (RN-A1).
  const remaining = MAX_ATTEMPTS_PER_ITEM - attemptsUsed;
  return (
    <div
      className={cn(
        "flex flex-col items-stretch gap-3 rounded-card border border-danger/15 bg-danger-soft px-4 py-4 text-danger sm:flex-row sm:items-start",
      )}
    >
      <RotateCcw className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="flex-1">
        <p className="font-semibold">Não foi dessa vez</p>
        <p className="mt-0.5 text-sm text-ink">
          {remaining === 1
            ? "Você tem mais 1 tentativa."
            : `Você tem mais ${remaining} tentativas.`}
        </p>
      </div>
      <Button size="compact" variant="soft" isLoading={isBusy} onClick={onRetry}>
        Tentar de novo
      </Button>
    </div>
  );
}
