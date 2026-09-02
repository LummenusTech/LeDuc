/**
 * Catálogo de conquistas (RN-X9).
 *
 * Declarativo de propósito: cada conquista é um predicado sobre um contexto,
 * então acrescentar uma é escrever uma linha aqui — nunca mexer no motor que
 * as avalia (`core/domain/achievements.ts`).
 *
 * As conquistas celebram **persistência e retomada**, não só acerto. Um público
 * em alfabetização precisa ser reconhecido por voltar, não apenas por acertar.
 */

export type AchievementContext = {
  lessonsCompleted: number;
  tracksCompleted: number;
  modulesCompleted: number;
  xpTotal: number;
  currentStreakDays: number;
  longestStreakDays: number;
  /** Lições concluídas com domínio 100%. */
  perfectLessons: number;
  reviewsCompleted: number;
};

/**
 * Chave do ícone. String, e não um componente: `config/` e `core/domain/` não
 * importam React nem lucide — a interface é que traduz a chave em desenho.
 */
export type AchievementIcon =
  | "first-step"
  | "flame"
  | "star"
  | "trophy"
  | "book"
  | "target"
  | "repeat"
  | "medal";

export type AchievementDefinition = {
  code: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  isUnlocked: (context: AchievementContext) => boolean;
};

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  {
    code: "first_lesson",
    title: "Primeiro passo",
    description: "Você concluiu sua primeira lição.",
    icon: "first-step",
    isUnlocked: (c) => c.lessonsCompleted >= 1,
  },
  {
    code: "ten_lessons",
    title: "Pegando o ritmo",
    description: "Dez lições concluídas.",
    icon: "book",
    isUnlocked: (c) => c.lessonsCompleted >= 10,
  },
  {
    code: "fifty_lessons",
    title: "Caminho longo",
    description: "Cinquenta lições concluídas.",
    icon: "book",
    isUnlocked: (c) => c.lessonsCompleted >= 50,
  },
  {
    code: "first_track",
    title: "Trilha completa",
    description: "Você terminou uma trilha inteira.",
    icon: "trophy",
    isUnlocked: (c) => c.tracksCompleted >= 1,
  },
  {
    code: "first_module",
    title: "Módulo vencido",
    description: "Você concluiu todas as trilhas de um módulo.",
    icon: "medal",
    isUnlocked: (c) => c.modulesCompleted >= 1,
  },
  {
    code: "streak_3",
    title: "Três dias seguidos",
    description: "Você estudou três dias sem parar.",
    icon: "flame",
    isUnlocked: (c) => c.longestStreakDays >= 3,
  },
  {
    code: "streak_7",
    title: "Uma semana inteira",
    description: "Sete dias seguidos de estudo.",
    icon: "flame",
    isUnlocked: (c) => c.longestStreakDays >= 7,
  },
  {
    code: "streak_30",
    title: "Um mês de constância",
    description: "Trinta dias seguidos de estudo.",
    icon: "flame",
    isUnlocked: (c) => c.longestStreakDays >= 30,
  },
  {
    code: "xp_100",
    title: "Cem pontos",
    description: "Você acumulou 100 XP.",
    icon: "star",
    isUnlocked: (c) => c.xpTotal >= 100,
  },
  {
    code: "xp_500",
    title: "Quinhentos pontos",
    description: "Você acumulou 500 XP.",
    icon: "star",
    isUnlocked: (c) => c.xpTotal >= 500,
  },
  {
    code: "xp_1000",
    title: "Mil pontos",
    description: "Você acumulou 1.000 XP.",
    icon: "star",
    isUnlocked: (c) => c.xpTotal >= 1_000,
  },
  {
    code: "perfect_lesson",
    title: "Tudo certo de primeira",
    description: "Uma lição inteira sem errar nenhuma questão.",
    icon: "target",
    isUnlocked: (c) => c.perfectLessons >= 1,
  },
  {
    code: "first_review",
    title: "Voltando para reforçar",
    description: "Você revisou uma lição que já tinha concluído.",
    icon: "repeat",
    isUnlocked: (c) => c.reviewsCompleted >= 1,
  },
];

export const ACHIEVEMENTS_TOTAL = ACHIEVEMENTS.length;
