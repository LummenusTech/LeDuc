import type { UserRole } from "@/core/domain/types";

/**
 * Matriz de permissões (RN-Z1 a RN-Z4).
 *
 * É consultada em dois lugares — a guarda de rota, que cuida da experiência, e
 * o repositório, que cuida da correção. A interface nunca é a única barreira:
 * esconder um botão não impede ninguém de digitar a URL.
 */

export type Action =
  /* conteúdo */
  | "content:read_published"
  | "content:read_draft"
  | "content:author_class_scope"
  | "content:author_library_scope"
  | "content:publish_class_scope"
  | "content:publish_library_scope"
  /* progresso */
  | "progress:read_own"
  | "progress:write_own"
  | "progress:read_class_students"
  | "progress:read_all"
  /* turma */
  | "classroom:manage_own_classes"
  | "classroom:read_own_class"
  | "schedule:create_class_event"
  | "schedule:create_personal_event"
  /* gestão */
  | "management:read_communities"
  | "management:manage_users";

const STUDENT_ACTIONS: Action[] = [
  "content:read_published",
  "progress:read_own",
  "progress:write_own",
  "classroom:read_own_class",
  "schedule:create_personal_event",
];

const TEACHER_ACTIONS: Action[] = [
  "content:read_published",
  "content:read_draft",
  "content:author_class_scope",
  "content:publish_class_scope",
  "progress:read_own",
  "progress:read_class_students",
  "classroom:manage_own_classes",
  "schedule:create_class_event",
  "schedule:create_personal_event",
];

const MANAGER_ACTIONS: Action[] = [
  ...TEACHER_ACTIONS,
  "content:author_library_scope",
  "content:publish_library_scope",
  "progress:read_all",
  "management:read_communities",
  "management:manage_users",
];

export const ROLE_ACTIONS: Record<UserRole, readonly Action[]> = {
  student: STUDENT_ACTIONS,
  teacher: TEACHER_ACTIONS,
  manager: MANAGER_ACTIONS,
};
