import type {
  GamificationSummary,
  ModulePerformance,
  TrackSummary,
  UserStats,
} from "@/core/data/models";
import type {
  Activity,
  Item,
  Lesson,
  LessonProgress,
  Module,
  Track,
  User,
} from "@/core/domain/types";

/**
 * Dados de demonstração.
 *
 * Determinísticos de propósito: nada de `Math.random`, para que a mesma tela
 * apareça igual em toda execução e uma captura de tela continue válida.
 *
 * Isolado da lógica — este arquivo é o material que depois migra para o banco.
 */

export const MOCK_USER: User = {
  id: "u1",
  name: "User",
  email: "user.estudante@gmail.com",
  role: "student",
  avatarUrl: null,
  memberSince: "2025-04-01T00:00:00.000Z",
};

export const MOCK_MODULES: Module[] = [
  { id: "m-alfabetizacao", name: "Alfabetização", tint: "violeta", orderIndex: 0 },
  { id: "m-gramatica", name: "Gramática", tint: "verde", orderIndex: 1 },
  { id: "m-leitura", name: "Leitura", tint: "pessego", orderIndex: 2 },
  { id: "m-interpretacao", name: "Interpretação", tint: "azul", orderIndex: 3 },
];

type TrackSeed = {
  id: string;
  moduleId: string;
  level: string;
  totalLessons: number;
  currentLesson: number;
  isRecommended: boolean;
  lastAccessedAt: string | null;
  description: string;
};

/**
 * A frase do dia e a saudação vêm das telas. Conteúdo editorial, não regra —
 * por isso vive aqui e não no domínio.
 */
export const DAILY_QUOTE =
  "Feliz aquele que transfere o que sabe e aprende o que ensina";

const TRACK_SEEDS: TrackSeed[] = [
  {
    id: "alfabetizacao-i",
    moduleId: "m-alfabetizacao",
    level: "I",
    totalLessons: 12,
    currentLesson: 4,
    isRecommended: false,
    lastAccessedAt: "2026-03-07T14:10:00.000Z",
    description: "Letras, sílabas e as primeiras palavras do dia a dia.",
  },
  {
    id: "gramatica-i",
    moduleId: "m-gramatica",
    level: "I",
    totalLessons: 10,
    currentLesson: 2,
    isRecommended: false,
    lastAccessedAt: "2026-03-06T09:30:00.000Z",
    description: "Como as palavras se organizam para formar uma frase.",
  },
  {
    id: "leitura-i",
    moduleId: "m-leitura",
    level: "I",
    totalLessons: 15,
    currentLesson: 6,
    isRecommended: false,
    lastAccessedAt: "2026-03-05T18:45:00.000Z",
    description: "Ler placas, bilhetes e avisos da comunidade.",
  },
  {
    id: "interpretacao-i",
    moduleId: "m-interpretacao",
    level: "I",
    totalLessons: 8,
    currentLesson: 3,
    isRecommended: false,
    lastAccessedAt: "2026-03-03T11:00:00.000Z",
    description: "Entender o que um texto curto está dizendo.",
  },
  {
    id: "interpretacao-v",
    moduleId: "m-interpretacao",
    level: "V",
    totalLessons: 20,
    currentLesson: 6,
    isRecommended: true,
    lastAccessedAt: null,
    description: "Comparar ideias entre dois textos sobre o mesmo assunto.",
  },
  {
    id: "gramatica-vi",
    moduleId: "m-gramatica",
    level: "VI",
    totalLessons: 19,
    currentLesson: 6,
    isRecommended: true,
    lastAccessedAt: null,
    description: "Concordância e pontuação em textos do cotidiano.",
  },
  {
    id: "gramatica-iv",
    moduleId: "m-gramatica",
    level: "IV",
    totalLessons: 17,
    currentLesson: 2,
    isRecommended: true,
    lastAccessedAt: null,
    description: "Tempos verbais para contar o que já aconteceu.",
  },
  {
    id: "alfabetizacao-ii",
    moduleId: "m-alfabetizacao",
    level: "II",
    totalLessons: 22,
    currentLesson: 2,
    isRecommended: true,
    lastAccessedAt: null,
    description: "Palavras com encontros consonantais e sílabas complexas.",
  },
];

