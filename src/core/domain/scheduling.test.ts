import { describe, expect, it } from "vitest";

import {
  canEditEvent,
  deriveNotifications,
  type NotificationContext,
  type ScheduleEvent,
} from "@/core/domain/scheduling";
import { recommendTracks } from "@/core/domain/recommendation";
import type { Track } from "@/core/domain/types";

const NOW = "2026-03-20T12:00:00.000Z";
const TODAY = "2026-03-20";

const empty: NotificationContext = {
  announcements: [],
  events: [],
  accessDays: [],
  currentStreakDays: 0,
  pendingReviewCount: 0,
};

describe("canEditEvent", () => {
  const teacherEvent: ScheduleEvent = {
    id: "e1",
    title: "Prova",
    startsAt: NOW,
    ownerType: "teacher",
    ownerId: "prof",
    classId: "t1",
  };

  const ownEvent: ScheduleEvent = {
    ...teacherEvent,
    id: "e2",
    ownerType: "student",
    ownerId: "aluno",
  };

  it("o aluno edita o próprio evento", () => {
    expect(canEditEvent(ownEvent, { id: "aluno", role: "student" })).toBe(true);
  });

  it("o aluno não edita o evento do professor", () => {
    expect(canEditEvent(teacherEvent, { id: "aluno", role: "student" })).toBe(
      false,
    );
  });

  it("o aluno não edita evento pessoal de outro aluno", () => {
    expect(canEditEvent(ownEvent, { id: "outro", role: "student" })).toBe(false);
  });

  it("o professor edita o evento da turma", () => {
    expect(canEditEvent(teacherEvent, { id: "prof", role: "teacher" })).toBe(
      true,
    );
  });
});

describe("deriveNotifications", () => {
  it("não inventa nada quando não há o que avisar", () => {
    expect(deriveNotifications(empty, { now: NOW })).toEqual([]);
  });

  it("avisa da ofensiva em risco só se ainda não acessou hoje", () => {
    const atRisk = deriveNotifications(
      { ...empty, currentStreakDays: 5, accessDays: ["2026-03-19"] },
      { now: NOW },
    );

    expect(atRisk.map((n) => n.kind)).toContain("streak_at_risk");
  });

  it("não incomoda quem já estudou hoje", () => {
    const safe = deriveNotifications(
      { ...empty, currentStreakDays: 5, accessDays: [TODAY] },
      { now: NOW },
    );

    expect(safe.map((n) => n.kind)).not.toContain("streak_at_risk");
  });

  it("não avisa quem não tem sequência a perder", () => {
    const none = deriveNotifications(
      { ...empty, currentStreakDays: 0, accessDays: [] },
      { now: NOW },
    );

    expect(none.map((n) => n.kind)).not.toContain("streak_at_risk");
  });

  it("mostra evento dentro da janela e ignora o distante", () => {
    const events: ScheduleEvent[] = [
      {
        id: "perto",
        title: "Encontro na escola",
        startsAt: "2026-03-21T14:00:00.000Z",
        ownerType: "teacher",
        ownerId: "prof",
        classId: "t1",
      },
      {
        id: "longe",
        title: "Prova final",
        startsAt: "2026-04-30T14:00:00.000Z",
        ownerType: "teacher",
        ownerId: "prof",
        classId: "t1",
      },
    ];

    const derived = deriveNotifications({ ...empty, events }, { now: NOW });
    const ids = derived.map((n) => n.sourceId);

    expect(ids).toContain("perto");
    expect(ids).not.toContain("longe");
  });

  it("ignora evento que já passou", () => {
    const events: ScheduleEvent[] = [
      {
        id: "passado",
        title: "Aula de ontem",
        startsAt: "2026-03-19T14:00:00.000Z",
        ownerType: "teacher",
        ownerId: "prof",
        classId: "t1",
      },
    ];

    expect(deriveNotifications({ ...empty, events }, { now: NOW })).toEqual([]);
  });

  it("ordena do mais recente para o mais antigo", () => {
    const derived = deriveNotifications(
      {
        ...empty,
        announcements: [
          {
            id: "velho",
            title: "Antigo",
            body: "",
            publishedAt: "2026-03-01T10:00:00.000Z",
            classId: "t1",
          },
          {
            id: "novo",
            title: "Recente",
            body: "",
            publishedAt: "2026-03-19T10:00:00.000Z",
            classId: "t1",
          },
        ],
      },
      { now: NOW },
    );

    expect(derived.map((n) => n.sourceId)).toEqual(["novo", "velho"]);
  });
});

describe("recommendTracks", () => {
  function track(
    id: string,
    moduleId: string,
    level: string,
    status: Track["status"] = "published",
  ): Track {
    return {
      id,
      moduleId,
      level,
      title: `${moduleId} ${level}`,
      description: "",
      tint: "violeta",
      totalLessons: 10,
      isRecommended: false,
      status,
    };
  }

  const tracks = [
    track("alf2", "alfabetizacao", "II"),
    track("alf3", "alfabetizacao", "III"),
    track("gra1", "gramatica", "I"),
    track("lei1", "leitura", "I"),
  ];

  it("não recomenda o que já foi concluído nem o que está em andamento", () => {
    const result = recommendTracks({
      tracks,
      completedTrackIds: ["alf2"],
      inProgressTrackIds: ["gra1"],
      scoreByModuleId: {},
    });

    const ids = result.map((t) => t.id);
    expect(ids).not.toContain("alf2");
    expect(ids).not.toContain("gra1");
  });

  it("não recomenda rascunho", () => {
    const result = recommendTracks({
      tracks: [track("rasc", "leitura", "I", "draft")],
      completedTrackIds: [],
      inProgressTrackIds: [],
      scoreByModuleId: {},
    });

    expect(result).toEqual([]);
  });

  it("inclui no máximo uma trilha de reforço", () => {
    const result = recommendTracks({
      tracks,
      completedTrackIds: [],
      inProgressTrackIds: [],
      // Dois módulos fracos: só um pode virar reforço.
      scoreByModuleId: { gramatica: 30, leitura: 40 },
    });

    const reinforcement = result.filter(
      (t) => t.moduleId === "gramatica" || t.moduleId === "leitura",
    );
    expect(reinforcement).toHaveLength(1);
  });

  it("respeita o limite pedido", () => {
    const result = recommendTracks(
      {
        tracks,
        completedTrackIds: [],
        inProgressTrackIds: [],
        scoreByModuleId: {},
      },
      2,
    );

    expect(result).toHaveLength(2);
  });
});
