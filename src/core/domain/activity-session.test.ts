import { describe, expect, it } from "vitest";

import { MAX_ATTEMPTS_PER_ITEM } from "@/config/activity-rules";
import { XP_ACTIVITY_FLOOR } from "@/config/xp-rules";
import {
  attemptsRemaining,
  completeSession,
  isSessionComplete,
  nextItemIndex,
  resolvePendingReview,
  resumeSession,
  startSession,
  submitAnswer,
  summarizeSession,
  toAttempts,
} from "@/core/domain/activity-session";
import type { GradeOutcome } from "@/core/domain/grading";
import type { Item, ItemDifficulty } from "@/core/domain/types";

const START = "2026-03-10T10:00:00.000Z";
const END = "2026-03-10T10:05:00.000Z";

/** Gera um horário N minutos depois de START, para tentativas em sequência. */
function at(minutesAfterStart: number): string {
  return new Date(
    new Date(START).getTime() + minutesAfterStart * 60_000,
  ).toISOString();
}

const correct: GradeOutcome = { status: "correct", explanation: "ok" };
const incorrect: GradeOutcome = { status: "incorrect", explanation: "não" };
const pending: GradeOutcome = { status: "pending_review", message: "depois" };

function item(id: string, difficulty: ItemDifficulty = "easy"): Item {
  return {
    id,
    activityId: "a1",
    type: "multiple_choice",
    difficulty,
    prompt: id,
    explanation: "ok",
    ignoreAccents: true,
    content: { options: [{ id: "o1", label: "A" }], correctOptionId: "o1" },
  };
}

const items = [item("i1"), item("i2", "medium"), item("i3", "hard")];

function fresh() {
  return startSession("a1", items, { startedAt: START });
}

describe("startSession", () => {
  it("começa com todos os itens por resolver", () => {
    const session = fresh();

    expect(session.items).toHaveLength(3);
    expect(nextItemIndex(session)).toBe(0);
    expect(isSessionComplete(session)).toBe(false);
  });
});

describe("submitAnswer", () => {
  it("resolve o item ao acertar e avança", () => {
    const session = submitAnswer(fresh(), "i1", correct, at(1));

    expect(session.items[0].resolution).toBe("correct");
    expect(session.items[0].firstAttemptCorrect).toBe(true);
    expect(session.items[0].answeredAt).toBe(at(1));
    expect(nextItemIndex(session)).toBe(1);
  });

  it("errar não resolve o item: devolve para nova tentativa", () => {
    const session = submitAnswer(fresh(), "i1", incorrect, at(1));

    expect(session.items[0].resolution).toBeNull();
    expect(session.items[0].attempts).toBe(1);
    expect(nextItemIndex(session)).toBe(0);
    expect(attemptsRemaining(session.items[0])).toBe(MAX_ATTEMPTS_PER_ITEM - 1);
  });

  it("revela a resposta ao esgotar as tentativas", () => {
    let session = fresh();
    for (let i = 0; i < MAX_ATTEMPTS_PER_ITEM; i += 1) {
      session = submitAnswer(session, "i1", incorrect, at(i + 1));
    }

    expect(session.items[0].resolution).toBe("revealed");
    expect(attemptsRemaining(session.items[0])).toBe(0);
    expect(nextItemIndex(session)).toBe(1);
  });

  it("acertar na segunda tentativa resolve, mas não conta como domínio", () => {
    let session = submitAnswer(fresh(), "i1", incorrect, at(1));
    session = submitAnswer(session, "i1", correct, at(2));

    expect(session.items[0].resolution).toBe("correct");
    expect(session.items[0].firstAttemptCorrect).toBe(false);
  });

  it("guarda o horário da PRIMEIRA tentativa, não da que resolveu", () => {
    let session = submitAnswer(fresh(), "i1", incorrect, at(1));
    session = submitAnswer(session, "i1", correct, at(2));

    expect(session.items[0].answeredAt).toBe(at(1));
  });

  it("ignora resposta para item já resolvido", () => {
    const resolved = submitAnswer(fresh(), "i1", correct, at(1));
    const again = submitAnswer(resolved, "i1", incorrect, at(2));

    expect(again).toBe(resolved);
  });

  it("ignora item que não pertence à atividade", () => {
    const session = fresh();
    expect(submitAnswer(session, "inexistente", correct, at(1))).toBe(session);
  });
});

