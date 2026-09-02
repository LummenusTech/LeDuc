import { describe, expect, it } from "vitest";

import type { Activity, Lesson, LessonProgress } from "@/core/domain/types";
import {
  computeTrackProgress,
  findResumeLesson,
  isLessonComplete,
  isLessonUnlocked,
  isTrackComplete,
  resolveLessonStatuses,
} from "@/core/domain/unlock-rules";

const lesson = (id: string, orderIndex: number): Lesson => ({
  id,
  trackId: "t1",
  title: `Lição ${orderIndex + 1}`,
  orderIndex,
  estimatedMinutes: 10,
  status: "published",
});

const lessons = [lesson("l1", 0), lesson("l2", 1), lesson("l3", 2)];

const completed = (lessonId: string): LessonProgress => ({
  lessonId,
  status: "completed",
  masteryScore: 80,
  completedAt: "2026-03-01T12:00:00.000Z",
});

const inProgress = (lessonId: string): LessonProgress => ({
  lessonId,
  status: "in_progress",
  masteryScore: 0,
  completedAt: null,
});

describe("resolveLessonStatuses", () => {
  it("abre a primeira lição e bloqueia as demais para quem começa agora", () => {
    const statuses = resolveLessonStatuses(lessons, {});

    expect(statuses.get("l1")).toBe("available");
    expect(statuses.get("l2")).toBe("locked");
    expect(statuses.get("l3")).toBe("locked");
  });

  it("desbloqueia a seguinte só depois da anterior concluída", () => {
    const statuses = resolveLessonStatuses(lessons, { l1: completed("l1") });

    expect(statuses.get("l1")).toBe("completed");
    expect(statuses.get("l2")).toBe("available");
    expect(statuses.get("l3")).toBe("locked");
  });

  it("não pula a fila: progresso numa lição adiante não a destrava", () => {
    const statuses = resolveLessonStatuses(lessons, { l3: inProgress("l3") });

    expect(statuses.get("l2")).toBe("locked");
    expect(statuses.get("l3")).toBe("locked");
  });

  it("marca em andamento quando há progresso na lição disponível", () => {
    const statuses = resolveLessonStatuses(lessons, {
      l1: completed("l1"),
      l2: inProgress("l2"),
    });

    expect(statuses.get("l2")).toBe("in_progress");
  });

  it("respeita orderIndex, não a ordem do array", () => {
    const shuffled = [lesson("l3", 2), lesson("l1", 0), lesson("l2", 1)];
    const statuses = resolveLessonStatuses(shuffled, {});

    expect(statuses.get("l1")).toBe("available");
    expect(statuses.get("l3")).toBe("locked");
  });

  it("mantém concluídas acessíveis para revisita", () => {
    const statuses = resolveLessonStatuses(lessons, { l1: completed("l1") });
    expect(isLessonUnlocked(statuses.get("l1")!)).toBe(true);
  });
});

describe("findResumeLesson", () => {
  it("aponta para a lição em andamento", () => {
    const resume = findResumeLesson(lessons, {
      l1: completed("l1"),
      l2: inProgress("l2"),
    });

    expect(resume?.id).toBe("l2");
  });

  it("aponta para a primeira disponível quando nada está em andamento", () => {
    expect(findResumeLesson(lessons, {})?.id).toBe("l1");
  });

  it("devolve nulo quando a trilha inteira foi concluída", () => {
    const resume = findResumeLesson(lessons, {
      l1: completed("l1"),
      l2: completed("l2"),
      l3: completed("l3"),
    });

    expect(resume).toBeNull();
  });
});

describe("computeTrackProgress", () => {
  it("mede por lições concluídas", () => {
    expect(computeTrackProgress(lessons, { l1: completed("l1") })).toBe(33);
  });

  it("devolve zero para trilha sem lições", () => {
    expect(computeTrackProgress([], {})).toBe(0);
  });
});

const activity = (id: string, orderIndex: number): Activity => ({
  id,
  lessonId: "l1",
  title: `Atividade ${orderIndex + 1}`,
  orderIndex,
});

describe("isLessonComplete", () => {
  const activities = [activity("a1", 0), activity("a2", 1)];

  it("RN-P5: concluída quando toda atividade está concluída", () => {
    const completed = new Set(["a1", "a2"]);
    expect(isLessonComplete(activities, completed)).toBe(true);
  });

  it("RN-P5: não concluída enquanto falta uma atividade", () => {
    const completed = new Set(["a1"]);
    expect(isLessonComplete(activities, completed)).toBe(false);
  });

  it("uma lição sem atividades nunca está concluída", () => {
    expect(isLessonComplete([], new Set())).toBe(false);
  });
});

describe("isTrackComplete", () => {
  it("RN-P6: concluída quando toda lição está concluída", () => {
    const progress: Record<string, LessonProgress> = {
      l1: completed("l1"),
      l2: completed("l2"),
      l3: completed("l3"),
    };
    expect(isTrackComplete(lessons, progress)).toBe(true);
  });

  it("RN-P6: não concluída enquanto falta uma lição", () => {
    const progress: Record<string, LessonProgress> = {
      l1: completed("l1"),
      l2: completed("l2"),
    };
    expect(isTrackComplete(lessons, progress)).toBe(false);
  });

  it("uma trilha sem lições nunca está concluída", () => {
    expect(isTrackComplete([], {})).toBe(false);
  });
});
