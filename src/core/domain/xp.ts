import {
  XP_ACTIVITY_FLOOR,
  XP_ACTIVITY_REVIEW,
  XP_BY_DIFFICULTY,
  XP_TRACK_COMPLETION,
  type ItemDifficulty,
  type XpReason,
} from "@/config/xp-rules";

/**
 * Cálculo de XP. Funções puras — as mesmas rodarão no servidor quando ele
 * existir, com o servidor como autoridade final.
 *
 * Invariantes que os testes protegem: XP nunca é negativo, nunca decresce, e
 * conceder o mesmo marco duas vezes não gera pontos duplicados.
 */

export type ScoredItem = {
  difficulty: ItemDifficulty;
  /** Acerto na PRIMEIRA tentativa. Só ele vale XP de dificuldade. */
  correctOnFirstAttempt: boolean;
};

/**
 * XP de uma atividade concluída: soma da dificuldade dos itens acertados de
 * primeira, com piso. O piso é o que garante que errar tudo ainda avança —
 * o produto não tem punição.
 */
export function computeActivityXp(items: readonly ScoredItem[]): number {
  const earned = items.reduce(
    (total, item) =>
      item.correctOnFirstAttempt ? total + XP_BY_DIFFICULTY[item.difficulty] : total,
    0,
  );

  return Math.max(earned, XP_ACTIVITY_FLOOR);
}

export type MilestoneResult = {
  /** XP a creditar agora. Zero quando nenhum marco novo foi atingido. */
  xp: number;
  /** Novo valor a persistir como último marco pago. */
  milestone: number;
};

/**
 * Marcos repetíveis (sequência de dias, tempo de permanência).
 *
 * É idempotente por construção: o resultado depende de `lastPaidMilestone`, não
 * de quantas vezes a função é chamada. Isso é o que permite à fila offline
 * reenviar um evento sem creditar XP duas vezes.
 */
export function computeMilestoneXp(
  total: number,
  blockSize: number,
  reward: number,
  lastPaidMilestone: number,
): MilestoneResult {
  if (blockSize <= 0 || reward <= 0) {
    return { xp: 0, milestone: lastPaidMilestone };
  }

  const safeTotal = Math.max(0, total);
  const safeLastPaid = Math.max(0, lastPaidMilestone);
  const reached = Math.floor(safeTotal / blockSize);

  if (reached <= safeLastPaid) {
    return { xp: 0, milestone: safeLastPaid };
  }

  return {
    xp: (reached - safeLastPaid) * reward,
    milestone: reached,
  };
}

/** Desempenho da atividade, em %. Base do resumo final. */
export function computePerformancePercent(items: readonly ScoredItem[]): number {
  if (items.length === 0) return 0;

  const correct = items.filter((item) => item.correctOnFirstAttempt).length;
  return Math.round((correct / items.length) * 100);
}

/* -------------------------------------------------------------------------- */
/* Ledger                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Um crédito de XP antes de ser gravado.
 *
 * `(reason, refId)` é a chave de idempotência (RN-X7): é ela que permite à fila
 * offline reenviar um evento sem creditar duas vezes, e ao servidor recalcular
 * o ledger inteiro chegando ao mesmo total.
 */
export type XpEventDraft = {
  reason: XpReason;
  refId: string;
  amount: number;
};

export function buildActivityXpEvent(
  activityId: string,
  items: readonly ScoredItem[],
): XpEventDraft {
  return {
    reason: "activity_completed",
    refId: activityId,
    amount: computeActivityXp(items),
  };
}

/**
 * XP de revisão, limitado a uma vez por atividade por dia (RN-X4).
 *
 * O teto está embutido na chave: `refId` inclui o dia, então revisitar a mesma
 * atividade dez vezes numa tarde produz dez eventos idênticos que o ledger
 * conta como um. Sem isso, revisar em laço seria a forma mais rápida de subir
 * de nível — e a revisão deixaria de significar o que significa.
 */
export function buildReviewXpEvent(
  activityId: string,
  dayKey: string,
): XpEventDraft {
  return {
    reason: "activity_reviewed",
    refId: `${activityId}:${dayKey}`,
    amount: XP_ACTIVITY_REVIEW,
  };
}

export function buildTrackCompletionXpEvent(trackId: string): XpEventDraft {
  return {
    reason: "track_completed",
    refId: trackId,
    amount: XP_TRACK_COMPLETION,
  };
}

export function buildMilestoneXpEvent(
  reason: Extract<XpReason, "streak_milestone" | "study_time_milestone">,
  milestone: number,
  amount: number,
): XpEventDraft {
  return { reason, refId: `${milestone}`, amount };
}

/**
 * Soma o ledger descartando duplicatas por `(reason, refId)`.
 *
 * É aqui que a idempotência deixa de ser promessa e vira comportamento: o total
 * é o mesmo com um evento ou com dez cópias dele.
 */
export function sumXpLedger(events: readonly XpEventDraft[]): number {
  const seen = new Set<string>();
  let total = 0;

  for (const event of events) {
    const key = `${event.reason}:${event.refId}`;
    if (seen.has(key)) continue;

    seen.add(key);
    total += Math.max(0, event.amount);
  }

  return total;
}
