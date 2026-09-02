import type { Attempt } from "@/core/domain/types";

/**
 * Domínio é medido pela PRIMEIRA tentativa.
 *
 * Essa é a regra que dá validade à métrica que o professor vê: se revisitar uma
 * lição pudesse elevar o domínio, o número deixaria de dizer o que o aluno sabe
 * e passaria a dizer quantas vezes ele repetiu. Por isso o cálculo descarta toda
 * tentativa a partir da segunda, e revisitas nunca sobrescrevem o resultado.
 */

/** Mantém, para cada item, apenas a primeira tentativa registrada. */
export function selectFirstAttempts(attempts: readonly Attempt[]): Attempt[] {
  const firstByItem = new Map<string, Attempt>();

  for (const attempt of attempts) {
    if (attempt.attemptNumber !== 1) continue;

    const existing = firstByItem.get(attempt.itemId);
    if (!existing || attempt.answeredAt < existing.answeredAt) {
      firstByItem.set(attempt.itemId, attempt);
    }
  }

  return [...firstByItem.values()];
}

/** Percentual de acerto na primeira tentativa. 0–100. */
export function computeMasteryScore(attempts: readonly Attempt[]): number {
  const firstAttempts = selectFirstAttempts(attempts);
  if (firstAttempts.length === 0) return 0;

  const correct = firstAttempts.filter((attempt) => attempt.isCorrect).length;
  return Math.round((correct / firstAttempts.length) * 100);
}

/**
 * Domínio registrado nunca é sobrescrito por uma revisita — só o primeiro
 * resultado conta. Existe para deixar a regra explícita no ponto onde o
 * progresso é atualizado, em vez de depender de quem chama lembrar dela.
 */
export function reconcileMasteryScore(
  storedScore: number | null,
  incomingScore: number,
): number {
  return storedScore ?? incomingScore;
}
