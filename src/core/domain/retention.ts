import { MIN_ITEMS_FOR_RETENTION } from "@/config/activity-rules";

/**
 * Taxa de retenção (RN-R5, RN-R6).
 *
 * Definição fechada com o time: **acerto na primeira tentativa dentro de
 * sessões de revisão**. É o único sentido em que a métrica mede retenção de
 * fato — o que ficou depois de um tempo, e não o que foi aprendido na hora.
 * Por isso ela lê apenas tentativas marcadas como revisão, e não o histórico
 * inteiro, que mediria aprendizado inicial.
 */

export type ReviewAttempt = {
  itemId: string;
  /** Só a primeira tentativa de cada item conta. */
  attemptNumber: number;
  isCorrect: boolean;
};

/**
 * Devolve a taxa em %, ou `null` quando a amostra é pequena demais.
 *
 * O `null` é a regra R6 imposta pelo tipo: quem for exibir é obrigado pelo
 * compilador a tratar o caso. Uma porcentagem tirada de duas respostas parece
 * informação e é ruído — e este número vai para a tela do professor.
 */
export function computeRetentionRate(
  attempts: readonly ReviewAttempt[],
): number | null {
  const firstAttempts = new Map<string, boolean>();

  for (const attempt of attempts) {
    if (attempt.attemptNumber !== 1) continue;
    if (firstAttempts.has(attempt.itemId)) continue;
    firstAttempts.set(attempt.itemId, attempt.isCorrect);
  }

  if (firstAttempts.size < MIN_ITEMS_FOR_RETENTION) return null;

  const correct = [...firstAttempts.values()].filter(Boolean).length;
  return Math.round((correct / firstAttempts.size) * 100);
}

/** Rótulo pronto para a interface, já com o caso de amostra insuficiente. */
export function formatRetentionRate(rate: number | null): string {
  return rate === null ? "—" : `${rate}%`;
}
