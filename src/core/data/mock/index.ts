import type {
  ActivityRepository,
  AiRepository,
  AuthRepository,
  ContentRepository,
  DataSource,
  GamificationRepository,
  ListTracksParams,
  MetricsRepository,
  ProgressRepository,
  SignInInput,
  SyncRepository,
} from "@/core/data/contracts";
import {
  summarizeSession,
  toAttempts,
  type ActivitySession,
} from "@/core/domain/activity-session";
import { filterPublished } from "@/core/domain/permissions";
import {
  enqueue as enqueueSyncItem,
  markSent as markSyncSent,
  nextBatch as nextSyncBatch,
  pendingCount as syncPendingCount,
  type SyncItem,
} from "@/core/domain/sync";
import type { Paginated, Session, TrackSummary } from "@/core/data/models";
import {
  CONTINUE_TRACK_ID,
  MOCK_ACTIVITIES,
  MOCK_GAMIFICATION,
  MOCK_ITEMS,
  MOCK_LESSONS,
  MOCK_LESSON_PROGRESS,
  MOCK_MODULES,
  MOCK_MODULE_PERFORMANCE,
  MOCK_TRACKS,
  MOCK_TRACK_SUMMARIES,
  MOCK_USER,
  MOCK_USER_STATS,
} from "@/core/data/mock/fixtures";

/**
 * Implementação mock dos repositórios.
 *
 * Latência artificial de propósito: sem ela, os estados de carregamento nunca
 * apareceriam durante o desenvolvimento e chegariam quebrados à produção.
 */

const LATENCY_MS = 320;

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const SESSION_KEY = "leduc.session";

function readStoredSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SESSION_KEY)
      ? { user: MOCK_USER }
      : null;
  } catch {
    return null;
  }
}

function writeStoredSession(active: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (active) {
      window.localStorage.setItem(SESSION_KEY, "1");
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // Sessão não persiste, mas o protótipo segue navegável.
  }
}

const authRepository: AuthRepository = {
  async signIn({ email, password }: SignInInput) {
    await delay(null, 600);

    if (!email.trim() || !password.trim()) {
      throw new Error("Preencha o e-mail e a senha para entrar.");
    }

    writeStoredSession(true);
    return { user: { ...MOCK_USER, email } };
  },

  async signOut() {
    writeStoredSession(false);
    await delay(null, 120);
  },

  async getSession() {
    return delay(readStoredSession(), 80);
  },
};

function normalize(value: string): string {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function matchesQuery(track: TrackSummary, query: string): boolean {
  const needle = normalize(query);
  return (
    normalize(track.title).includes(needle) ||
    normalize(track.moduleName).includes(needle)
  );
}

const contentRepository: ContentRepository = {
  async listModules() {
    return delay([...MOCK_MODULES]);
  },

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

  async listActivities(lessonId: string) {
    return delay(
      MOCK_ACTIVITIES.filter((activity) => activity.lessonId === lessonId),
    );
  },

  async listItems(activityId: string) {
    return delay(MOCK_ITEMS.filter((item) => item.activityId === activityId));
  },
};

const progressRepository: ProgressRepository = {
  async listRecentTracks(limit = 4) {
    const recent = MOCK_TRACK_SUMMARIES.filter(
      (track) => track.lastAccessedAt !== null,
    )
      .sort((a, b) => (a.lastAccessedAt! < b.lastAccessedAt! ? 1 : -1))
      .slice(0, limit);

    return delay(recent);
  },

  async getContinueTrack() {
    return delay(
      MOCK_TRACK_SUMMARIES.find((track) => track.id === CONTINUE_TRACK_ID) ??
        null,
    );
  },

  async getTrackProgress(trackId: string) {
    if (trackId !== CONTINUE_TRACK_ID) return delay({});
    return delay({ ...MOCK_LESSON_PROGRESS });
  },
};

const gamificationRepository: GamificationRepository = {
  async getSummary() {
    return delay({ ...MOCK_GAMIFICATION });
  },
};

const metricsRepository: MetricsRepository = {
  async getUserStats() {
    return delay({ ...MOCK_USER_STATS });
  },

  async listModulePerformance() {
    return delay([...MOCK_MODULE_PERFORMANCE]);
  },
};

/* -------------------------------------------------------------------------- */
/* Sessão de atividade                                                         */
/* -------------------------------------------------------------------------- */

const SESSIONS_KEY = "leduc.sessions";

function readSessions(): Record<string, ActivitySession> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ActivitySession>) : {};
  } catch {
    return {};
  }
}

