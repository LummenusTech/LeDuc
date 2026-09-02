import { MAX_ATTEMPTS_PER_ITEM } from "@/config/activity-rules";
import type { GradeOutcome } from "@/core/domain/grading";
import { computeActivityXp, computePerformancePercent } from "@/core/domain/xp";
import type { Item } from "@/core/domain/types";

/**
 * Máquina de estados da atividade (RN-A1 a RN-A8).
 *
 * É onde o aluno passa o tempo, e por isso é o módulo com mais regras. Todas as
 * transições são puras: recebem a sessão, devolvem uma sessão nova. Nada de
 * mutação, nada de `Date.now()` — o instante entra por parâmetro, senão os
 * testes não seriam reprodutíveis e o cálculo de duração dependeria do relógio
 * do aparelho.
 */

export type ItemResolution =
  /** Acertou. */
  | "correct"
  /** Esgotou as tentativas; o app revelou a resposta (RN-A1). */
  | "revealed"
  /** Resposta curta respondida sem rede, à espera de correção (RN-G5). */
  | "pending_review";

export type ItemState = {
  itemId: string;
  attempts: number;
  /**
   * Se acertou na PRIMEIRA tentativa. `null` enquanto não há resposta ou
   * enquanto a correção está pendente — é o que sustenta domínio e XP de item.
   */
  firstAttemptCorrect: boolean | null;
  resolution: ItemResolution | null;
};

export type ActivitySession = {
  activityId: string;
  /** Uma revisão não altera domínio e paga XP diferente (RN-R5, RN-X4). */
  isReview: boolean;
  startedAt: string;
  completedAt: string | null;
  items: ItemState[];
};

export type ActivitySummary = {
  xpEarned: number;
  performancePercent: number;
  durationSeconds: number;
  correctOnFirstTry: number;
  totalItems: number;
  pendingReview: number;
};

/* -------------------------------------------------------------------------- */
/* Construção e retomada                                                       */
/* -------------------------------------------------------------------------- */

export function startSession(
  activityId: string,
  items: readonly Item[],
  { startedAt, isReview = false }: { startedAt: string; isReview?: boolean },
): ActivitySession {
  return {
    activityId,
    isReview,
    startedAt,
    completedAt: null,
    items: items.map((item) => ({
      itemId: item.id,
      attempts: 0,
      firstAttemptCorrect: null,
      resolution: null,
    })),
  };
}

/**
 * Retoma uma sessão salva, conciliando com os itens atuais da atividade.
 *
 * O conteúdo pode ter ganhado uma versão nova enquanto o aluno estava fora
 * (RN-W3). Itens que sumiram são descartados; itens novos entram por responder.
 * O que o aluno já respondeu é preservado — sair não apaga tentativa (RN-A8).
 */
export function resumeSession(
  saved: ActivitySession,
  items: readonly Item[],
): ActivitySession {
  const savedById = new Map(saved.items.map((state) => [state.itemId, state]));

  return {
    ...saved,
    items: items.map(
      (item) =>
        savedById.get(item.id) ?? {
          itemId: item.id,
          attempts: 0,
          firstAttemptCorrect: null,
          resolution: null,
        },
    ),
  };
}

/* -------------------------------------------------------------------------- */
/* Consultas                                                                   */
/* -------------------------------------------------------------------------- */

function findState(
  session: ActivitySession,
  itemId: string,
): ItemState | undefined {
  return session.items.find((state) => state.itemId === itemId);
}

export function isItemResolved(state: ItemState): boolean {
  return state.resolution !== null;
}

/** Índice do primeiro item não resolvido. `null` quando a atividade acabou. */
export function nextItemIndex(session: ActivitySession): number | null {
  const index = session.items.findIndex((state) => !isItemResolved(state));
  return index === -1 ? null : index;
}

export function isSessionComplete(session: ActivitySession): boolean {
  return session.items.every(isItemResolved);
}

/** Tentativas restantes antes de o app revelar a resposta (RN-A1). */
export function attemptsRemaining(state: ItemState): number {
  return Math.max(0, MAX_ATTEMPTS_PER_ITEM - state.attempts);
}

/* -------------------------------------------------------------------------- */
/* Transições                                                                  */
/* -------------------------------------------------------------------------- */

