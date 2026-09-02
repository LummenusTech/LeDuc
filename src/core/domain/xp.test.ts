import { describe, expect, it } from "vitest";

import {
  XP_ACTIVITY_FLOOR,
  XP_STREAK_MILESTONE,
  XP_STUDY_TIME_MILESTONE,
} from "@/config/xp-rules";
import {
  buildActivityXpEvent,
  buildReviewXpEvent,
  buildTrackCompletionXpEvent,
  computeActivityXp,
  computeMilestoneXp,
  computePerformancePercent,
  sumXpLedger,
  type ScoredItem,
} from "@/core/domain/xp";

const item = (
  difficulty: ScoredItem["difficulty"],
  correctOnFirstAttempt: boolean,
): ScoredItem => ({ difficulty, correctOnFirstAttempt });

describe("computeActivityXp", () => {
  it("soma a dificuldade dos itens acertados de primeira", () => {
    expect(
      computeActivityXp([
        item("easy", true),
        item("medium", true),
        item("hard", true),
      ]),
    ).toBe(30);
  });

  it("ignora acertos que não foram na primeira tentativa", () => {
    expect(
      computeActivityXp([item("hard", false), item("hard", true)]),
    ).toBe(15);
  });

  it("aplica o piso quando o aluno erra tudo — o produto não pune", () => {
    expect(
      computeActivityXp([item("hard", false), item("hard", false)]),
    ).toBe(XP_ACTIVITY_FLOOR);
  });

  it("nunca devolve XP negativo, mesmo sem itens", () => {
    expect(computeActivityXp([])).toBe(XP_ACTIVITY_FLOOR);
  });
});

describe("computeMilestoneXp", () => {
  const { blockSize, reward } = XP_STREAK_MILESTONE;

  it("credita ao atingir o primeiro bloco", () => {
    expect(computeMilestoneXp(10, blockSize, reward, 0)).toEqual({
      xp: 10,
      milestone: 1,
    });
  });

  it("não credita nada antes de fechar o bloco", () => {
    expect(computeMilestoneXp(9, blockSize, reward, 0)).toEqual({
      xp: 0,
      milestone: 0,
    });
  });

  it("repete a cada bloco", () => {
    expect(computeMilestoneXp(30, blockSize, reward, 2)).toEqual({
      xp: 10,
      milestone: 3,
    });
  });

  it("é idempotente: reprocessar o mesmo estado não duplica XP", () => {
    const first = computeMilestoneXp(20, blockSize, reward, 0);
    expect(first).toEqual({ xp: 20, milestone: 2 });

    const replayed = computeMilestoneXp(20, blockSize, reward, first.milestone);
    expect(replayed).toEqual({ xp: 0, milestone: 2 });
  });

  it("credita blocos pulados de uma vez — sincronização offline atrasada", () => {
    const { blockSizeMinutes, reward: minuteReward } = XP_STUDY_TIME_MILESTONE;
    expect(computeMilestoneXp(95, blockSizeMinutes, minuteReward, 0)).toEqual({
      xp: 30,
      milestone: 3,
    });
  });

  it("nunca retrocede o marco nem gera XP negativo", () => {
    expect(computeMilestoneXp(5, blockSize, reward, 4)).toEqual({
      xp: 0,
      milestone: 4,
    });
    expect(computeMilestoneXp(-50, blockSize, reward, 2)).toEqual({
      xp: 0,
      milestone: 2,
    });
  });

  it("não divide por zero", () => {
    expect(computeMilestoneXp(100, 0, reward, 0)).toEqual({ xp: 0, milestone: 0 });
  });
});

describe("ledger", () => {
  it("soma os créditos", () => {
    expect(
      sumXpLedger([
        buildTrackCompletionXpEvent("t1"),
        buildReviewXpEvent("a1", "2026-03-10"),
      ]),
    ).toBe(65);
  });

  it("descarta duplicatas: reenviar não credita duas vezes", () => {
    const event = buildTrackCompletionXpEvent("t1");
    expect(sumXpLedger([event, event, event])).toBe(50);
  });

  it("limita a revisão a uma vez por atividade por dia", () => {
    const morning = buildReviewXpEvent("a1", "2026-03-10");
    const afternoon = buildReviewXpEvent("a1", "2026-03-10");
    const nextDay = buildReviewXpEvent("a1", "2026-03-11");

    expect(sumXpLedger([morning, afternoon])).toBe(15);
    expect(sumXpLedger([morning, afternoon, nextDay])).toBe(30);
  });

  it("distingue atividades diferentes no mesmo dia", () => {
    expect(
      sumXpLedger([
        buildReviewXpEvent("a1", "2026-03-10"),
        buildReviewXpEvent("a2", "2026-03-10"),
      ]),
    ).toBe(30);
  });

  it("nunca subtrai, mesmo recebendo um valor negativo", () => {
    expect(
      sumXpLedger([
        buildTrackCompletionXpEvent("t1"),
        { reason: "activity_completed", refId: "x", amount: -100 },
      ]),
    ).toBe(50);
  });

  it("o total nunca decresce ao acrescentar eventos", () => {
    const events = [
      buildActivityXpEvent("a1", [item("hard", true)]),
      buildReviewXpEvent("a1", "2026-03-10"),
      buildTrackCompletionXpEvent("t1"),
    ];

    let previous = 0;
    for (let i = 1; i <= events.length; i += 1) {
      const total = sumXpLedger(events.slice(0, i));
      expect(total).toBeGreaterThanOrEqual(previous);
      previous = total;
    }
  });
});

describe("computePerformancePercent", () => {
  it("mede acerto de primeira tentativa", () => {
    expect(
      computePerformancePercent([
        item("easy", true),
        item("easy", true),
        item("easy", false),
        item("easy", false),
      ]),
    ).toBe(50);
  });

  it("devolve zero para atividade sem itens", () => {
    expect(computePerformancePercent([])).toBe(0);
  });
});
