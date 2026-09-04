# Fechamento de Gaps do Domínio (RN-P5/P6/P7, RN-D3/D4, RN-G6) — Plano de Implementação

> **Para quem for executar:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa por tarefa. Os passos usam checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** Fechar os gaps reais encontrados numa auditoria de `core/domain`/`core/data` contra a
especificação `docs/leduc-logica-regras-de-negocio.md` (colada pelo usuário) — RN-P5, RN-P6, RN-P7,
RN-D3, RN-D4, RN-G6 e uma cobertura de teste faltante em `permissions.ts` e `errors.ts`.

**Contexto:** L1–L8 do plano de lógica já estavam praticamente inteiros no repositório antes deste
plano (207 testes, `core/domain` limpo de React/fetch/localStorage/Date.now). A auditoria achou 6
gaps reais, todos contidos em `core/domain` e `core/data/mock`. Três gaps maiores do catálogo
(RN-W4 — versionamento de conteúdo, RN-G7 — revisão do professor sobre nota de IA, RN-S6 — conflito
de sync) ficaram **fora deste plano por decisão do usuário**: nenhum dos três tem tela ou fluxo
consumidor ainda, e construir a primitiva sem quem a chame é código morto.

**Arquitetura:** Nenhuma tela nova. Todo trabalho é função pura em `core/domain` + o glue já
existente em `core/data/mock/index.ts`. Segue a "regra de ouro" do projeto: decisão de negócio só
em `core/domain`; nada de `Date.now()` lá dentro — o instante sempre entra por parâmetro.

**Tech Stack:** TypeScript, Vitest, sem dependências novas.

**Spec:** especificação colada pelo usuário no chat em 2026-09-02 (não há arquivo — as regras RN-xx
citadas em cada tarefa vêm de lá).

## Global Constraints

- `core/domain/**` nunca importa React, `next/*`, não faz `fetch`, não lê `localStorage`, não chama
  `Date.now()` — todo instante entra por parâmetro (`now`, `startedAt`, `endedAt`).
- Nenhum literal de regra de negócio solto no código — vem de `config/`.
- Toda regra RN-xx tocada por este plano vira, no mínimo, um caso de teste nomeado com o código da
  regra no `it(...)`.
- `npm run typecheck`, `npm run lint` e `npm run test` (vitest) precisam ficar limpos a cada tarefa.

---

## Task 1: RN-P5 / RN-P6 — conclusão de lição e de trilha

Hoje `unlock-rules.ts` só calcula *percentual* de progresso da trilha (`computeTrackProgress`) e
nada agrega conclusão de atividades em conclusão de lição. Faltam as duas funções booleanas que a
regra pede.

**Files:**
- Modify: `src/core/domain/unlock-rules.ts`
- Test: `src/core/domain/unlock-rules.test.ts`

**Interfaces:**
- Consumes: `Activity`, `Lesson`, `LessonProgress` de `@/core/domain/types` (já existentes, sem
  mudança).
- Produces: `isLessonComplete(activities, completedActivityIds): boolean` e
  `isTrackComplete(lessons, progress): boolean`, exportadas de `@/core/domain/unlock-rules` — a
  serem consumidas depois por quem grava `LessonProgress.status = "completed"` e por
  `content-workflow`/telas de progresso.

- [ ] **Step 1: Escrever os testes que falham**

No topo de `src/core/domain/unlock-rules.test.ts`, trocar as duas linhas de import existentes:

```ts
import type { Lesson, LessonProgress } from "@/core/domain/types";
import {
  computeTrackProgress,
  findResumeLesson,
  isLessonUnlocked,
  resolveLessonStatuses,
} from "@/core/domain/unlock-rules";
```

por:

```ts
import type { Activity, Lesson, LessonProgress } from "@/core/domain/types";
import {
  computeTrackProgress,
  findResumeLesson,
  isLessonComplete,
  isLessonUnlocked,
  isTrackComplete,
  resolveLessonStatuses,
} from "@/core/domain/unlock-rules";
```

Depois, acrescentar ao final do arquivo (usa `lesson(...)`, `lessons` e `completed(...)` já
definidos no topo do arquivo; precisa de um novo helper `activity(...)`):