function writeSessions(sessions: Record<string, ActivitySession>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // Sem persistência, a sessão vale só enquanto a aba estiver aberta.
  }
}

const activityRepository: ActivityRepository = {
  async getSession(activityId: string) {
    return delay(readSessions()[activityId] ?? null, 80);
  },

  // Persistência a cada resposta (RN-A3). No mock isso é localStorage; com
  // backend, será IndexedDB mais a fila de sincronização.
  async saveSession(session: ActivitySession) {
    const sessions = readSessions();
    sessions[session.activityId] = session;
    writeSessions(sessions);
    await delay(null, 40);
  },

  async completeActivity(session: ActivitySession) {
    const items = MOCK_ITEMS.filter(
      (item) => item.activityId === session.activityId,
    );
    const summary = summarizeSession(session, items, {
      endedAt: new Date().toISOString(),
    });
    return delay(summary, 200);
  },

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
};

/* -------------------------------------------------------------------------- */
/* IA                                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Respostas prontas, com latência bem maior que a dos outros repositórios.
 *
 * A demora é de propósito: se a interface só for exercitada com respostas
 * instantâneas, o estado de carregamento da IA nasce quebrado e só aparece em
 * produção, na conexão ruim de quem mais precisa dele.
 */
const AI_LATENCY_MS = 1_400;

const aiRepository: AiRepository = {
  async gradeShortAnswer(item, text) {
    await delay(null, AI_LATENCY_MS);

    if (item.type !== "short_answer") {
      throw new Error("gradeShortAnswer recebeu um item de outro tipo.");
    }

    const answer = text.trim().toLocaleLowerCase("pt-BR");
    const isCorrect =
      answer.length > 0 &&
      item.content.referenceAnswers.some((reference) =>
        answer.startsWith(reference.slice(0, 1).toLocaleLowerCase("pt-BR")),
      );

    return isCorrect
      ? { status: "correct", explanation: item.explanation }
      : { status: "incorrect", explanation: item.explanation };
  },

  async explainAnswer(item) {
    return delay(item.explanation, AI_LATENCY_MS);
  },

  async reviewContent() {
    return delay(
      [
        {
          nodeId: "alf1-l1-a1-i4",
          severity: "warning" as const,
          message: "O enunciado pode ser mais concreto para o público EJA.",
          suggestion:
            "Escreva o nome de uma coisa que você vê no rio e que comece com A.",
        },
      ],
      AI_LATENCY_MS,
    );
  },

  async recommendVideos() {
    return delay([], AI_LATENCY_MS);
  },
};

/* -------------------------------------------------------------------------- */
/* Fila de sincronização                                                       */
/* -------------------------------------------------------------------------- */

let syncQueue: SyncItem[] = [];

const syncRepository: SyncRepository = {
  async list() {
    return delay([...syncQueue], 40);
  },

  async enqueue(item) {
    syncQueue = enqueueSyncItem(syncQueue, item);
    await delay(null, 40);
  },

  // No mock não há servidor: o lote é considerado entregue. A ordem e a
  // idempotência, que são o que importa, vêm de `core/domain/sync.ts`.
  async drain() {
    const batch = nextSyncBatch(syncQueue);
    for (const item of batch) {
      syncQueue = markSyncSent(syncQueue, item.id);
    }
    return delay({ sent: batch.length, failed: 0 }, 300);
  },

  async pendingCount() {
    return delay(syncPendingCount(syncQueue), 20);
  },
};

export const mockDataSource: DataSource = {
  auth: authRepository,
  content: contentRepository,
  progress: progressRepository,
  gamification: gamificationRepository,
  metrics: metricsRepository,
  activity: activityRepository,
  ai: aiRepository,
  sync: syncRepository,
};
