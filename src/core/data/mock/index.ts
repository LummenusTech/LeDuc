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
import {
  evaluateAchievements,
  type AchievementContext,
} from "@/core/domain/achievements";
import { computeMasteryScore, reconcileMasteryScore } from "@/core/domain/mastery";
import { filterPublished } from "@/core/domain/permissions";
import { selectReviewCandidates } from "@/core/domain/review";
import { deriveNotifications } from "@/core/domain/scheduling";
import { ValidationError } from "@/core/domain/errors";
import { toDayKey } from "@/core/domain/streak";
import {
  computeTrackProgress,
  findResumeLesson,
  isLessonComplete,
  isTrackComplete,
} from "@/core/domain/unlock-rules";
import {
  buildReviewXpEvent,
  buildTrackCompletionXpEvent,
  sumXpLedger,
} from "@/core/domain/xp";
import { levelProgress } from "@/core/domain/levels";
import type { LessonProgress } from "@/core/domain/types";
import {
  enqueue as enqueueSyncItem,
  markSent as markSyncSent,
  nextBatch as nextSyncBatch,
  pendingCount as syncPendingCount,
  type SyncItem,
} from "@/core/domain/sync";
import { ACHIEVEMENTS_TOTAL } from "@/config/achievements";
import type { GamificationSummary, Paginated, Session, TrackSummary } from "@/core/data/models";
import {
  currentStreak,
  currentXpTotal,
  readActivityCompletions,
  readProgress,
  readStreakDays,
  readUnlockedAchievements,
  readXpLedger,
  recordAccessToday,
  writeActivityCompletions,
  writeProgress,
  writeUnlockedAchievements,
  writeXpLedger,
} from "@/core/data/mock/store";
import {
  CONTINUE_TRACK_ID,
  MOCK_ACTIVITIES,
  MOCK_ITEMS,
  MOCK_LESSONS,
  MOCK_MODULES,
  MOCK_MODULE_PERFORMANCE,
  MOCK_TRACKS,
  MOCK_TRACK_SUMMARIES,
  MOCK_USER,
  MOCK_USER_STATS,
} from "@/core/data/mock/fixtures";

function publishedTrackIds(): Set<string> {
  return new Set(filterPublished(MOCK_TRACKS).map((track) => track.id));
}

/**
 * Sobrepõe progresso ao vivo numa `TrackSummary` estática.
 *
 * Só a trilha "alfabetização I" tem lições modeladas nesta fase — para as
 * outras, `MOCK_LESSONS` não tem nada e a sobreposição é um no-op.
 */
function liveTrackSummary(seed: TrackSummary): TrackSummary {
  const lessons = MOCK_LESSONS.filter((lesson) => lesson.trackId === seed.id);
  if (lessons.length === 0) return seed;

  const progress = readProgress();
  const ordered = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);
  const resume = findResumeLesson(ordered, progress);

  return {
    ...seed,
    currentLesson: resume ? resume.orderIndex + 1 : ordered.length,
    progressPct: computeTrackProgress(ordered, progress),
  };
}

function buildGamificationSummary(): GamificationSummary {
  const xpTotal = currentXpTotal();
  const { level, xpIntoLevel, xpForNextLevel } = levelProgress(xpTotal);
  const streak = currentStreak();
  const unlocked = readUnlockedAchievements();

  return {
    xpTotal,
    level,
    xpIntoLevel,
    xpForNextLevel,
    streakDays: streak.current,
    longestStreakDays: streak.longest,
    achievementsUnlocked: unlocked.length,
    achievementsTotal: ACHIEVEMENTS_TOTAL,
  };
}

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

function isSession(value: unknown): value is Session {
  return (
    typeof value === "object" &&
    value !== null &&
    "user" in value &&
    typeof (value as { user: unknown }).user === "object"
  );
}

function readStoredSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    // Formato antigo era só a string "1" — `JSON.parse` não falha nisso, vira
    // o número 1. Sem essa checagem, uma sessão pré-migração passaria como
    // válida com `user` inexistente.
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: Session | null) {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
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
      throw new ValidationError(
        "E-mail e senha são obrigatórios.",
        !email.trim() ? "email" : "password",
        "Preencha o e-mail e a senha para entrar.",
      );
    }

    const session: Session = { user: { ...MOCK_USER, email } };
    writeStoredSession(session);
    return session;
  },

  async signOut() {
    writeStoredSession(null);
    await delay(null, 120);
  },

  async getSession() {
    return delay(readStoredSession(), 80);
  },

  async updateProfile(patch) {
    const current = readStoredSession() ?? { user: MOCK_USER };
    const updated: Session = { user: { ...current.user, ...patch } };
    writeStoredSession(updated);
    return delay(updated, 300);
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
    const publishedIds = publishedTrackIds();
    let results = MOCK_TRACK_SUMMARIES.filter((track) =>
      publishedIds.has(track.id),
    ).map(liveTrackSummary);

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

  async getLesson(lessonId: string) {
    const [lesson] = filterPublished(
      MOCK_LESSONS.filter((item) => item.id === lessonId),
    );
    return delay(lesson ?? null);
  },

  async listActivities(lessonId: string) {
    const lesson = MOCK_LESSONS.find((item) => item.id === lessonId);
    if (!lesson || filterPublished([lesson]).length === 0) return delay([]);

    return delay(
      MOCK_ACTIVITIES.filter((activity) => activity.lessonId === lessonId),
    );
  },

  async listItems(activityId: string) {
    const activity = MOCK_ACTIVITIES.find((item) => item.id === activityId);
    const lesson =
      activity && MOCK_LESSONS.find((item) => item.id === activity.lessonId);
    if (!lesson || filterPublished([lesson]).length === 0) return delay([]);

    return delay(MOCK_ITEMS.filter((item) => item.activityId === activityId));
  },
};

const progressRepository: ProgressRepository = {
  async listRecentTracks(limit = 4) {
    const publishedIds = publishedTrackIds();
    const recent = MOCK_TRACK_SUMMARIES.filter(
      (track) => track.lastAccessedAt !== null && publishedIds.has(track.id),
    )
      .sort((a, b) => (a.lastAccessedAt! < b.lastAccessedAt! ? 1 : -1))
      .slice(0, limit)
      .map(liveTrackSummary);

    return delay(recent);
  },

  async getContinueTrack() {
    const publishedIds = publishedTrackIds();
    const track = MOCK_TRACK_SUMMARIES.find(
      (item) => item.id === CONTINUE_TRACK_ID && publishedIds.has(item.id),
    );
    return delay(track ? liveTrackSummary(track) : null);
  },

  async getTrackProgress(trackId: string) {
    const lessonIds = new Set(
      MOCK_LESSONS.filter((lesson) => lesson.trackId === trackId).map(
        (lesson) => lesson.id,
      ),
    );
    const progress = readProgress();
    const filtered = Object.fromEntries(
      Object.entries(progress).filter(([lessonId]) => lessonIds.has(lessonId)),
    );
    return delay(filtered);
  },

  async listLessonHistory() {
    const progress = readProgress();

    const entries = Object.entries(progress).flatMap(([lessonId, entry]) => {
      const lesson = MOCK_LESSONS.find((item) => item.id === lessonId);
      const track = lesson && MOCK_TRACKS.find((item) => item.id === lesson.trackId);
      if (!lesson || !track) return [];
      return [{ lesson, track, progress: entry }];
    });

    entries.sort((a, b) => {
      const aKey = a.progress.completedAt ?? "";
      const bKey = b.progress.completedAt ?? "";
      return aKey < bKey ? 1 : -1;
    });

    return delay(entries, 80);
  },

  async listNotifications() {
    const now = new Date().toISOString();
    const progress = readProgress();
    const streak = currentStreak();
    const reviewCandidates = selectReviewCandidates(Object.values(progress), {
      now,
    });

    const notifications = deriveNotifications(
      {
        announcements: [],
        events: [],
        accessDays: readStreakDays(),
        currentStreakDays: streak.current,
        pendingReviewCount: reviewCandidates.length,
      },
      { now },
    );

    return delay(notifications, 100);
  },
};

