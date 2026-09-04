"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { dataSource } from "@/core/data/provider";
import { queryKeys } from "@/core/data/query-keys";
import { ROUTES } from "@/config/routes";
import {
  completeSession,
  nextItemIndex,
  resumeSession,
  startSession,
  submitAnswer,
  type ActivitySession,
  type ItemState,
} from "@/core/domain/activity-session";
import { gradeItemLocally, type GradeOutcome, type ItemAnswer } from "@/core/domain/grading";
import { writeActivityResult } from "@/features/activity/result-store";

export function useCompletedActivityIds(lessonId: string) {
  return useQuery({
    queryKey: queryKeys.completedActivityIds(lessonId),
    queryFn: () => dataSource.activity.getCompletedActivityIds(lessonId),
    enabled: Boolean(lessonId),
  });
}

function isOnlineNow(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

type PlayerPhase = "loading" | "error" | "playing" | "finishing";

/**
 * Orquestra o player: domínio decide, este hook liga domínio + dados + rota.
 *
 * Nenhum `if` de regra de negócio aqui — cada transição chama uma função de
 * `activity-session.ts` e persiste o resultado. O único estado que este hook
 * possui por conta própria é de interface (índice em exibição, mensagem de
 * erro de rede).
 */
export function useActivityPlayer({
  lessonId,
  trackId,
  activityId,
  isReview,
}: {
  lessonId: string;
  trackId: string;
  activityId: string;
  isReview: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const items = useQuery({
    queryKey: queryKeys.items.byActivity(activityId),
    queryFn: () => dataSource.content.listItems(activityId),
    enabled: Boolean(activityId),
  });

  const [session, setSession] = useState<ActivitySession | null>(null);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [feedback, setFeedback] = useState<GradeOutcome | null>(null);
  const [phase, setPhase] = useState<PlayerPhase>("loading");
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !items.data) return;
    initialized.current = true;

    let cancelled = false;
    (async () => {
      try {
        const saved = await dataSource.activity.getSession(activityId);
        if (cancelled) return;

        const initial = saved
          ? resumeSession(saved, items.data)
          : startSession(activityId, items.data, {
              startedAt: new Date().toISOString(),
              isReview,
            });

        setSession(initial);
        setDisplayIndex(nextItemIndex(initial) ?? 0);
        setPhase("playing");
      } catch {
        if (!cancelled) {
          setError("Não deu para carregar sua atividade. Tente de novo.");
          setPhase("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items.data, activityId, isReview]);

  const currentItem = items.data?.[displayIndex] ?? null;
  const currentState: ItemState | undefined = currentItem
    ? session?.items.find((state) => state.itemId === currentItem.id)
    : undefined;

  async function submit(answer: ItemAnswer) {
    if (!session || !currentItem) return;
    setError(null);
    setPhase("finishing"); // reaproveita o estado de "ocupado" para travar a interface

    try {
      const online = isOnlineNow();
      let outcome = gradeItemLocally(currentItem, answer, { isOnline: online });

      if (outcome === null) {
        outcome = await dataSource.ai.gradeShortAnswer(
          currentItem,
          answer.type === "short_answer" ? answer.text : "",
        );
      }

      const now = new Date().toISOString();
      const updated = submitAnswer(session, currentItem.id, outcome, now);
      setSession(updated);
      await dataSource.activity.saveSession(updated);
      setFeedback(outcome);
      setPhase("playing");
    } catch {
      setError("Não deu para corrigir agora. Confira a conexão e tente de novo.");
      setPhase("playing");
    }
  }

  function retry() {
    setFeedback(null);
  }

  async function advance() {
    if (!session) return;

    const next = nextItemIndex(session);
    if (next !== null) {
      setDisplayIndex(next);
      setFeedback(null);
      return;
    }

    setPhase("finishing");
    try {
      const now = new Date().toISOString();
      const closed = completeSession(session, now);
      await dataSource.activity.saveSession(closed);

      const summary = await dataSource.activity.completeActivity(closed);
      const effects = await dataSource.activity.applyCompletionEffects({
        session: closed,
        summary,
        lessonId,
        trackId,
      });

      writeActivityResult(activityId, {
        summary,
        effects,
        lessonId,
        trackId,
      });

      // Tudo que qualquer outra tela lê e que este resultado mudou.
      queryClient.invalidateQueries({ queryKey: queryKeys.gamification });
      queryClient.invalidateQueries({
        queryKey: queryKeys.unlockedAchievements,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tracks.progress(trackId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.completedActivityIds(lessonId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tracks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.lessonHistory });

      router.push(ROUTES.student.activityResult(lessonId, activityId));
    } catch {
      setError("Não deu para fechar a atividade agora. Tente de novo.");
      setPhase("playing");
    }
  }

  return {
    items,
    session,
    currentItem,
    currentState,
    displayIndex,
    totalItems: items.data?.length ?? 0,
    feedback,
    phase,
    error,
    isOnline: isOnlineNow(),
    submit,
    retry,
    advance,
  };
}
