import { ROLE_ACTIONS, type Action } from "@/config/permissions";
import type { ContentStatus, User, UserRole } from "@/core/domain/types";

/**
 * Permissões (RN-Z1 a RN-Z4).
 *
 * Consultado em dois lugares por decisão explícita: a guarda de rota, que cuida
 * da experiência, e o repositório, que cuida da correção. Esconder um botão não
 * impede ninguém de digitar a URL — a interface nunca é a única barreira.
 */

export type ResourceScope = {
  /** Dono do recurso, quando há um. */
  ownerId?: string;
  /** Turmas a que o recurso pertence. */
  classIds?: string[];
  /** Escopo editorial do conteúdo. */
  contentScope?: "library" | "class";
};

export type Actor = Pick<User, "id" | "role"> & {
  /** Turmas do professor, ou a turma do aluno. */
  classIds: string[];
};

export function roleCan(role: UserRole, action: Action): boolean {
  return ROLE_ACTIONS[role].includes(action);
}

/**
 * Autoriza uma ação sobre um recurso.
 *
 * O papel decide *o quê*; o escopo decide *sobre quem*. Um professor tem
 * `progress:read_class_students`, mas isso não o autoriza a ler qualquer aluno
 * — apenas os das turmas dele (RN-Z2).
 */
export function can(
  actor: Actor,
  action: Action,
  resource: ResourceScope = {},
): boolean {
  if (!roleCan(actor.role, action)) return false;

  switch (action) {
    case "progress:read_own":
    case "progress:write_own":
      return resource.ownerId === undefined || resource.ownerId === actor.id;

    case "progress:read_class_students":
    case "classroom:manage_own_classes":
    case "schedule:create_class_event":
      // Gestor enxerga tudo; professor, apenas as próprias turmas.
      if (actor.role === "manager") return true;
      return sharesClass(actor, resource);

    case "classroom:read_own_class":
      return sharesClass(actor, resource);

    case "content:author_class_scope":
    case "content:publish_class_scope":
      if (resource.contentScope === "library") return false;
      if (actor.role === "manager") return true;
      return resource.classIds === undefined || sharesClass(actor, resource);

    default:
      return true;
  }
}

function sharesClass(actor: Actor, resource: ResourceScope): boolean {
  if (!resource.classIds || resource.classIds.length === 0) return false;
  return resource.classIds.some((classId) => actor.classIds.includes(classId));
}

/**
 * O aluno só vê conteúdo publicado (RN-P7, RN-Z1).
 *
 * Isto é aplicado na camada de dados, e não na interface: um rascunho que
 * chegasse ao cliente já teria vazado, mesmo sem ser desenhado na tela.
 */
export function canSeeContentStatus(
  role: UserRole,
  status: "draft" | "in_review" | "published",
): boolean {
  if (status === "published") return true;
  return roleCan(role, "content:read_draft");
}

/**
 * Filtra qualquer coleção de conteúdo para o que já foi publicado (RN-P7).
 *
 * Existe para ser chamada pela camada de dados, nunca só pela interface — um
 * componente que só deixasse de desenhar o rascunho ainda teria recebido o
 * dado, e recebê-lo já é o vazamento que a regra proíbe.
 */
export function filterPublished<T extends { status: ContentStatus }>(
  items: readonly T[],
): T[] {
  return items.filter((item) => item.status === "published");
}
