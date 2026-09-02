import { toDayKey } from "@/core/domain/streak";

/**
 * Cronograma e notificações (RN-C1 a RN-C3).
 *
 * Notificação é **derivada**, não uma entidade digitada à mão: ela é o que se
 * conclui do estado atual — um aviso do professor, um evento próximo, a
 * ofensiva prestes a quebrar, uma revisão madura. Isso mantém tudo calculável
 * localmente, que é o que faz o aviso mais importante — "sua sequência acaba
 * hoje" — funcionar justamente quando não há rede.
 */

export type ScheduleOwner = "teacher" | "student";

export type ScheduleEvent = {
  id: string;
  title: string;
  /** Instante ISO. */
  startsAt: string;
  ownerType: ScheduleOwner;
  ownerId: string;
  classId: string | null;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  classId: string;
};

export type NotificationKind =
  | "announcement"
  | "upcoming_event"
  | "streak_at_risk"
  | "review_available";

export type DerivedNotification = {
  kind: NotificationKind;
  title: string;
  description: string;
  /** Instante que ordena a lista. */
  occurredAt: string;
  /** Id da origem, para a interface navegar. */
  sourceId: string | null;
};

export type NotificationContext = {
  announcements: readonly Announcement[];
  events: readonly ScheduleEvent[];
  /** Chaves de dia em que o aluno acessou o app. */
  accessDays: readonly string[];
  currentStreakDays: number;
  pendingReviewCount: number;
};

const UPCOMING_WINDOW_HOURS = 48;
const MS_PER_HOUR = 3_600_000;

/** O aluno acrescenta os próprios eventos; os do professor ele só lê (RN-C1). */
export function canEditEvent(
  event: ScheduleEvent,
  actor: { id: string; role: "student" | "teacher" | "manager" },
): boolean {
  if (event.ownerType === "student") return event.ownerId === actor.id;
  return actor.role !== "student";
}

export function deriveNotifications(
  context: NotificationContext,
  { now }: { now: string },
): DerivedNotification[] {
  const notifications: DerivedNotification[] = [];
  const nowMs = new Date(now).getTime();

  for (const announcement of context.announcements) {
    notifications.push({
      kind: "announcement",
      title: announcement.title,
      description: announcement.body,
      occurredAt: announcement.publishedAt,
      sourceId: announcement.id,
    });
  }

  for (const event of context.events) {
    const hoursAway = (new Date(event.startsAt).getTime() - nowMs) / MS_PER_HOUR;
    if (hoursAway < 0 || hoursAway > UPCOMING_WINDOW_HOURS) continue;

    notifications.push({
      kind: "upcoming_event",
      title: event.title,
      description: "Está chegando no seu cronograma.",
      occurredAt: event.startsAt,
      sourceId: event.id,
    });
  }

  // Só avisa quem tem o que perder, e apenas no dia em que ainda dá para
  // salvar: quem já acessou hoje não precisa de lembrete (RN-C3).
  const today = toDayKey(new Date(now));
  const accessedToday = context.accessDays.includes(today);

  if (context.currentStreakDays > 0 && !accessedToday) {
    notifications.push({
      kind: "streak_at_risk",
      title: "Sua sequência acaba hoje",
      description: `Você está há ${context.currentStreakDays} ${
        context.currentStreakDays === 1 ? "dia" : "dias"
      } seguidos. Estude um pouco para não perder.`,
      occurredAt: now,
      sourceId: null,
    });
  }

  if (context.pendingReviewCount > 0) {
    notifications.push({
      kind: "review_available",
      title: "Que tal revisar?",
      description: "Uma lição que você já concluiu está pronta para reforço.",
      occurredAt: now,
      sourceId: null,
    });
  }

  return notifications.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
}