```ts
const activity = (id: string, orderIndex: number): Activity => ({
  id,
  lessonId: "l1",
  title: `Atividade ${orderIndex + 1}`,
  orderIndex,
});

describe("isLessonComplete", () => {
  const activities = [activity("a1", 0), activity("a2", 1)];

  it("RN-P5: concluída quando toda atividade está concluída", () => {
    const completed = new Set(["a1", "a2"]);
    expect(isLessonComplete(activities, completed)).toBe(true);
  });

  it("RN-P5: não concluída enquanto falta uma atividade", () => {
    const completed = new Set(["a1"]);
    expect(isLessonComplete(activities, completed)).toBe(false);
  });

  it("uma lição sem atividades nunca está concluída", () => {
    expect(isLessonComplete([], new Set())).toBe(false);
  });
});

describe("isTrackComplete", () => {
  it("RN-P6: concluída quando toda lição está concluída", () => {
    const progress: Record<string, LessonProgress> = {
      l1: completed("l1"),
      l2: completed("l2"),
      l3: completed("l3"),
    };
    expect(isTrackComplete(lessons, progress)).toBe(true);
  });

  it("RN-P6: não concluída enquanto falta uma lição", () => {
    const progress: Record<string, LessonProgress> = {
      l1: completed("l1"),
      l2: completed("l2"),
    };
    expect(isTrackComplete(lessons, progress)).toBe(false);
  });

  it("uma trilha sem lições nunca está concluída", () => {
    expect(isTrackComplete([], {})).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm run test -- unlock-rules`
Expected: FAIL — `isLessonComplete`/`isTrackComplete` não existem.

- [ ] **Step 3: Implementar**

Em `src/core/domain/unlock-rules.ts`, trocar o import do topo:

```ts
import type {
  Activity,
  Lesson,
  LessonProgress,
  LessonStatus,
} from "@/core/domain/types";
```

E acrescentar ao final do arquivo:

```ts
/**
 * Lição concluída quando toda atividade dela está concluída (RN-P5).
 *
 * Uma lição sem atividades nunca está concluída — não existe "concluir por
 * omissão"; é sinal de conteúdo incompleto, não de aluno em dia.
 */
export function isLessonComplete(
  activities: readonly Activity[],
  completedActivityIds: ReadonlySet<string>,
): boolean {
  if (activities.length === 0) return false;
  return activities.every((activity) => completedActivityIds.has(activity.id));
}

/**
 * Trilha concluída quando toda lição dela está concluída (RN-P6).
 *
 * Reusa o mesmo critério de `computeTrackProgress` (status `"completed"` em
 * `LessonProgress`), só que como booleano — é o que a tela de trilha e o
 * evento de XP de conclusão de trilha (RN-X5) precisam para decidir "cheguei
 * ao fim", em vez de reler um percentual.
 */
export function isTrackComplete(
  lessons: readonly Lesson[],
  progress: Readonly<Record<string, LessonProgress>>,
): boolean {
  if (lessons.length === 0) return false;
  return lessons.every((lesson) => progress[lesson.id]?.status === "completed");
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm run test -- unlock-rules`
Expected: PASS, todos os casos.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/core/domain/unlock-rules.ts src/core/domain/unlock-rules.test.ts
git commit -m "feat(domain): RN-P5/RN-P6 — isLessonComplete e isTrackComplete"
```

---

## Task 2: RN-P7 — filtro de conteúdo publicado na camada de dados

Hoje `contentRepository` (mock) devolve todo `Track`/`Lesson` sem olhar `status`. Funciona por
acidente porque toda fixture já é `"published"` — mas a regra exige o filtro *na camada de dados*,
não só porque a interface nunca desenha rascunho.

`Activity` e `Item` não têm campo `status` no tipo — o fluxo editorial (RN-W1) só versiona no nível
de Trilha/Lição, então não há nada a filtrar nesses dois.

**Files:**
- Modify: `src/core/domain/permissions.ts`
- Modify: `src/core/data/mock/index.ts`
- Test: `src/core/domain/permissions.test.ts`

**Interfaces:**
- Consumes: `ContentStatus` de `@/core/domain/types` (já existe).
- Produces: `filterPublished<T extends { status: ContentStatus }>(items): T[]` exportada de
  `@/core/domain/permissions` — usada por `contentRepository.listTracks/getTrack/listLessons`.

- [ ] **Step 1: Escrever o teste que falha**

Acrescentar a `src/core/domain/permissions.test.ts` (import no topo já traz `can`,
`canSeeContentStatus`, `roleCan`, `Actor` — acrescentar `filterPublished`):

```ts
import {
  can,
  canSeeContentStatus,
  filterPublished,
  roleCan,
  type Actor,
} from "@/core/domain/permissions";
```

```ts
describe("filterPublished", () => {
  it("RN-P7: mantém só o que está publicado", () => {
    const items = [
      { id: "1", status: "published" as const },
      { id: "2", status: "draft" as const },
      { id: "3", status: "in_review" as const },
      { id: "4", status: "published" as const },
    ];

    expect(filterPublished(items).map((item) => item.id)).toEqual(["1", "4"]);
  });

  it("lista vazia continua vazia", () => {
    expect(filterPublished([])).toEqual([]);
  });
});

