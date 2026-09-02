/**
 * Todas as rotas da aplicação, em um só lugar.
 *
 * Regra: nenhum componente escreve um caminho como string literal. Renomear uma
 * rota deve ser uma edição única, e é esta constante que garante isso.
 *
 * Os caminhos são em português porque a URL faz parte da experiência do usuário.
 */

import type { UserRole } from "@/core/domain/types";

export const ROUTES = {
  home: "/",

  auth: {
    signIn: "/entrar",
    recoverPassword: "/recuperar-senha",
  },

  onboarding: "/onboarding",

  student: {
    home: "/inicio",
    tracks: "/trilhas",
    allTracks: "/trilhas/todas",
    module: (moduleId: string) => `/modulos/${moduleId}`,
    track: (trackId: string) => `/trilhas/${trackId}`,
    lesson: (lessonId: string) => `/licoes/${lessonId}`,
    activity: (lessonId: string, activityId: string) =>
      `/licoes/${lessonId}/atividades/${activityId}`,
    activityResult: (lessonId: string, activityId: string) =>
      `/licoes/${lessonId}/atividades/${activityId}/resultado`,
    review: "/revisao",
    progress: "/progresso",
    videos: "/videos",
    library: "/biblioteca",
    classroom: {
      root: "/sala",
      materials: "/sala/materiais",
      activities: "/sala/atividades",
      schedule: "/sala/cronograma",
    },
    profile: {
      root: "/perfil",
      achievements: "/perfil/conquistas",
      activity: "/perfil/atividades",
      preferences: "/perfil/preferencias",
      edit: "/perfil/editar",
    },
    notifications: "/notificacoes",
    settings: "/configuracoes",
    help: "/ajuda",
  },

  /** Etapa seguinte — rotas reservadas para não colidirem depois. */
  teacher: {
    home: "/painel",
    classes: "/painel/turmas",
    class: (classId: string) => `/painel/turmas/${classId}`,
    editor: "/painel/editor",
  },

  manager: {
    home: "/gestao",
    communities: "/gestao/comunidades",
    users: "/gestao/usuarios",
    library: "/gestao/biblioteca",
  },

  system: {
    offline: "/offline",
    forbidden: "/acesso-negado",
  },
} as const;

/** Único ponto que decide o destino pós-login. */
export function resolveHomeRoute(role: UserRole): string {
  switch (role) {
    case "student":
      return ROUTES.student.home;
    case "teacher":
      return ROUTES.teacher.home;
    case "manager":
      return ROUTES.manager.home;
  }
}
