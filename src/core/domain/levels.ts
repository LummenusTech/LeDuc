import {
  XP_LEVEL_THRESHOLDS,
  XP_PER_LEVEL_BEYOND_TABLE,
} from "@/config/levels";

/**
 * Níveis a partir do XP acumulado (RN-X8).
 *
 * Como o XP é cumulativo e nunca decresce (RN-X1), o nível também nunca cai —
 * é uma propriedade da tabela ser monótona, não uma regra separada.
 */

export type LevelProgress = {
  level: number;
  /** XP já conquistado dentro do nível atual. */
  xpIntoLevel: number;
  /** XP necessário para fechar o nível atual. */
  xpForNextLevel: number;
  /** 0–100, para a barra de progresso. */
  percentToNextLevel: number;
};

/** Limiar de XP para atingir determinado nível (1 é o primeiro). */
export function thresholdForLevel(level: number): number {
  if (level <= 1) return 0;

  const index = level - 1;
  if (index < XP_LEVEL_THRESHOLDS.length) return XP_LEVEL_THRESHOLDS[index];

  const last = XP_LEVEL_THRESHOLDS[XP_LEVEL_THRESHOLDS.length - 1];
  const extraLevels = index - (XP_LEVEL_THRESHOLDS.length - 1);
  return last + extraLevels * XP_PER_LEVEL_BEYOND_TABLE;
}

export function levelForXp(xpTotal: number): number {
  const xp = Math.max(0, xpTotal);

  let level = 1;
  while (xp >= thresholdForLevel(level + 1)) {
    level += 1;
  }
  return level;
}

export function levelProgress(xpTotal: number): LevelProgress {
  const xp = Math.max(0, xpTotal);
  const level = levelForXp(xp);

  const current = thresholdForLevel(level);
  const next = thresholdForLevel(level + 1);

  const xpIntoLevel = xp - current;
  const xpForNextLevel = next - current;

  return {
    level,
    xpIntoLevel,
    xpForNextLevel,
    percentToNextLevel: Math.round((xpIntoLevel / xpForNextLevel) * 100),
  };
}
