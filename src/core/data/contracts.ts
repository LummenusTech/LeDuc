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
import type { UnlockedAchievement } from "@/core/domain/achievements";
import type { GradeOutcome } from "@/core/domain/grading";
import type { DerivedNotification } from "@/core/domain/scheduling";
import type { SyncItem } from "@/core/domain/sync";
import type {
  Activity,
  Attempt,
  Item,
  Lesson,
  LessonProgress,
  Module,
  Track,
  User,
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
  /** Campos editáveis do perfil — o resto do `User` (papel, id) nunca muda por aqui. */
  updateProfile(patch: Partial<Pick<User, "name" | "avatarUrl">>): Promise<Session>;
  /**
   * Pede o link de redefinição de senha.
   *
   * Nunca revela se o e-mail existe na base — a tela mostra a mesma
   * confirmação para os dois casos. Vazar essa informação é enumerar contas.
   */
  requestPasswordReset(email: string): Promise<void>;
  /** Já viu a introdução do LeDuc? Decide entrar direto ou pelo onboarding. */
  hasSeenOnboarding(): Promise<boolean>;
  markOnboardingSeen(): Promise<void>;
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
  /** A rota da lição não carrega o id da trilha — é assim que ela se resolve sozinha. */
  getLesson(lessonId: string): Promise<Lesson | null>;
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
  /** Histórico de lições com progresso, de qualquer trilha, mais recente primeiro. */
  listLessonHistory(): Promise<LessonHistoryEntry[]>;
  /** Avisos derivados do estado atual (RN-C2) — nada digitado à mão. */
  listNotifications(): Promise<DerivedNotification[]>;
}

export type LessonHistoryEntry = {
  lesson: Lesson;
  track: Track;
  progress: LessonProgress;
};

export interface GamificationRepository {
  getSummary(): Promise<GamificationSummary>;
  /** Registra o acesso de hoje (RN-O1). Idempotente — chamar várias vezes no mesmo dia não altera a ofensiva. */
  recordAccess(): Promise<void>;
  /** Códigos já desbloqueados — cruza com `config/achievements.ts` na tela. */
  listUnlockedAchievements(): Promise<string[]>;
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
  /** Ids das atividades já concluídas na lição — insumo de RN-P5 pra tela. */
  getCompletedActivityIds(lessonId: string): Promise<string[]>;
  /**
   * Aplica os efeitos colaterais de fechar uma atividade: credita XP, marca a
   * lição concluída quando é a última atividade dela (RN-P5), soma domínio,
   * verifica trilha concluída (RN-P6) e conquistas novas. Chamado uma vez, de
   * forma explícita, depois de `completeActivity` — que continua puro.
   */
  applyCompletionEffects(input: {
    session: ActivitySession;
    summary: ActivitySummary;
    lessonId: string;
    trackId: string;
  }): Promise<CompletionEffects>;
}

export type CompletionEffects = {
  lessonProgress: LessonProgress;
  lessonCompletedNow: boolean;
  trackCompletedNow: boolean;
  gamification: GamificationSummary;
  newAchievements: UnlockedAchievement[];
};

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