function moduleById(moduleId: string): Module {
  const found = MOCK_MODULES.find((item) => item.id === moduleId);
  if (!found) throw new Error(`Módulo desconhecido no fixture: ${moduleId}`);
  return found;
}

export const MOCK_TRACKS: Track[] = TRACK_SEEDS.map((seed) => {
  const parentModule = moduleById(seed.moduleId);
  return {
    id: seed.id,
    moduleId: seed.moduleId,
    level: seed.level,
    title: `${parentModule.name} ${seed.level}`,
    description: seed.description,
    tint: parentModule.tint,
    totalLessons: seed.totalLessons,
    isRecommended: seed.isRecommended,
    status: "published",
  };
});

export const MOCK_TRACK_SUMMARIES: TrackSummary[] = TRACK_SEEDS.map((seed) => {
  const parentModule = moduleById(seed.moduleId);
  const completedLessons = Math.max(0, seed.currentLesson - 1);

  return {
    id: seed.id,
    title: `${parentModule.name} ${seed.level}`,
    moduleName: parentModule.name,
    tint: parentModule.tint,
    currentLesson: seed.currentLesson,
    totalLessons: seed.totalLessons,
    progressPct: Math.round((completedLessons / seed.totalLessons) * 100),
    isRecommended: seed.isRecommended,
    lastAccessedAt: seed.lastAccessedAt,
  };
});

/** Trilha destacada em "Trilha em andamento". */
export const CONTINUE_TRACK_ID = "alfabetizacao-i";

/* -------------------------------------------------------------------------- */
/* Árvore de conteúdo completa de uma trilha                                   */
/* -------------------------------------------------------------------------- */

const ALFABETIZACAO_LESSON_TITLES = [
  "As vogais",
  "Sílabas com P e B",
  "Sílabas com M e N",
  "Palavras do rio",
  "Sílabas com T e D",
  "Nomes e sobrenomes",
  "Sílabas com F e V",
  "Palavras da feira",
  "Sílabas com L e R",
  "Recados e bilhetes",
  "Palavras com CH e NH",
  "Escrevendo meu nome completo",
];

export const MOCK_LESSONS: Lesson[] = ALFABETIZACAO_LESSON_TITLES.map(
  (title, index) => ({
    id: `alf1-l${index + 1}`,
    trackId: "alfabetizacao-i",
    title,
    orderIndex: index,
    estimatedMinutes: 8 + (index % 3) * 2,
    status: "published",
  }),
);

export const MOCK_ACTIVITIES: Activity[] = MOCK_LESSONS.flatMap(
  (lesson, lessonIndex) => [
    {
      id: `${lesson.id}-a1`,
      lessonId: lesson.id,
      title: "Reconhecer",
      orderIndex: 0,
    },
    {
      id: `${lesson.id}-a2`,
      lessonId: lesson.id,
      title: lessonIndex % 2 === 0 ? "Praticar" : "Escrever",
      orderIndex: 1,
    },
  ],
);

/**
 * Itens da primeira atividade da primeira lição, cobrindo os quatro tipos e as
 * três dificuldades. Serve de base para o motor de atividades da fase 6.
 */
