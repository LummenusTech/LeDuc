import {
  evaluateAchievements,
  type AchievementContext,
} from "@/core/domain/achievements";
import { computeStreak, toDayKey } from "@/core/domain/streak";
import type { XpEventDraft } from "@/core/domain/xp";
import { sumXpLedger } from "@/core/domain/xp";
import type { LessonProgress } from "@/core/domain/types";
import {
  MOCK_GAMIFICATION,
  MOCK_LESSON_PROGRESS,
  MOCK_USER_STATS,
} from "@/core/data/mock/fixtures";

/**
 * "Banco" mock, mutável, em localStorage.
 *
 * Tudo em `mock/index.ts` que só lê vem de `fixtures.ts` (dado congelado, o
 * mesmo em toda sessão do navegador). O que o aluno muda de verdade — XP,
 * lição concluída, ofensiva, conquista — vive aqui, seed a partir da fixture
 * na primeira leitura e depois só cresce. É o que faz "concluir uma
 * atividade" sobreviver a um F5.
 */

function readJson<T>(key: string, fallback: () => T): T {
  if (typeof window === "undefined") return fallback();
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback();
  } catch {
    return fallback();
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sem persistência, o protótipo segue navegável — só não sobrevive a F5.
  }
}

/* -------------------------------------------------------------------------- */
/* Progresso de lição                                                         */
/* -------------------------------------------------------------------------- */

const PROGRESS_KEY = "leduc.progress";

export function readProgress(): Record<string, LessonProgress> {
  return readJson(PROGRESS_KEY, () => ({ ...MOCK_LESSON_PROGRESS }));
}

export function writeProgress(progress: Record<string, LessonProgress>) {
  writeJson(PROGRESS_KEY, progress);
}

/* -------------------------------------------------------------------------- */
/* Atividades concluídas por lição — insumo de RN-P5 (isLessonComplete)       */
/* -------------------------------------------------------------------------- */

const ACTIVITY_COMPLETIONS_KEY = "leduc.activity-completions";

/** Lições já marcadas `completed` na fixture têm as duas atividades por concluídas. */
function seedActivityCompletions(): Record<string, string[]> {
  const seed: Record<string, string[]> = {};
  for (const [lessonId, progress] of Object.entries(MOCK_LESSON_PROGRESS)) {
    if (progress.status === "completed") {
      seed[lessonId] = [`${lessonId}-a1`, `${lessonId}-a2`];
    }
  }
  return seed;
}

export function readActivityCompletions(): Record<string, string[]> {
  return readJson(ACTIVITY_COMPLETIONS_KEY, seedActivityCompletions);
}

export function writeActivityCompletions(
  completions: Record<string, string[]>,
) {
  writeJson(ACTIVITY_COMPLETIONS_KEY, completions);
}

/* -------------------------------------------------------------------------- */
/* XP — ledger append-only (RN-X7)                                            */
/* -------------------------------------------------------------------------- */

const XP_LEDGER_KEY = "leduc.xp-ledger";

/** Um evento único preserva o XP de demonstração da fixture como saldo inicial. */
function seedXpLedger(): XpEventDraft[] {
  return [
    {
      reason: "activity_completed",
      refId: "seed-baseline",
      amount: MOCK_GAMIFICATION.xpTotal,
    },
  ];
}

export function readXpLedger(): XpEventDraft[] {
  return readJson(XP_LEDGER_KEY, seedXpLedger);
}

export function writeXpLedger(ledger: XpEventDraft[]) {
  writeJson(XP_LEDGER_KEY, ledger);
}

export function currentXpTotal(): number {
  return sumXpLedger(readXpLedger());
}

/* -------------------------------------------------------------------------- */
/* Ofensiva — dias de acesso (RN-O1 a RN-O4)                                  */
/* -------------------------------------------------------------------------- */

const STREAK_KEY = "leduc.streak-days";

function daysAgo(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  return toDayKey(date);
}

/**
 * Duas sequências: uma antiga de `longestStreakDays` dias (o recorde), um
 * intervalo sem acesso, e uma atual de `streakDays` dias terminando ontem —
 * hoje ainda não foi acessado, então a ofensiva segue viva até o fim do dia
 * (RN-O3). Reproduz os dois números da fixture antiga a partir de histórico
 * de acesso real, não de um campo solto.
 */
function seedStreakDays(): string[] {
  const days: string[] = [];
  const currentRun = MOCK_GAMIFICATION.streakDays;
  const recordRun = MOCK_GAMIFICATION.longestStreakDays;

  for (let offset = currentRun; offset >= 1; offset -= 1) {
    days.push(daysAgo(offset));
  }

  const gapStart = currentRun + 2; // +2: um dia de intervalo depois do recorde
  for (let i = 0; i < recordRun; i += 1) {
    days.push(daysAgo(gapStart + i));
  }

  return days;
}

export function readStreakDays(): string[] {
  return readJson(STREAK_KEY, seedStreakDays);
}

export function writeStreakDays(days: string[]) {
  writeJson(STREAK_KEY, days);
}

/** Registra o acesso de hoje. Idempotente — `Set` descarta duplicata. */
export function recordAccessToday(): void {
  const today = toDayKey(new Date());
  const days = new Set(readStreakDays());
  days.add(today);
  writeStreakDays([...days]);
}

export function currentStreak() {
  return computeStreak(readStreakDays(), toDayKey(new Date()));
}

/* -------------------------------------------------------------------------- */
/* Conquistas desbloqueadas (RN-X9)                                           */
/* -------------------------------------------------------------------------- */

const ACHIEVEMENTS_KEY = "leduc.achievements";

/**
 * Semente calculada, não chutada: roda o mesmo motor de conquistas contra o
 * contexto inicial de demonstração, uma vez. Garante que o que aparece como
 * "já desbloqueado" é sempre consistente com o catálogo em `config/achievements.ts`.
 */
function seedAchievements(): string[] {
  const streak = computeStreak(seedStreakDays(), toDayKey(new Date()));

  const seedContext: AchievementContext = {
    lessonsCompleted: MOCK_USER_STATS.lessonsCompleted,
    tracksCompleted: 0,
    modulesCompleted: 0,
    xpTotal: sumXpLedger(seedXpLedger()),
    currentStreakDays: streak.current,
    longestStreakDays: streak.longest,
    perfectLessons: Object.values(MOCK_LESSON_PROGRESS).filter(
      (progress) => progress.status === "completed" && progress.masteryScore === 100,
    ).length,
    reviewsCompleted: 0,
  };

  return evaluateAchievements(seedContext, [], {
    now: new Date(0).toISOString(),
  }).map((achievement) => achievement.code);
}

export function readUnlockedAchievements(): string[] {
  return readJson(ACHIEVEMENTS_KEY, seedAchievements);
}

export function writeUnlockedAchievements(codes: string[]) {
  writeJson(ACHIEVEMENTS_KEY, codes);
}