describe("gestor — management:read_communities", () => {
  it("lê os dados agregados de todas as comunidades", () => {
    expect(can(manager, "management:read_communities")).toBe(true);
  });

  it("professor não lê agregados de comunidades", () => {
    expect(can(teacher, "management:read_communities")).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm run test -- permissions`
Expected: FAIL — `filterPublished` não existe (o bloco de `management:read_communities` já passa,
pois a regra já está na matriz — serve só para fechar a lacuna de cobertura apontada na auditoria).

- [ ] **Step 3: Implementar `filterPublished`**

Em `src/core/domain/permissions.ts`, trocar o import do topo:

```ts
import { ROLE_ACTIONS, type Action } from "@/config/permissions";
import type { ContentStatus, User, UserRole } from "@/core/domain/types";
```

E acrescentar ao final do arquivo:

```ts
/**
 * Filtra qualquer coleção de conteúdo para o que já foi publicado (RN-P7).
 *
 * Existe para ser chamada pela camada de dados, nunca só pela interface — um
 * componente que só deixasse de desenhar o rascunho ainda teria recebido o
 * dado, e recebê-lo já é o vazamento que a regra proíbe.
 */
export function filterPublished<T extends { status: ContentStatus }>(
  items: readonly T[],
): T[] {
  return items.filter((item) => item.status === "published");
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm run test -- permissions`
Expected: PASS.

- [ ] **Step 5: Ligar o filtro no repositório mock**

Em `src/core/data/mock/index.ts`, importar `filterPublished`:

```ts
import { filterPublished } from "@/core/domain/permissions";
```

E trocar os três métodos de `contentRepository`:

```ts
  async listTracks(params: ListTracksParams = {}) {
    const publishedIds = new Set(
      filterPublished(MOCK_TRACKS).map((track) => track.id),
    );
    let results = MOCK_TRACK_SUMMARIES.filter((track) =>
      publishedIds.has(track.id),
    );

    if (params.query?.trim()) {
      results = results.filter((track) => matchesQuery(track, params.query!));
    }
    if (params.moduleId) {
      const moduleName = MOCK_MODULES.find(
        (item) => item.id === params.moduleId,
      )?.name;
      results = results.filter((track) => track.moduleName === moduleName);
    }
    if (params.recommendedOnly) {
      results = results.filter((track) => track.isRecommended);
    }

    const total = results.length;
    if (params.limit) results = results.slice(0, params.limit);

    const page: Paginated<TrackSummary> = { data: results, meta: { total } };
    return delay(page);
  },

  async getTrack(trackId: string) {
    const [track] = filterPublished(
      MOCK_TRACKS.filter((item) => item.id === trackId),
    );
    return delay(track ?? null);
  },

  async listLessons(trackId: string) {
    return delay(
      filterPublished(
        MOCK_LESSONS.filter((lesson) => lesson.trackId === trackId),
      ),
    );
  },
```

(`listActivities`/`listItems` ficam como estão — `Activity`/`Item` não carregam `status`.)

- [ ] **Step 6: Rodar suíte inteira e typecheck**

Run: `npm run test && npm run typecheck`
Expected: PASS / sem erros. (`listTracks`/`getTrack`/`listLessons` não têm teste próprio — mesmo
padrão do resto de `core/data/mock`, que não é testado; a regra em si está coberta via
`filterPublished`.)

- [ ] **Step 7: Commit**

```bash
git add src/core/domain/permissions.ts src/core/domain/permissions.test.ts src/core/data/mock/index.ts
git commit -m "feat(domain): RN-P7 — filterPublished, aplicado no repositório de conteúdo"
```

---

## Task 3: RN-D3 / RN-D4 / RN-G6 — sessão vira tentativa real, e correção tardia credita XP

Hoje `mastery.ts` (domínio) só sabe calcular a partir de `Attempt[]`, mas nada no repositório
produz esse `Attempt[]` de verdade: `activityRepository.listAttempts` sempre devolve `[]`. E
`ItemState` não guarda nenhum horário — não dá pra reconstruir uma tentativa sem um `answeredAt`.

Este é o gap mais estrutural do plano: exige acrescentar `answeredAt` a `ItemState` e um parâmetro
`now` a `submitAnswer` (que hoje não recebe instante nenhum — o único jeito de dar timestamp a uma
resposta sem violar a regra de ouro é o chamador entregar o instante). Isso também alinha
`submitAnswer` à assinatura original da spec (`submitAnswer(session, itemId, outcome, now)`).

A mesma mudança fecha de vez o teste de integração que faltava para RN-G6: hoje só existe teste de
que `resolvePendingReview` muda o estado — falta provar que isso realmente aparece no XP do resumo.

**Files:**
- Modify: `src/core/domain/activity-session.ts`
- Modify: `src/core/data/mock/index.ts`
- Test: `src/core/domain/activity-session.test.ts` (reescrita completa — a assinatura de
  `submitAnswer` muda em ~30 chamadas)

**Interfaces:**
- Consumes: `Attempt` de `@/core/domain/types` (já existe, campos `itemId`, `isCorrect`,
  `attemptNumber`, `timeSpentSeconds`, `answeredAt`).
- Produces:
  - `submitAnswer(session, itemId, outcome, now: string): ActivitySession` — assinatura nova, com
    `now` obrigatório.
  - `toAttempts(session: ActivitySession): Attempt[]` — nova, exportada de
    `@/core/domain/activity-session`, para `ActivityRepository.listAttempts` consumir.
  - `ItemState.answeredAt: string | null` — campo novo.

- [ ] **Step 1: Reescrever `src/core/domain/activity-session.test.ts`**

Substituir o arquivo inteiro por este conteúdo (a única mudança estrutural é que todo `submitAnswer`
agora recebe um 4º argumento de horário, e há dois `describe` novos no fim — `toAttempts` e a
integração de RN-G6):

```ts
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm run test -- activity-session`
Expected: FAIL — `submitAnswer` ainda não aceita 4º argumento, `toAttempts` não existe,
`ItemState.answeredAt` não existe.

- [ ] **Step 3: Implementar em `src/core/domain/activity-session.ts`**

Trocar o import do topo:

```ts
import { MAX_ATTEMPTS_PER_ITEM } from "@/config/activity-rules";
import type { GradeOutcome } from "@/core/domain/grading";
import { computeActivityXp, computePerformancePercent } from "@/core/domain/xp";
import type { Attempt, Item } from "@/core/domain/types";
```

Acrescentar `answeredAt` a `ItemState`:

```ts
export type ItemState = {
  itemId: string;
  attempts: number;
  firstAttemptCorrect: boolean | null;
  resolution: ItemResolution | null;
  /**
   * Horário da PRIMEIRA tentativa. `null` até a primeira resposta. Nunca é
   * reescrito depois — inclusive quando `resolvePendingReview` resolve o item
   * mais tarde, o horário que fica é o de quando o aluno respondeu, não o de
   * quando a IA ou o professor corrigiu (RN-D1).
   */
  answeredAt: string | null;
};
```

Em `startSession`, inicializar o campo novo:

```ts
    items: items.map((item) => ({
      itemId: item.id,
      attempts: 0,
      firstAttemptCorrect: null,
      resolution: null,
      answeredAt: null,
    })),
```

Em `resumeSession`, o item novo (sem estado salvo) também precisa do campo:

```ts
        savedById.get(item.id) ?? {
          itemId: item.id,
          attempts: 0,
          firstAttemptCorrect: null,
          resolution: null,
          answeredAt: null,
        },
```

Trocar a assinatura de `submitAnswer` e gravar `answeredAt` na primeira tentativa (nos dois ramos —
pendente e correto/incorreto):

```ts
export function submitAnswer(
  session: ActivitySession,
  itemId: string,
  outcome: GradeOutcome,
  now: string,
): ActivitySession {
  const current = findState(session, itemId);
  if (!current || isItemResolved(current)) return session;

  return replaceItem(session, itemId, (state) => {
    const attempts = state.attempts + 1;
    const isFirstAttempt = attempts === 1;
    const answeredAt = isFirstAttempt ? now : state.answeredAt;

    if (outcome.status === "pending_review") {
      return {
        ...state,
        attempts,
        firstAttemptCorrect: null,
        resolution: "pending_review",
        answeredAt,
      };
    }

    const firstAttemptCorrect = isFirstAttempt
      ? outcome.status === "correct"
      : state.firstAttemptCorrect;

    if (outcome.status === "correct") {
      return {
        ...state,
        attempts,
        firstAttemptCorrect,
        resolution: "correct",
        answeredAt,
      };
    }

    const exhausted = attempts >= MAX_ATTEMPTS_PER_ITEM;
    return {
      ...state,
      attempts,
      firstAttemptCorrect,
      resolution: exhausted ? "revealed" : null,
      answeredAt,
    };
  });
}
```

Acrescentar `toAttempts` no final do arquivo, junto de `summarizeSession`:

```ts
/**
 * Converte a sessão em tentativas para o domínio de mastery (RN-D1–D4).
 *
 * Só a primeira tentativa de cada item resolvido vira `Attempt` — é a única
 * que `mastery.ts` usa, e a única para a qual a sessão guarda horário. Item
 * ainda pendente (RN-D4) fica fora até ser corrigido; quando é corrigido, o
 * horário que entra é o da resposta original, não o da correção.
 *
 * `timeSpentSeconds` é o intervalo até a resposta anterior (ou o início da
 * sessão, para o primeiro item) — não é "tempo gasto só neste item" no
 * sentido estrito, mas é o único relógio que a sessão realmente guarda.
 */
export function toAttempts(session: ActivitySession): Attempt[] {
  const attempts: Attempt[] = [];
  let previousAnsweredAt = session.startedAt;

  for (const state of session.items) {
    if (state.resolution === null || state.resolution === "pending_review") {
      continue;
    }
    if (state.answeredAt === null) continue;

    const timeSpentSeconds = Math.max(
      0,
      Math.round(
        (new Date(state.answeredAt).getTime() -
          new Date(previousAnsweredAt).getTime()) /
          1000,
      ),
    );

    attempts.push({
      itemId: state.itemId,
      isCorrect: state.firstAttemptCorrect === true,
      attemptNumber: 1,
      timeSpentSeconds,
      answeredAt: state.answeredAt,
    });

    previousAnsweredAt = state.answeredAt;
  }

  return attempts;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm run test -- activity-session`
Expected: PASS, todos os casos, incluindo os novos de `toAttempts` e o de RN-G6.

- [ ] **Step 5: Ligar `toAttempts` em `activityRepository.listAttempts` (mock)**

Em `src/core/data/mock/index.ts`, trocar o import de `activity-session`:

```ts
import {
  summarizeSession,
  toAttempts,
  type ActivitySession,
} from "@/core/domain/activity-session";
```

E trocar `listAttempts`:

```ts
  async listAttempts(lessonId: string) {
    const activityIds = MOCK_ACTIVITIES.filter(
      (activity) => activity.lessonId === lessonId,
    ).map((activity) => activity.id);

    const sessions = readSessions();
    const attempts = activityIds.flatMap((activityId) => {
      const session = sessions[activityId];
      return session ? toAttempts(session) : [];
    });

    return delay(attempts, 60);
  },
```

- [ ] **Step 6: Rodar suíte inteira e typecheck**

Run: `npm run test && npm run typecheck`
Expected: PASS / sem erros. (Nenhum outro arquivo chama `submitAnswer` fora deste teste — não há
tela de player ainda — então não sobra nenhuma outra chamada para atualizar.)

- [ ] **Step 7: Commit**

```bash
git add src/core/domain/activity-session.ts src/core/domain/activity-session.test.ts src/core/data/mock/index.ts
git commit -m "feat(domain): RN-D3/D4 — toAttempts real, e RN-G6 — teste de XP creditado após correção tardia"
```

---

## Task 4: `errors.ts` — cobertura de teste e primeiro uso real

A taxonomia de erros existe e está bem desenhada, mas não tem teste nenhum e não é usada em lugar
nenhum do repositório mock — `authRepository.signIn` ainda lança `new Error(...)` genérico.

**Files:**
- Test (novo): `src/core/domain/errors.test.ts`
- Modify: `src/core/data/mock/index.ts`

**Interfaces:**
- Consumes: `DomainError`, `ValidationError`, `NetworkError`, `AuthError`, `NotFoundError`,
  `isLeDucError`, `toUserMessage` — todas já exportadas de `@/core/domain/errors`, sem mudança de
  assinatura.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/core/domain/errors.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  AuthError,
  DomainError,
  isLeDucError,
  NetworkError,
  NotFoundError,
  toUserMessage,
  ValidationError,
} from "@/core/domain/errors";

describe("taxonomia de erros", () => {
  it("DomainError é violação de regra, com mensagem segura genérica", () => {
    const error = new DomainError("lição bloqueada");
    expect(error.kind).toBe("domain");
    expect(error.name).toBe("DomainError");
    expect(error.userMessage).toBe("Não foi possível concluir esta ação agora.");
  });

  it("ValidationError aponta o campo e aceita mensagem customizada", () => {
    const error = new ValidationError("e-mail inválido", "email");
    expect(error.kind).toBe("validation");
    expect(error.field).toBe("email");
    expect(error.userMessage).toBe("Confira as informações e tente de novo.");
  });

  it("NetworkError é sempre reenviável", () => {
    const error = new NetworkError("timeout");
    expect(error.kind).toBe("network");
    expect(error.isRetryable).toBe(true);
  });

  it("AuthError orienta a entrar de novo", () => {
    const error = new AuthError("sessão expirada");
    expect(error.kind).toBe("auth");
  });

  it("NotFoundError orienta um estado vazio", () => {
    const error = new NotFoundError("trilha inexistente");
    expect(error.kind).toBe("not_found");
  });
});

describe("isLeDucError", () => {
  it("reconhece qualquer erro da taxonomia", () => {
    expect(isLeDucError(new DomainError("x"))).toBe(true);
    expect(isLeDucError(new Error("erro comum"))).toBe(false);
    expect(isLeDucError("não é nem erro")).toBe(false);
  });
});

describe("toUserMessage", () => {
  it("devolve a mensagem segura do erro conhecido", () => {
    expect(toUserMessage(new AuthError("x"))).toBe(
      "Sua sessão expirou. Entre de novo para continuar.",
    );
  });

  it("devolve mensagem genérica para erro desconhecido", () => {
    expect(toUserMessage(new Error("boom"))).toBe(
      "Algo não funcionou como esperado. Tente de novo em instantes.",
    );
    expect(toUserMessage("string qualquer")).toBe(
      "Algo não funcionou como esperado. Tente de novo em instantes.",
    );
  });
});
```

- [ ] **Step 2: Rodar e confirmar que passa direto**

Run: `npm run test -- errors`
Expected: PASS — a implementação já existe; este arquivo só fecha a cobertura que faltava.

- [ ] **Step 3: Primeiro uso real — `authRepository.signIn`**

Em `src/core/data/mock/index.ts`, importar e trocar o `throw` genérico:

```ts
import { ValidationError } from "@/core/domain/errors";
```

```ts
const authRepository: AuthRepository = {
  async signIn({ email, password }: SignInInput) {
    await delay(null, 600);

    if (!email.trim() || !password.trim()) {
      throw new ValidationError(
        "E-mail e senha são obrigatórios.",
        !email.trim() ? "email" : "password",
        "Preencha o e-mail e a senha para entrar.",
      );
    }

    writeStoredSession(true);
    return { user: { ...MOCK_USER, email } };
  },
  // ...
```

- [ ] **Step 4: Rodar suíte inteira e typecheck**

Run: `npm run test && npm run typecheck`
Expected: PASS / sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/core/domain/errors.test.ts src/core/data/mock/index.ts
git commit -m "test(domain): cobertura da taxonomia de erros, e primeiro uso real em signIn"
```

---

## Task 5: limpar valor obsoleto de `achievementsTotal` na fixture

Achado de passagem na auditoria: `MOCK_GAMIFICATION.achievementsTotal` está hardcoded em `24`, mas o
catálogo real (`config/achievements.ts`) tem 13 conquistas — e já exporta `ACHIEVEMENTS_TOTAL`.
Hoje é inofensivo (nenhum componente lê esse campo), mas é um número errado parado no código; a
correção elimina a fonte de divergência em vez de só atualizar o número.

**Files:**
- Modify: `src/core/data/mock/fixtures.ts`

- [ ] **Step 1: Trocar o literal pela constante**

No topo de `src/core/data/mock/fixtures.ts`, acrescentar ao import existente de
`@/config/achievements` (criar o import se não existir):

```ts
import { ACHIEVEMENTS_TOTAL } from "@/config/achievements";
```

E em `MOCK_GAMIFICATION`:

```ts
export const MOCK_GAMIFICATION: GamificationSummary = {
  xpTotal: 640,
  level: 4,
  xpIntoLevel: 140,
  xpForNextLevel: 250,
  streakDays: 5,
  longestStreakDays: 11,
  achievementsUnlocked: 7,
  achievementsTotal: ACHIEVEMENTS_TOTAL,
};
```

- [ ] **Step 2: Rodar suíte inteira e typecheck**

Run: `npm run test && npm run typecheck`
Expected: PASS / sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/core/data/mock/fixtures.ts
git commit -m "fix(mock): achievementsTotal usa ACHIEVEMENTS_TOTAL em vez de número solto"
```

---

## Task 6: Verificação final

- [ ] **Step 1: Suíte completa**

Run: `npm run typecheck && npm run lint && npm run test`
Expected: os três limpos. A suíte deve estar em 207 + (novos casos das Tasks 1–4) testes, todos
verdes.

- [ ] **Step 2: Build de produção**

Run: `npm run build`
Expected: build limpo, sem erros de tipo nem de lint bloqueando.

- [ ] **Step 3: Conferir a regra de ouro por busca**

Run (Git Bash): `grep -rn "Date.now()\|from \"react\"\|from 'react'\|localStorage\|fetch(" src/core/domain`
Expected: nenhum resultado. `core/domain` continua sem React, sem rede, sem relógio próprio.

- [ ] **Step 4: Commit final (se sobrar algo solto)**

Se `git status` não mostrar nada pendente, não commitar nada — as Tasks 1–5 já cobrem todo o diff.

---

## O que ficou de fora, por decisão do usuário (registrar, não esquecer)

- **RN-W4** (versionamento de conteúdo — aluno termina lição na versão em que começou): exige campo
  de versão em `Track`/`Lesson`, fixtures com múltiplas versões e lógica de busca pinada por versão.
  Sem tela de autoria publicando ainda, não há como validar isso de ponta a ponta. Retomar quando a
  autoria (`AuthoringRepository`, fora do escopo também) existir.
- **RN-G7** (professor revisa correção de IA de resposta curta): sem tela de revisão do professor,
  vira função sem consumidor. Retomar junto da tela de sala de aula/correção.
- **RN-S6** (conflito de sync: servidor vence, exceto XP que soma): é comportamento do lado do
  servidor por natureza (Parte VI da spec) — sem backend, não há conflito real para resolver.
- **`ClassroomRepository`, `AuthoringRepository`, `PublicDataRepository`** (Parte V da spec, "a
  serem acrescentados"): mesmo raciocínio — sem fixtures nem tela consumidora, adicionar as
  interfaces agora seria contrato morto. Adicionar quando a primeira tela de turma/autoria/gestor
  entrar em construção.