describe("resposta curta sem rede", () => {
  it("fica pendente, sem contar como acerto nem como erro", () => {
    const session = submitAnswer(fresh(), "i1", pending, at(1));

    expect(session.items[0].resolution).toBe("pending_review");
    expect(session.items[0].firstAttemptCorrect).toBeNull();
  });

  it("não impede concluir a atividade", () => {
    let session = submitAnswer(fresh(), "i1", pending, at(1));
    session = submitAnswer(session, "i2", correct, at(2));
    session = submitAnswer(session, "i3", correct, at(3));

    expect(isSessionComplete(session)).toBe(true);
  });

  it("a correção posterior credita domínio quando foi na 1ª tentativa", () => {
    let session = submitAnswer(fresh(), "i1", pending, at(1));
    session = resolvePendingReview(session, "i1", true);

    expect(session.items[0].resolution).toBe("correct");
    expect(session.items[0].firstAttemptCorrect).toBe(true);
  });

  it("a correção posterior negativa marca como revelado", () => {
    let session = submitAnswer(fresh(), "i1", pending, at(1));
    session = resolvePendingReview(session, "i1", false);

    expect(session.items[0].resolution).toBe("revealed");
    expect(session.items[0].firstAttemptCorrect).toBe(false);
  });

  it("só age uma vez — reenvio da fila offline não reescreve o resultado", () => {
    let session = submitAnswer(fresh(), "i1", pending, at(1));
    session = resolvePendingReview(session, "i1", true);
    const replayed = resolvePendingReview(session, "i1", false);

    expect(replayed).toBe(session);
  });
});

describe("retomada", () => {
  it("volta no primeiro item não resolvido", () => {
    let session = submitAnswer(fresh(), "i1", correct, at(1));
    session = submitAnswer(session, "i2", incorrect, at(2));

    const resumed = resumeSession(session, items);

    expect(nextItemIndex(resumed)).toBe(1);
    expect(resumed.items[1].attempts).toBe(1);
  });

  it("sair e voltar não apaga a tentativa já feita", () => {
    const session = submitAnswer(fresh(), "i1", incorrect, at(1));
    const resumed = resumeSession(session, items);

    expect(resumed.items[0].attempts).toBe(1);
    expect(resumed.items[0].firstAttemptCorrect).toBe(false);
  });

  it("aceita item novo de uma versão publicada depois", () => {
    const session = submitAnswer(fresh(), "i1", correct, at(1));
    const resumed = resumeSession(session, [...items, item("i4")]);

    expect(resumed.items).toHaveLength(4);
    expect(resumed.items[3].resolution).toBeNull();
    expect(resumed.items[0].resolution).toBe("correct");
  });

  it("descarta item que saiu do conteúdo", () => {
    const session = submitAnswer(fresh(), "i1", correct, at(1));
    const resumed = resumeSession(session, [items[0], items[1]]);

    expect(resumed.items).toHaveLength(2);
  });
});

describe("completeSession", () => {
  it("não fecha com item pendente de resposta", () => {
    const session = submitAnswer(fresh(), "i1", correct, at(1));
    expect(completeSession(session, END).completedAt).toBeNull();
  });

  it("fecha quando tudo está resolvido", () => {
    let session = fresh();
    for (const [index, it] of items.entries()) {
      session = submitAnswer(session, it.id, correct, at(index + 1));
    }

    expect(completeSession(session, END).completedAt).toBe(END);
  });

  it("não reabre nem remarca uma atividade já fechada", () => {
    let session = fresh();
    for (const [index, it] of items.entries()) {
      session = submitAnswer(session, it.id, correct, at(index + 1));
    }
    const closed = completeSession(session, END);

    expect(completeSession(closed, "2026-03-11T00:00:00.000Z")).toBe(closed);
  });
});

