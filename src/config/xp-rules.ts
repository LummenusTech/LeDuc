/**
 * Tabela de regras de XP.
 *
 * Todo valor de gamificação vive aqui. As funções que os aplicam ficam em
 * `src/core/domain/xp.ts`, puras e testadas — quando o backend existir, são
 * essas mesmas funções que rodam no servidor, lendo esta mesma tabela.
 *
 * Princípios do produto: sem vidas, sem XP negativo, sem perda de XP.
 */

export type ItemDifficulty = "easy" | "medium" | "hard";

export const XP_BY_DIFFICULTY: Record<ItemDifficulty, number> = {
  easy: 5,
  medium: 10,
  hard: 15,
};

/**
 * Piso da atividade concluída. Quem erra todos os itens ainda recebe isto —
 * é o que sustenta o princípio de "nenhum limitante".
 */
export const XP_ACTIVITY_FLOOR = 5;

export const XP_ACTIVITY_REVIEW = 15;

export const XP_TRACK_COMPLETION = 50;

/**
 * Marcos repetíveis: a cada bloco atingido, concede o valor de novo.
 * Repetíveis exigem registrar o último marco pago, senão o mesmo marco é
 * concedido a cada avaliação — ver `computeMilestoneXp`.
 */
export const XP_STREAK_MILESTONE = {
  /** A cada 10 dias consecutivos de acesso. */
  blockSize: 10,
  reward: 10,
} as const;

export const XP_STUDY_TIME_MILESTONE = {
  /** A cada 30 minutos acumulados no aplicativo. */
  blockSizeMinutes: 30,
  reward: 10,
} as const;

/** Motivos de crédito no ledger. Também compõem a chave de idempotência. */
export const XP_REASONS = [
  "activity_completed",
  "activity_reviewed",
  "track_completed",
  "streak_milestone",
  "study_time_milestone",
] as const;

export type XpReason = (typeof XP_REASONS)[number];

export const XP_REASON_LABELS: Record<XpReason, string> = {
  activity_completed: "Atividade concluída",
  activity_reviewed: "Revisão de atividade",
  track_completed: "Trilha concluída",
  streak_milestone: "Sequência de dias",
  study_time_milestone: "Tempo de estudo",
};
