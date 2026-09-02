/**
 * Fila de sincronização offline (RN-S1 a RN-S6).
 *
 * Conexão instável é premissa deste produto, não exceção. Toda escrita feita
 * sem rede entra aqui e sai apenas com confirmação do servidor — nada é
 * descartado por otimismo.
 *
 * As funções são puras: recebem a fila, devolvem uma fila nova. Quem persiste
 * (IndexedDB) e quem envia (HTTP) ficam fora do domínio.
 */

export type SyncMutationType =
  | "attempt_recorded"
  | "activity_completed"
  | "session_saved"
  | "xp_credited"
  | "achievement_unlocked"
  | "study_time_recorded";

export type SyncItemStatus = "pending" | "sending" | "failed";

export type SyncItem = {
  id: string;
  type: SyncMutationType;
  /**
   * Chave natural da mutação. Duas mutações com a mesma chave são a mesma
   * mutação — é o que impede a fila de creditar XP duas vezes depois de um
   * reenvio (RN-S3).
   */
  idempotencyKey: string;
  payload: unknown;
  createdAt: string;
  status: SyncItemStatus;
  attempts: number;
  lastError: string | null;
};

export const MAX_SYNC_ATTEMPTS = 5;
const BASE_BACKOFF_SECONDS = 2;
const MAX_BACKOFF_SECONDS = 300;

/**
 * Enfileira uma mutação.
 *
 * Se já existe uma pendente com a mesma chave, mantém a original em vez de
 * duplicar — o aluno pode ter tocado duas vezes, a interface pode ter
 * reenviado, e nenhum dos dois deve virar dois créditos.
 */
export function enqueue(
  queue: readonly SyncItem[],
  item: Omit<SyncItem, "status" | "attempts" | "lastError">,
): SyncItem[] {
  const exists = queue.some(
    (queued) =>
      queued.idempotencyKey === item.idempotencyKey && queued.status !== "failed",
  );
  if (exists) return [...queue];

  return [
    ...queue,
    { ...item, status: "pending", attempts: 0, lastError: null },
  ];
}

/**
 * Próximo lote a enviar, em ordem de criação.
 *
 * FIFO importa: concluir uma atividade depois de registrar as tentativas dela
 * é a única ordem que faz sentido no servidor (RN-S2).
 */
export function nextBatch(
  queue: readonly SyncItem[],
  limit = 10,
): SyncItem[] {
  return [...queue]
    .filter((item) => item.status === "pending")
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .slice(0, limit);
}

export function markSending(
  queue: readonly SyncItem[],
  id: string,
): SyncItem[] {
  return queue.map((item) =>
    item.id === id ? { ...item, status: "sending" as const } : item,
  );
}

/** Confirmado pelo servidor: só aqui o item sai da fila (RN-S5). */
export function markSent(queue: readonly SyncItem[], id: string): SyncItem[] {
  return queue.filter((item) => item.id !== id);
}

/**
 * Falha no envio.
 *
 * Volta para `pending` enquanto houver tentativas; esgotadas, vira `failed` —
 * e a interface **precisa** mostrar isso. Fila que falha em silêncio é perda de
 * dado disfarçada de sucesso (RN-S4).
 */
export function markFailed(
  queue: readonly SyncItem[],
  id: string,
  error: string,
): SyncItem[] {
  return queue.map((item) => {
    if (item.id !== id) return item;

    const attempts = item.attempts + 1;
    return {
      ...item,
      attempts,
      lastError: error,
      status: attempts >= MAX_SYNC_ATTEMPTS ? "failed" : "pending",
    };
  });
}

/** Espera antes da próxima tentativa: exponencial, com teto. */
export function backoffSeconds(attempts: number): number {
  const delay = BASE_BACKOFF_SECONDS * 2 ** Math.max(0, attempts - 1);
  return Math.min(delay, MAX_BACKOFF_SECONDS);
}

/** Itens que precisam de atenção do usuário. */
export function permanentFailures(queue: readonly SyncItem[]): SyncItem[] {
  return queue.filter((item) => item.status === "failed");
}

export function pendingCount(queue: readonly SyncItem[]): number {
  return queue.filter((item) => item.status !== "failed").length;
}

/* -------------------------------------------------------------------------- */
/* Chaves de idempotência                                                      */
/* -------------------------------------------------------------------------- */

export const idempotencyKeys = {
  attempt: (activityId: string, itemId: string, attemptNumber: number) =>
    `attempt:${activityId}:${itemId}:${attemptNumber}`,
  activityCompleted: (activityId: string) => `activity:${activityId}`,
  xp: (reason: string, refId: string) => `xp:${reason}:${refId}`,
  achievement: (code: string) => `achievement:${code}`,
  studyTime: (milestone: number) => `study-time:${milestone}`,
};