describe("summarizeSession", () => {
  it("soma o XP dos acertos de primeira e mede o desempenho", () => {
    let session = fresh();
    session = submitAnswer(session, "i1", correct, at(1)); // fácil, +5
    session = submitAnswer(session, "i2", correct, at(2)); // médio, +10
    session = submitAnswer(session, "i3", incorrect, at(3));
    session = submitAnswer(session, "i3", correct, at(4)); // 2ª tentativa: sem XP

    const summary = summarizeSession(session, items, { endedAt: END });

    expect(summary.xpEarned).toBe(15);
    expect(summary.correctOnFirstTry).toBe(2);
    expect(summary.performancePercent).toBe(67);
    expect(summary.durationSeconds).toBe(300);
  });

  it("aplica o piso quando o aluno erra tudo", () => {
    let session = fresh();
    for (const it of items) {
      for (let i = 0; i < MAX_ATTEMPTS_PER_ITEM; i += 1) {
        session = submitAnswer(session, it.id, incorrect, at(i + 1));
      }
    }

    const summary = summarizeSession(session, items, { endedAt: END });

    expect(summary.xpEarned).toBe(XP_ACTIVITY_FLOOR);
    expect(summary.performancePercent).toBe(0);
  });

  it("deixa o item pendente fora do desempenho", () => {
    let session = submitAnswer(fresh(), "i1", correct, at(1));
    session = submitAnswer(session, "i2", correct, at(2));
    session = submitAnswer(session, "i3", pending, at(3));

    const summary = summarizeSession(session, items, { endedAt: END });

    // 2 de 2 corrigidos, e não 2 de 3: o pendente ainda não é um fracasso.
    expect(summary.performancePercent).toBe(100);
    expect(summary.pendingReview).toBe(1);
    expect(summary.totalItems).toBe(3);
  });

  it("RN-G6: corrigir um pendente como certo credita o XP dele no resumo", () => {
    let session = submitAnswer(fresh(), "i1", pending, at(1)); // fácil, pendente
    session = submitAnswer(session, "i2", correct, at(2)); // médio, +10
    session = submitAnswer(session, "i3", correct, at(3)); // difícil, +15

    const beforeCorrection = summarizeSession(session, items, { endedAt: END });
    expect(beforeCorrection.xpEarned).toBe(25); // i1 ainda não conta

    session = resolvePendingReview(session, "i1", true);
    const afterCorrection = summarizeSession(session, items, { endedAt: END });

    // +5 do item fácil, creditado depois — XP adiado, nunca perdido.
    expect(afterCorrection.xpEarned).toBe(30);
  });
});

describe("toAttempts", () => {
  it("RN-D1/RN-D3: reconstrói só a primeira tentativa de cada item resolvido", () => {
    let session = submitAnswer(fresh(), "i1", correct, at(1));
    session = submitAnswer(session, "i2", incorrect, at(2)); // erra, sobra tentativa
    session = submitAnswer(session, "i2", correct, at(3)); // acerta na 2ª

    const attempts = toAttempts(session);

    expect(attempts).toHaveLength(2);
    expect(attempts.find((a) => a.itemId === "i1")).toMatchObject({
      isCorrect: true,
      attemptNumber: 1,
      answeredAt: at(1),
    });
    // RN-D1: só a primeira tentativa conta — i2 acertou na 2ª, então é erro.
    expect(attempts.find((a) => a.itemId === "i2")).toMatchObject({
      isCorrect: false,
      attemptNumber: 1,
      answeredAt: at(2),
    });
  });

  it("RN-D3: item revelado conta como erro na 1ª tentativa", () => {
    let session = fresh();
    for (let i = 0; i < MAX_ATTEMPTS_PER_ITEM; i += 1) {
      session = submitAnswer(session, "i1", incorrect, at(i + 1));
    }

    const attempts = toAttempts(session);
    expect(attempts.find((a) => a.itemId === "i1")?.isCorrect).toBe(false);
  });

  it("RN-D4: item pendente fica fora até ser corrigido", () => {
    const session = submitAnswer(fresh(), "i1", pending, at(1));
    expect(toAttempts(session)).toHaveLength(0);
  });

  it("RN-D4: depois de corrigido, entra no cálculo com o horário original", () => {
    let session = submitAnswer(fresh(), "i1", pending, at(1));
    session = resolvePendingReview(session, "i1", true);

    const attempts = toAttempts(session);
    expect(attempts).toEqual([
      expect.objectContaining({
        itemId: "i1",
        isCorrect: true,
        answeredAt: at(1),
      }),
    ]);
  });

  it("item ainda não respondido não vira tentativa", () => {
    const session = fresh();
    expect(toAttempts(session)).toHaveLength(0);
  });
});
