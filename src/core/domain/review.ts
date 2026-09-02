import {
  REVIEW_AFTER_DAYS,
  SUGGESTED_REVIEWS_LIMIT,
} from "@/config/activity-rules";
import type { LessonProgress } from "@/core/domain/types";

/**
 * Fila de revisão (RN-R1 a RN-R4).
 *
 * A revisão é **sempre opcional** e nunca penaliza. Por isso a tela inicial
 * sugere uma de cada vez: uma lista de pendências transformaria o reforço numa
 * cobrança, que é o oposto do que ele deveria ser.
 */

export type ReviewCandidate = {
  lessonId: string;
  masteryScore: number;
  completedAt: string;
  daysSinceCompletion: number;
};

const MS_PER_DAY = 86_400_000;

function daysBetween(fromIso: string, toIso: string): number {
  return Math.floor(
    (new Date(toIso).getTime() - new Date(fromIso).getTime()) / MS_PER_DAY,
  );
}

/**
 * Lições maduras para revisão, já ordenadas por prioridade.
 *
 * Prioridade: menor domínio primeiro — quem entendeu menos precisa mais — e,
 * empatando, a mais antiga, que é a que corre mais risco de ter sido esquecida.
 */
export function selectReviewCandidates(
  progress: readonly LessonProgress[],
  { now }: { now: string },
): ReviewCandidate[] {
  return progress
    .filter(
      (lesson): lesson is LessonProgress & { completedAt: string } =>
        lesson.status === "completed" && lesson.completedAt !== null,
    )
    .map((lesson) => ({
      lessonId: lesson.lessonId,
      masteryScore: lesson.masteryScore,
      completedAt: lesson.completedAt,
      daysSinceCompletion: daysBetween(lesson.completedAt, now),
    }))
    .filter(
      (candidate) => candidate.daysSinceCompletion >= REVIEW_AFTER_DAYS,
    )
    .sort((a, b) => {
      if (a.masteryScore !== b.masteryScore) {
        return a.masteryScore - b.masteryScore;
      }
      return a.completedAt < b.completedAt ? -1 : 1;
    });
}

/** O que a tela inicial sugere. Vazio quando não há nada maduro. */
export function pickSuggestedReviews(
  progress: readonly LessonProgress[],
  { now }: { now: string },
): ReviewCandidate[] {
  return selectReviewCandidates(progress, { now }).slice(
    0,
    SUGGESTED_REVIEWS_LIMIT,
  );
}
