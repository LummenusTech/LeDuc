import {
  ACHIEVEMENTS,
  type AchievementContext,
  type AchievementDefinition,
} from "@/config/achievements";

/**
 * Motor de conquistas (RN-X9).
 *
 * Não sabe nada sobre conquista alguma: só aplica os predicados do catálogo.
 * Acrescentar uma conquista é editar `config/achievements.ts`.
 */

export type UnlockedAchievement = {
  code: string;
  unlockedAt: string;
};

/**
 * Devolve **apenas as conquistas novas**.
 *
 * Idempotente: reavaliar o mesmo contexto não produz nada, o que permite chamar
 * a função com liberdade — a cada atividade concluída, ao sincronizar, ao abrir
 * o app — sem risco de comemorar duas vezes a mesma coisa.
 */
export function evaluateAchievements(
  context: AchievementContext,
  alreadyUnlocked: readonly string[],
  { now }: { now: string },
): UnlockedAchievement[] {
  const known = new Set(alreadyUnlocked);

  return ACHIEVEMENTS.filter(
    (achievement) =>
      !known.has(achievement.code) && achievement.isUnlocked(context),
  ).map((achievement) => ({ code: achievement.code, unlockedAt: now }));
}

export function findAchievement(
  code: string,
): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((achievement) => achievement.code === code);
}

export type { AchievementContext, AchievementDefinition };
