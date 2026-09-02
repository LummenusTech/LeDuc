import { describe, expect, it } from "vitest";

import { REVIEW_AFTER_DAYS } from "@/config/activity-rules";
import {
  pickSuggestedReviews,
  selectReviewCandidates,
} from "@/core/domain/review";
import {
  computeRetentionRate,
  formatRetentionRate,
  type ReviewAttempt,
} from "@/core/domain/retention";
import {
  recordActivity,
  startStudySession,
  totalStudyMinutes,
} from "@/core/domain/study-time";
import type { LessonProgress } from "@/core/domain/types";

const NOW = "2026-03-20T12:00:00.000Z";

function completed(
  lessonId: string,
  masteryScore: number,
  completedAt: string,
): LessonProgress {
  return { lessonId, status: "completed", masteryScore, completedAt };
}

describe("selectReviewCandidates", () => {
  it("ignora lição concluída há menos que o intervalo", () => {
    const recent = completed("l1", 50, "2026-03-19T12:00:00.000Z");
    expect(selectReviewCandidates([recent], { now: NOW })).toEqual([]);
  });

  it("inclui a partir do intervalo definido", () => {
    const mature = completed("l1", 50, "2026-03-13T12:00:00.000Z");
    const candidates = selectReviewCandidates([mature], { now: NOW });

    expect(candidates).toHaveLength(1);
    expect(candidates[0].daysSinceCompletion).toBe(REVIEW_AFTER_DAYS);
  });

  it("prioriza o menor domínio", () => {
    const candidates = selectReviewCandidates(
      [
        completed("alto", 90, "2026-03-01T12:00:00.000Z"),
        completed("baixo", 40, "2026-03-01T12:00:00.000Z"),
        completed("medio", 70, "2026-03-01T12:00:00.000Z"),
      ],
      { now: NOW },
    );

    expect(candidates.map((c) => c.lessonId)).toEqual([
      "baixo",
      "medio",
      "alto",
    ]);
  });

  it("empatando o domínio, a mais antiga vem primeiro", () => {
    const candidates = selectReviewCandidates(
      [
        completed("nova", 60, "2026-03-05T12:00:00.000Z"),
        completed("antiga", 60, "2026-03-01T12:00:00.000Z"),
      ],
      { now: NOW },
    );

    expect(candidates[0].lessonId).toBe("antiga");
  });

  it("ignora lição não concluída", () => {
    const inProgress: LessonProgress = {
      lessonId: "l9",
      status: "in_progress",
      masteryScore: 0,
      completedAt: null,
    };
    expect(selectReviewCandidates([inProgress], { now: NOW })).toEqual([]);
  });
});

describe("pickSuggestedReviews", () => {
  it("sugere uma de cada vez — reforço não é lista de pendências", () => {
    const suggestions = pickSuggestedReviews(
      [
        completed("l1", 30, "2026-03-01T12:00:00.000Z"),
        completed("l2", 40, "2026-03-01T12:00:00.000Z"),
        completed("l3", 50, "2026-03-01T12:00:00.000Z"),
      ],
      { now: NOW },
    );

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].lessonId).toBe("l1");
  });

  it("devolve vazio quando não há nada maduro", () => {
    expect(pickSuggestedReviews([], { now: NOW })).toEqual([]);
  });
});

describe("computeRetentionRate", () => {
  function attempts(results: boolean[]): ReviewAttempt[] {
    return results.map((isCorrect, index) => ({
      itemId: `i${index}`,
      attemptNumber: 1,
      isCorrect,
    }));
  }

  it("devolve nulo com amostra pequena demais", () => {
    expect(computeRetentionRate(attempts([true, true, true]))).toBeNull();
  });

  it("mede o acerto de primeira tentativa em revisão", () => {
    const results = [...Array(8).fill(true), ...Array(2).fill(false)];
    expect(computeRetentionRate(attempts(results))).toBe(80);
  });

  it("descarta as tentativas seguintes do mesmo item", () => {
    const base = attempts(Array(10).fill(false));
    const withRetries: ReviewAttempt[] = [
      ...base,
      { itemId: "i0", attemptNumber: 2, isCorrect: true },
      { itemId: "i1", attemptNumber: 3, isCorrect: true },
    ];

    expect(computeRetentionRate(withRetries)).toBe(0);
  });

  it("formata o caso de amostra insuficiente como travessão", () => {
    expect(formatRetentionRate(null)).toBe("—");
    expect(formatRetentionRate(78)).toBe("78%");
  });
});

describe("study-time", () => {
  it("acumula tempo entre interações próximas", () => {
    let session = startStudySession("2026-03-20T10:00:00.000Z");
    session = recordActivity(session, "2026-03-20T10:02:00.000Z");
    session = recordActivity(session, "2026-03-20T10:05:00.000Z");

    expect(totalStudyMinutes(session)).toBe(5);
  });

  it("descarta o intervalo após inatividade longa", () => {
    let session = startStudySession("2026-03-20T10:00:00.000Z");
    session = recordActivity(session, "2026-03-20T10:03:00.000Z");
    // Aba esquecida aberta por duas horas: não pode virar tempo de estudo.
    session = recordActivity(session, "2026-03-20T12:03:00.000Z");
    session = recordActivity(session, "2026-03-20T12:05:00.000Z");

    expect(totalStudyMinutes(session)).toBe(5);
  });

  it("não subtrai tempo se o relógio do aparelho voltar", () => {
    let session = startStudySession("2026-03-20T10:00:00.000Z");
    session = recordActivity(session, "2026-03-20T10:04:00.000Z");
    session = recordActivity(session, "2026-03-20T09:00:00.000Z");

    expect(totalStudyMinutes(session)).toBe(4);
  });
});
