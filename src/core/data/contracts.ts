import type {
  GamificationSummary,
  ModulePerformance,
  Paginated,
  Session,
  TrackSummary,
  UserStats,
} from "@/core/data/models";
import type {
  ActivitySession,
  ActivitySummary,
} from "@/core/domain/activity-session";
import type { GradeOutcome } from "@/core/domain/grading";
import type { SyncItem } from "@/core/domain/sync";
import type {
  Activity,
  Attempt,
  Item,
  Lesson,
  LessonProgress,
  Module,
  Track,
} from "@/core/domain/types";

/**
 * Contratos da camada de dados.
 *
 * A interface conhece apenas estas assinaturas. Hoje existem implementações em
 * `mock/`; amanhã existirão em `http/`, e nenhum componente muda. É a fronteira
 * que separa "protótipo com dados falsos" de "produto com backend".
 */

export type SignInInput = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export interface AuthRepository {
  signIn(input: SignInInput): Promise<Session>;
  signOut(): Promise<void>;
  getSession(): Promise<Session | null>;
}

export type ListTracksParams = {
  /** Busca por título, módulo ou conteúdo. */
  query?: string;
  moduleId?: string;
  recommendedOnly?: boolean;
  limit?: number;
};

export interface ContentRepository {
  listModules(): Promise<Module[]>;
  listTracks(params?: ListTracksParams): Promise<Paginated<TrackSummary>>;
  getTrack(trackId: string): Promise<Track | null>;
  listLessons(trackId: string): Promise<Lesson[]>;
  listActivities(lessonId: string): Promise<Activity[]>;
  listItems(activityId: string): Promise<Item[]>;
}

export interface ProgressRepository {
  /** Trilhas ordenadas por último acesso — o "Acessado recentemente". */
  listRecentTracks(limit?: number): Promise<TrackSummary[]>;
  /** A trilha do card "Trilha em andamento". Nulo para quem ainda não começou. */
  getContinueTrack(): Promise<TrackSummary | null>;
  /** Progresso das lições de uma trilha, indexado por id de lição. */
  getTrackProgress(trackId: string): Promise<Record<string, LessonProgress>>;
}

export interface GamificationRepository {
  getSummary(): Promise<GamificationSummary>;
}

export interface MetricsRepository {
  getUserStats(): Promise<UserStats>;
  listModulePerformance(): Promise<ModulePerformance[]>;
}

/**
 * Sessão de atividade.
 *
 * `saveSession` é chamado a cada resposta (RN-A3): é o que faz fechar o app no
 * meio de uma atividade não custar nada ao aluno.
 */
export interface ActivityRepository {
  getSession(activityId: string): Promise<ActivitySession | null>;
  saveSession(session: ActivitySession): Promise<void>;
  completeActivity(session: ActivitySession): Promise<ActivitySummary>;
  listAttempts(lessonId: string): Promise<Attempt[]>;
}

/**
 * Os quatro usos de IA do produto, atrás de uma porta só.
 *
 * Nenhum componente chama isto diretamente: sempre hook → repositório. Toda
 * chamada precisa de estado de carregamento e caminho de falha visível —
 * respostas de IA são lentas e falham, e o aluno não pode ficar parado por isso.
 */
export interface AiRepository {
  gradeShortAnswer(item: Item, text: string): Promise<GradeOutcome>;
  explainAnswer(item: Item, answerText: string): Promise<string>;
  reviewContent(trackId: string): Promise<ReviewNote[]>;
  recommendVideos(context: { moduleId: string }): Promise<RecommendedVideo[]>;
}

export type ReviewNote = {
  nodeId: string;
  severity: "info" | "warning";
  message: string;
  /** Sugestão da IA. Publicar continua sendo ato humano (RN-W6). */
  suggestion: string | null;
};

export type RecommendedVideo = {
  id: string;
  title: string;
  durationSeconds: number;
  thumbnailUrl: string | null;
  moduleId: string;
};

/** Fila offline. A implementação persiste em IndexedDB; o domínio só decide. */
export interface SyncRepository {
  list(): Promise<SyncItem[]>;
  enqueue(item: Omit<SyncItem, "status" | "attempts" | "lastError">): Promise<void>;
  drain(): Promise<{ sent: number; failed: number }>;
  pendingCount(): Promise<number>;
}

/** Conjunto completo de repositórios usado pela aplicação. */
export type DataSource = {
  auth: AuthRepository;
  content: ContentRepository;
  progress: ProgressRepository;
  gamification: GamificationRepository;
  metrics: MetricsRepository;
  activity: ActivityRepository;
  ai: AiRepository;
  sync: SyncRepository;
};
