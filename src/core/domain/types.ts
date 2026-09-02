import type { ItemDifficulty } from "@/config/xp-rules";
import type { TrackTint } from "@/config/palette";

/**
 * Tipos do domínio. TypeScript puro — sem React, sem rede.
 *
 * Hierarquia de conteúdo:
 *   Módulo → Trilha → Lição → Atividade → Item
 */

export type { ItemDifficulty };

export type UserRole = "student" | "teacher" | "manager";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  student: "Estudante EJA",
  teacher: "Professor",
  manager: "Gestor",
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  /** ISO. Origem do "Membro desde" no perfil. */
  memberSince: string;
};

export type ItemType =
  | "multiple_choice"
  | "column_match"
  | "fill_blanks"
  | "short_answer";

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  multiple_choice: "Múltipla escolha",
  column_match: "Associação de colunas",
  fill_blanks: "Completar lacunas",
  short_answer: "Resposta curta",
};

export const DIFFICULTY_LABELS: Record<ItemDifficulty, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

/** Estado editorial. Rascunho nunca chega ao aluno. */
export type ContentStatus = "draft" | "in_review" | "published";

export type Module = {
  id: string;
  name: string;
  tint: TrackTint;
  orderIndex: number;
};

export type Track = {
  id: string;
  moduleId: string;
  /** Nível dentro do módulo — "Alfabetização I" é módulo + nível. */
  level: string;
  title: string;
  description: string;
  tint: TrackTint;
  totalLessons: number;
  isRecommended: boolean;
  status: ContentStatus;
};

export type Lesson = {
  id: string;
  trackId: string;
  title: string;
  /** A ordem *é* a regra de desbloqueio. */
  orderIndex: number;
  estimatedMinutes: number;
  status: ContentStatus;
};

export type Activity = {
  id: string;
  lessonId: string;
  title: string;
  orderIndex: number;
};

export type Choice = {
  id: string;
  label: string;
};

export type MultipleChoiceContent = {
  options: Choice[];
  correctOptionId: string;
};

export type ColumnMatchContent = {
  left: Choice[];
  right: Choice[];
  correctPairs: { leftId: string; rightId: string }[];
};

export type FillBlanksContent = {
  /** Trechos do enunciado; `null` marca uma lacuna, na ordem. */
  segments: (string | null)[];
  /** Variantes aceitas por lacuna, na mesma ordem das lacunas. */
  acceptedAnswers: string[][];
};

export type ShortAnswerContent = {
  /** Respostas de referência — orientam a IA e o professor, não corrigem sozinhas. */
  referenceAnswers: string[];
};

type ItemBase = {
  id: string;
  activityId: string;
  difficulty: ItemDifficulty;
  prompt: string;
  /** Explicação do feedback imediato. Para `short_answer`, vem da IA. */
  explanation: string;
  /**
   * Tolerar acento é decisão de conteúdo, não regra global: nos primeiros
   * níveis o acento ainda não foi ensinado; nos avançados, cobrá-lo é o ponto.
   * A normalização nunca corrige ortografia (RN-G4).
   */
  ignoreAccents: boolean;
};

/**
 * Item, como união discriminada pelo tipo.
 *
 * O gabarito vive junto do item e é específico de cada tipo — é isso que
 * permite ao corretor tratar um tipo novo sem que o player saiba da diferença.
 */
export type Item =
  | (ItemBase & { type: "multiple_choice"; content: MultipleChoiceContent })
  | (ItemBase & { type: "column_match"; content: ColumnMatchContent })
  | (ItemBase & { type: "fill_blanks"; content: FillBlanksContent })
  | (ItemBase & { type: "short_answer"; content: ShortAnswerContent });

export type LessonStatus = "locked" | "available" | "in_progress" | "completed";

export const LESSON_STATUS_LABELS: Record<LessonStatus, string> = {
  locked: "Bloqueada",
  available: "Disponível",
  in_progress: "Em andamento",
  completed: "Concluída",
};

export type LessonProgress = {
  lessonId: string;
  status: Exclude<LessonStatus, "locked">;
  /** Calculado apenas com as primeiras tentativas. 0–100. */
  masteryScore: number;
  completedAt: string | null;
};

export type Attempt = {
  itemId: string;
  isCorrect: boolean;
  /** 1 = primeira tentativa. Só ela conta para domínio e para XP de item. */
  attemptNumber: number;
  timeSpentSeconds: number;
  answeredAt: string;
};
