import { describe, expect, it } from "vitest";

import { ACHIEVEMENTS } from "@/config/achievements";
import {
  evaluateAchievements,
  findAchievement,
  type AchievementContext,
} from "@/core/domain/achievements";

const NOW = "2026-03-10T12:00:00.000Z";

const empty: AchievementContext = {
  lessonsCompleted: 0,
  tracksCompleted: 0,
  modulesCompleted: 0,
  xpTotal: 0,
  currentStreakDays: 0,
  longestStreakDays: 0,
  perfectLessons: 0,
  reviewsCompleted: 0,
};

describe("evaluateAchievements", () => {
  it("não desbloqueia nada para quem acabou de começar", () => {
    expect(evaluateAchievements(empty, [], { now: NOW })).toEqual([]);
  });

  it("desbloqueia ao cumprir o critério", () => {
    const unlocked = evaluateAchievements(
      { ...empty, lessonsCompleted: 1 },
      [],
      { now: NOW },
    );

    expect(unlocked).toEqual([{ code: "first_lesson", unlockedAt: NOW }]);
  });

  it("devolve apenas as novas — é idempotente", () => {
    const context = { ...empty, lessonsCompleted: 1 };
    const first = evaluateAchievements(context, [], { now: NOW });
    const second = evaluateAchievements(
      context,
      first.map((a) => a.code),
      { now: NOW },
    );

    expect(second).toEqual([]);
  });

  it("desbloqueia várias de uma vez quando o contexto salta", () => {
    const unlocked = evaluateAchievements(
      { ...empty, lessonsCompleted: 12, xpTotal: 150, longestStreakDays: 4 },
      [],
      { now: NOW },
    );

    const codes = unlocked.map((a) => a.code);
    expect(codes).toContain("first_lesson");
    expect(codes).toContain("ten_lessons");
    expect(codes).toContain("xp_100");
    expect(codes).toContain("streak_3");
    expect(codes).not.toContain("streak_7");
  });

  it("usa o recorde de ofensiva, não a atual — quebrar não retira a conquista", () => {
    const unlocked = evaluateAchievements(
      { ...empty, currentStreakDays: 0, longestStreakDays: 30 },
      [],
      { now: NOW },
    );

    expect(unlocked.map((a) => a.code)).toContain("streak_30");
  });
});

describe("catálogo", () => {
  it("não tem códigos repetidos", () => {
    const codes = ACHIEVEMENTS.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("toda conquista tem título e descrição", () => {
    for (const achievement of ACHIEVEMENTS) {
      expect(achievement.title.length).toBeGreaterThan(0);
      expect(achievement.description.length).toBeGreaterThan(0);
    }
  });

  it("permite localizar uma conquista pelo código", () => {
    expect(findAchievement("first_lesson")?.title).toBe("Primeiro passo");
    expect(findAchievement("inexistente")).toBeUndefined();
  });
});
