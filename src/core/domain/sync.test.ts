import { describe, expect, it } from "vitest";

import {
  MAX_SYNC_ATTEMPTS,
  backoffSeconds,
  enqueue,
  idempotencyKeys,
  markFailed,
  markSending,
  markSent,
  nextBatch,
  pendingCount,
  permanentFailures,
  type SyncItem,
} from "@/core/domain/sync";

function draft(
  id: string,
  createdAt: string,
  idempotencyKey = `key-${id}`,
): Omit<SyncItem, "status" | "attempts" | "lastError"> {
  return {
    id,
    type: "attempt_recorded",
    idempotencyKey,
    payload: {},
    createdAt,
  };
}

describe("enqueue", () => {
  it("acrescenta como pendente", () => {
    const queue = enqueue([], draft("1", "2026-03-10T10:00:00.000Z"));

    expect(queue).toHaveLength(1);
    expect(queue[0].status).toBe("pending");
    expect(queue[0].attempts).toBe(0);
  });

  it("não duplica mutação com a mesma chave", () => {
    let queue = enqueue([], draft("1", "2026-03-10T10:00:00.000Z", "mesma"));
    queue = enqueue(queue, draft("2", "2026-03-10T10:00:01.000Z", "mesma"));

    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe("1");
  });

  it("aceita chaves diferentes", () => {
    let queue = enqueue([], draft("1", "2026-03-10T10:00:00.000Z", "a"));
    queue = enqueue(queue, draft("2", "2026-03-10T10:00:01.000Z", "b"));

    expect(queue).toHaveLength(2);
  });
});

describe("nextBatch", () => {
  it("respeita a ordem de criação", () => {
    let queue = enqueue([], draft("tarde", "2026-03-10T10:05:00.000Z"));
    queue = enqueue(queue, draft("cedo", "2026-03-10T10:00:00.000Z"));

    expect(nextBatch(queue).map((item) => item.id)).toEqual(["cedo", "tarde"]);
  });

  it("ignora o que já está enviando", () => {
    let queue = enqueue([], draft("1", "2026-03-10T10:00:00.000Z"));
    queue = enqueue(queue, draft("2", "2026-03-10T10:01:00.000Z"));
    queue = markSending(queue, "1");

    expect(nextBatch(queue).map((item) => item.id)).toEqual(["2"]);
  });

  it("respeita o limite do lote", () => {
    let queue: SyncItem[] = [];
    for (let i = 0; i < 20; i += 1) {
      queue = enqueue(queue, draft(`${i}`, `2026-03-10T10:00:${`${i}`.padStart(2, "0")}.000Z`));
    }

    expect(nextBatch(queue, 5)).toHaveLength(5);
  });
});

describe("markSent", () => {
  it("remove da fila só com confirmação", () => {
    const queue = enqueue([], draft("1", "2026-03-10T10:00:00.000Z"));
    expect(markSent(queue, "1")).toHaveLength(0);
  });
});

describe("markFailed", () => {
  it("devolve para pendente enquanto há tentativas", () => {
    let queue = enqueue([], draft("1", "2026-03-10T10:00:00.000Z"));
    queue = markFailed(queue, "1", "timeout");

    expect(queue[0].status).toBe("pending");
    expect(queue[0].attempts).toBe(1);
    expect(queue[0].lastError).toBe("timeout");
  });

  it("marca falha permanente ao esgotar as tentativas", () => {
    let queue = enqueue([], draft("1", "2026-03-10T10:00:00.000Z"));
    for (let i = 0; i < MAX_SYNC_ATTEMPTS; i += 1) {
      queue = markFailed(queue, "1", "erro");
    }

    expect(queue[0].status).toBe("failed");
    // A interface precisa poder avisar: falha silenciosa é perda de dado.
    expect(permanentFailures(queue)).toHaveLength(1);
  });

  it("item com falha permanente sai do lote de envio", () => {
    let queue = enqueue([], draft("1", "2026-03-10T10:00:00.000Z"));
    for (let i = 0; i < MAX_SYNC_ATTEMPTS; i += 1) {
      queue = markFailed(queue, "1", "erro");
    }

    expect(nextBatch(queue)).toHaveLength(0);
    expect(pendingCount(queue)).toBe(0);
  });

  it("permite reenfileirar depois de uma falha permanente", () => {
    let queue = enqueue([], draft("1", "2026-03-10T10:00:00.000Z", "k"));
    for (let i = 0; i < MAX_SYNC_ATTEMPTS; i += 1) {
      queue = markFailed(queue, "1", "erro");
    }
    queue = enqueue(queue, draft("2", "2026-03-10T11:00:00.000Z", "k"));

    expect(queue).toHaveLength(2);
    expect(nextBatch(queue).map((item) => item.id)).toEqual(["2"]);
  });
});

describe("backoffSeconds", () => {
  it("cresce exponencialmente", () => {
    expect(backoffSeconds(1)).toBe(2);
    expect(backoffSeconds(2)).toBe(4);
    expect(backoffSeconds(3)).toBe(8);
  });

  it("tem teto", () => {
    expect(backoffSeconds(50)).toBe(300);
  });
});

describe("idempotencyKeys", () => {
  it("distingue tentativas do mesmo item", () => {
    expect(idempotencyKeys.attempt("a1", "i1", 1)).not.toBe(
      idempotencyKeys.attempt("a1", "i1", 2),
    );
  });

  it("é estável para a mesma mutação", () => {
    expect(idempotencyKeys.xp("activity_completed", "a1")).toBe(
      idempotencyKeys.xp("activity_completed", "a1"),
    );
  });
});