export const MOCK_ITEMS: Item[] = [
  {
    id: "alf1-l1-a1-i1",
    activityId: "alf1-l1-a1",
    type: "multiple_choice",
    difficulty: "easy",
    prompt: "Qual destas letras é uma vogal?",
    explanation:
      "A, E, I, O e U são as vogais. As outras letras são consoantes.",
    // Nível inicial: o acento ainda não foi ensinado, então não é cobrado.
    ignoreAccents: true,
    content: {
      options: [
        { id: "o1", label: "A" },
        { id: "o2", label: "B" },
        { id: "o3", label: "M" },
        { id: "o4", label: "T" },
      ],
      correctOptionId: "o1",
    },
  },
  {
    id: "alf1-l1-a1-i2",
    activityId: "alf1-l1-a1",
    type: "column_match",
    difficulty: "medium",
    prompt: "Ligue cada vogal ao desenho que começa com ela.",
    explanation:
      "A palavra começa com o mesmo som da vogal que você escolheu.",
    ignoreAccents: true,
    content: {
      left: [
        { id: "l-a", label: "A" },
        { id: "l-e", label: "E" },
        { id: "l-i", label: "I" },
      ],
      right: [
        { id: "r-abelha", label: "Abelha" },
        { id: "r-escada", label: "Escada" },
        { id: "r-igreja", label: "Igreja" },
      ],
      correctPairs: [
        { leftId: "l-a", rightId: "r-abelha" },
        { leftId: "l-e", rightId: "r-escada" },
        { leftId: "l-i", rightId: "r-igreja" },
      ],
    },
  },
  {
    id: "alf1-l1-a1-i3",
    activityId: "alf1-l1-a1",
    type: "fill_blanks",
    difficulty: "medium",
    prompt: "Complete a palavra com a vogal que falta.",
    explanation: "A palavra é CASA. A vogal que falta é o A.",
    ignoreAccents: true,
    content: {
      segments: ["c", null, "sa"],
      acceptedAnswers: [["a"]],
    },
  },
  {
    id: "alf1-l1-a1-i4",
    activityId: "alf1-l1-a1",
    type: "short_answer",
    difficulty: "hard",
    prompt: "Escreva uma palavra que comece com a letra A.",
    explanation:
      "Qualquer palavra iniciada pelo som da vogal A está correta.",
    ignoreAccents: true,
    content: {
      referenceAnswers: ["água", "arroz", "abelha", "avião", "amigo"],
    },
  },
];

/* -------------------------------------------------------------------------- */
/* Progresso do aluno                                                          */
/* -------------------------------------------------------------------------- */

/** Três lições concluídas — coerente com "Lição 4 de 12" nas telas. */
export const MOCK_LESSON_PROGRESS: Record<string, LessonProgress> = {
  "alf1-l1": {
    lessonId: "alf1-l1",
    status: "completed",
    masteryScore: 100,
    completedAt: "2026-03-02T15:20:00.000Z",
  },
  "alf1-l2": {
    lessonId: "alf1-l2",
    status: "completed",
    masteryScore: 75,
    completedAt: "2026-03-04T16:05:00.000Z",
  },
  "alf1-l3": {
    lessonId: "alf1-l3",
    status: "completed",
    masteryScore: 80,
    completedAt: "2026-03-06T10:40:00.000Z",
  },
  "alf1-l4": {
    lessonId: "alf1-l4",
    status: "in_progress",
    masteryScore: 0,
    completedAt: null,
  },
};

export const MOCK_USER_STATS: UserStats = {
  lessonsCompleted: 12,
  lessonsTotal: 48,
  overallProgressPct: 25,
  retentionRate: 78,
  studyTimeMinutes: 870,
  streakDays: 5,
  achievementsCount: 7,
};

export const MOCK_GAMIFICATION: GamificationSummary = {
  xpTotal: 640,
  level: 4,
  xpIntoLevel: 140,
  xpForNextLevel: 250,
  streakDays: 5,
  longestStreakDays: 11,
  achievementsUnlocked: 7,
  achievementsTotal: 24,
};

export const MOCK_MODULE_PERFORMANCE: ModulePerformance[] = [
  {
    moduleId: "m-alfabetizacao",
    moduleName: "Alfabetização",
    tint: "violeta",
    score: 80,
  },
  { moduleId: "m-gramatica", moduleName: "Gramática", tint: "verde", score: 60 },
  { moduleId: "m-leitura", moduleName: "Leitura", tint: "pessego", score: 45 },
  {
    moduleId: "m-interpretacao",
    moduleName: "Interpretação",
    tint: "azul",
    score: 70,
  },
];