function replaceItem(
  session: ActivitySession,
  itemId: string,
  update: (state: ItemState) => ItemState,
): ActivitySession {
  return {
    ...session,
    items: session.items.map((state) =>
      state.itemId === itemId ? update(state) : state,
    ),
  };
}

/**
 * Registra uma resposta corrigida.
 *
 * Um item já resolvido é ignorado (RN-A5): reenviar não deve poder reescrever
 * um resultado, nem por bug de interface nem por reenvio da fila offline.
 */
export function submitAnswer(
  session: ActivitySession,
  itemId: string,
  outcome: GradeOutcome,
): ActivitySession {
  const current = findState(session, itemId);
  if (!current || isItemResolved(current)) return session;

  return replaceItem(session, itemId, (state) => {
    const attempts = state.attempts + 1;
    const isFirstAttempt = attempts === 1;

    if (outcome.status === "pending_review") {
      return {
        ...state,
        attempts,
        // Fica `null` de propósito: pendente não conta como acerto nem como
        // erro no domínio até a IA responder (RN-D4).
        firstAttemptCorrect: null,
        resolution: "pending_review",
      };
    }

    const firstAttemptCorrect = isFirstAttempt
      ? outcome.status === "correct"
      : state.firstAttemptCorrect;

    if (outcome.status === "correct") {
      return { ...state, attempts, firstAttemptCorrect, resolution: "correct" };
    }

    // Errou. Esgotadas as tentativas, o app revela e avança (RN-A1) — ninguém
    // fica preso num item.
    const exhausted = attempts >= MAX_ATTEMPTS_PER_ITEM;
    return {
      ...state,
      attempts,
      firstAttemptCorrect,
      resolution: exhausted ? "revealed" : null,
    };
  });
}

/**
 * Correção da resposta curta que chegou depois (RN-G6).
 *
 * Só age sobre um item pendente, e apenas uma vez. Se acertou na primeira
 * tentativa, o domínio e o XP passam a valer retroativamente — XP adiado,
 * nunca perdido.
 */
export function resolvePendingReview(
  session: ActivitySession,
  itemId: string,
  isCorrect: boolean,
): ActivitySession {
  const current = findState(session, itemId);
  if (!current || current.resolution !== "pending_review") return session;

  return replaceItem(session, itemId, (state) => ({
    ...state,
    firstAttemptCorrect: state.attempts === 1 ? isCorrect : false,
    resolution: isCorrect ? "correct" : "revealed",
  }));
}

/** Fecha a atividade. Exige todos os itens resolvidos (RN-A6). */
export function completeSession(
  session: ActivitySession,
  completedAt: string,
): ActivitySession {
  if (!isSessionComplete(session)) return session;
  if (session.completedAt) return session;

  return { ...session, completedAt };
}

/* -------------------------------------------------------------------------- */
/* Resumo final                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Números da tela de resultado: XP, duração e desempenho (RN-A2, RN-X2, RN-X3).
 *
 * Itens pendentes ficam fora do desempenho — mostrar 0% para quem respondeu
 * offline seria informar um fracasso que não aconteceu.
 */
export function summarizeSession(
  session: ActivitySession,
  items: readonly Item[],
  { endedAt }: { endedAt: string },
): ActivitySummary {
  const itemsById = new Map(items.map((item) => [item.id, item]));

  const scored = session.items
    .filter((state) => state.resolution !== "pending_review")
    .map((state) => {
      const item = itemsById.get(state.itemId);
      if (!item) {
        throw new Error(`Item "${state.itemId}" não pertence à atividade.`);
      }
      return {
        difficulty: item.difficulty,
        correctOnFirstAttempt: state.firstAttemptCorrect === true,
      };
    });

  const durationSeconds = Math.max(
    0,
    Math.round(
      (new Date(endedAt).getTime() - new Date(session.startedAt).getTime()) /
        1000,
    ),
  );

  return {
    xpEarned: computeActivityXp(scored),
    performancePercent: computePerformancePercent(scored),
    durationSeconds,
    correctOnFirstTry: scored.filter((item) => item.correctOnFirstAttempt)
      .length,
    totalItems: session.items.length,
    pendingReview: session.items.filter(
      (state) => state.resolution === "pending_review",
    ).length,
  };
}