const gamificationRepository: GamificationRepository = {
  async getSummary() {
    return delay(buildGamificationSummary());
  },

  async recordAccess() {
    recordAccessToday();
    await delay(null, 40);
  },

  async listUnlockedAchievements() {
    return delay(readUnlockedAchievements(), 60);
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

  async getCompletedActivityIds(lessonId: string) {
    const completions = readActivityCompletions();
    return delay(completions[lessonId] ?? [], 40);
  },

  async applyCompletionEffects({ session, summary, lessonId, trackId }) {
    const now = new Date().toISOString();

    // Atividades concluídas da lição (RN-P5).
    const completions = readActivityCompletions();
    const lessonActivityIds = new Set(completions[lessonId] ?? []);
    lessonActivityIds.add(session.activityId);
    completions[lessonId] = [...lessonActivityIds];
    writeActivityCompletions(completions);

    const lessonActivities = MOCK_ACTIVITIES.filter(
      (activity) => activity.lessonId === lessonId,
    );
    const lessonJustFinished = isLessonComplete(
      lessonActivities,
      lessonActivityIds,
    );

    // Domínio: primeira tentativa de toda a lição, não só desta atividade
    // (RN-D1) — junta as sessões de todas as atividades da lição.
    const sessions = readSessions();
    const lessonAttempts = lessonActivities.flatMap((activity) => {
      const stored = sessions[activity.id];
      return stored ? toAttempts(stored) : [];
    });
    const incomingMastery = computeMasteryScore(lessonAttempts);

    const progress = readProgress();
    const storedProgress = progress[lessonId] ?? null;
    const lessonAlreadyCompleted = storedProgress?.status === "completed";

    const lessonProgress: LessonProgress = {
      lessonId,
      status:
        lessonAlreadyCompleted || lessonJustFinished
          ? "completed"
          : "in_progress",
      // Revisita nunca sobrescreve o domínio já registrado (RN-D2).
      masteryScore: reconcileMasteryScore(
        lessonAlreadyCompleted ? storedProgress.masteryScore : null,
        incomingMastery,
      ),
      completedAt: lessonAlreadyCompleted
        ? storedProgress.completedAt
        : lessonJustFinished
          ? now
          : null,
    };
    progress[lessonId] = lessonProgress;
    writeProgress(progress);

    // Trilha concluída (RN-P6) — só conta como "agora" na primeira vez que a
    // lição fecha; revisitar uma lição já concluída nunca dispara de novo.
    const trackLessons = MOCK_LESSONS.filter(
      (lesson) => lesson.trackId === trackId,
    );
    const trackJustFinished =
      !lessonAlreadyCompleted &&
      lessonJustFinished &&
      isTrackComplete(trackLessons, progress);

    // XP (RN-X1 a RN-X5, RN-X7) — o ledger é a única fonte de idempotência,
    // reprocessar o mesmo evento nunca duplica.
    const ledger = readXpLedger();
    ledger.push(
      session.isReview
        ? buildReviewXpEvent(session.activityId, toDayKey(new Date()))
        : {
            reason: "activity_completed",
            refId: session.activityId,
            amount: summary.xpEarned,
          },
    );
    if (trackJustFinished) {
      ledger.push(buildTrackCompletionXpEvent(trackId));
    }
    writeXpLedger(ledger);

    // Conquistas (RN-X9) — idempotente: reavaliar não retira nem duplica.
    const alreadyUnlocked = readUnlockedAchievements();
    const lessonsCompleted = Object.values(progress).filter(
      (item) => item.status === "completed",
    ).length;
    const perfectLessons = Object.values(progress).filter(
      (item) => item.status === "completed" && item.masteryScore === 100,
    ).length;
    const tracksCompleted = MOCK_TRACKS.filter((track) => {
      const lessons = MOCK_LESSONS.filter((l) => l.trackId === track.id);
      return isTrackComplete(lessons, progress);
    }).length;
    const streak = currentStreak();

    const context: AchievementContext = {
      lessonsCompleted,
      tracksCompleted,
      modulesCompleted: 0,
      xpTotal: sumXpLedger(ledger),
      currentStreakDays: streak.current,
      longestStreakDays: streak.longest,
      perfectLessons,
      reviewsCompleted: session.isReview ? 1 : 0,
    };

    const newAchievements = evaluateAchievements(context, alreadyUnlocked, {
      now,
    });
    if (newAchievements.length > 0) {
      writeUnlockedAchievements([
        ...alreadyUnlocked,
        ...newAchievements.map((achievement) => achievement.code),
      ]);
    }

    return delay(
      {
        lessonProgress,
        lessonCompletedNow: lessonJustFinished && !lessonAlreadyCompleted,
        trackCompletedNow: trackJustFinished,
        gamification: buildGamificationSummary(),
        newAchievements,
      },
      150,
    );
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
