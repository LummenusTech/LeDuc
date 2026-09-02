import { describe, expect, it } from "vitest";

import {
  computeMasteryScore,
  reconcileMasteryScore,
  selectFirstAttempts,
} from "@/core/domain/mastery";
import type { Attempt } from "@/core/domain/types";

const attempt = (
  itemId: string,
  attemptNumber: number,
  isCorrect: boolean,
  answeredAt = "2026-01-01T10:00:00.000Z",
): Attempt => ({
  itemId,
  attemptNumber,
  isCorrect,
  timeSpentSeconds: 12,
  answeredAt,
});

describe("selectFirstAttempts", () => {
  it("descarta tudo a partir da segunda tentativa", () => {
    const selected = selectFirstAttempts([
      attempt("i1", 1, false),
      attempt("i1", 2, true),
      attempt("i1", 3, true),
    ]);

    expect(selected).toHaveLength(1);
    expect(selected[0].isCorrect).toBe(false);
  });
});

describe("computeMasteryScore", () => {
  it("mede apenas as primeiras tentativas", () => {
    const score = computeMasteryScore([
      attempt("i1", 1, true),
      attempt("i2", 1, false),
      attempt("i2", 2, true),
      attempt("i3", 1, true),
      attempt("i4", 1, false),
    ]);

    expect(score).toBe(50);
  });

  it("não sobe quando o aluno revisita e acerta", () => {
    const attempts: Attempt[] = [attempt("i1", 1, false), attempt("i2", 1, false)];
    expect(computeMasteryScore(attempts)).toBe(0);

    const afterRevisit: Attempt[] = [
      ...attempts,
      attempt("i1", 2, true),
      attempt("i2", 2, true),
    ];
    expect(computeMasteryScore(afterRevisit)).toBe(0);
  });

  it("devolve zero sem tentativas", () => {
    expect(computeMasteryScore([])).toBe(0);
  });
});

describe("reconcileMasteryScore", () => {
  it("preserva o domínio já registrado", () => {
    expect(reconcileMasteryScore(40, 100)).toBe(40);
  });

  it("aceita o primeiro resultado quando ainda não há registro", () => {
    expect(reconcileMasteryScore(null, 75)).toBe(75);
  });

  it("preserva um domínio zerado — zero é um registro, não ausência", () => {
    expect(reconcileMasteryScore(0, 100)).toBe(0);
  });
});
