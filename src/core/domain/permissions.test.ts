import { describe, expect, it } from "vitest";

import {
  can,
  canSeeContentStatus,
  roleCan,
  type Actor,
} from "@/core/domain/permissions";

const student: Actor = { id: "u1", role: "student", classIds: ["t1"] };
const teacher: Actor = { id: "u2", role: "teacher", classIds: ["t1", "t2"] };
const manager: Actor = { id: "u3", role: "manager", classIds: [] };

describe("aluno", () => {
  it("lê conteúdo publicado e escreve o próprio progresso", () => {
    expect(can(student, "content:read_published")).toBe(true);
    expect(can(student, "progress:write_own", { ownerId: "u1" })).toBe(true);
  });

  it("não escreve o progresso de outro aluno", () => {
    expect(can(student, "progress:write_own", { ownerId: "outro" })).toBe(false);
  });

  it("não lê rascunho", () => {
    expect(can(student, "content:read_draft")).toBe(false);
    expect(canSeeContentStatus("student", "draft")).toBe(false);
    expect(canSeeContentStatus("student", "in_review")).toBe(false);
    expect(canSeeContentStatus("student", "published")).toBe(true);
  });

  it("não autora conteúdo nem gere turmas", () => {
    expect(can(student, "content:author_class_scope")).toBe(false);
    expect(can(student, "classroom:manage_own_classes", { classIds: ["t1"] })).toBe(
      false,
    );
  });

  it("cria evento pessoal, mas não evento de turma", () => {
    expect(can(student, "schedule:create_personal_event")).toBe(true);
    expect(can(student, "schedule:create_class_event", { classIds: ["t1"] })).toBe(
      false,
    );
  });
});

describe("professor", () => {
  it("lê alunos das próprias turmas", () => {
    expect(
      can(teacher, "progress:read_class_students", { classIds: ["t1"] }),
    ).toBe(true);
  });

  it("NÃO lê alunos de turma alheia", () => {
    expect(
      can(teacher, "progress:read_class_students", { classIds: ["t9"] }),
    ).toBe(false);
  });

  it("sem turma no recurso, nega por segurança", () => {
    expect(can(teacher, "progress:read_class_students", {})).toBe(false);
  });

  it("publica para a turma, não para a biblioteca", () => {
    expect(can(teacher, "content:publish_class_scope", { classIds: ["t1"] })).toBe(
      true,
    );
    expect(can(teacher, "content:publish_library_scope")).toBe(false);
  });

  it("não publica conteúdo marcado como de biblioteca", () => {
    expect(
      can(teacher, "content:publish_class_scope", {
        classIds: ["t1"],
        contentScope: "library",
      }),
    ).toBe(false);
  });

  it("lê rascunho — é ele quem escreve", () => {
    expect(canSeeContentStatus("teacher", "draft")).toBe(true);
  });
});

describe("gestor", () => {
  it("publica na biblioteca e lê tudo", () => {
    expect(can(manager, "content:publish_library_scope")).toBe(true);
    expect(can(manager, "progress:read_all")).toBe(true);
    expect(can(manager, "management:manage_users")).toBe(true);
  });

  it("lê qualquer turma, sem pertencer a nenhuma", () => {
    expect(
      can(manager, "progress:read_class_students", { classIds: ["t9"] }),
    ).toBe(true);
  });
});

describe("roleCan", () => {
  it("é a base da matriz, sem olhar escopo", () => {
    expect(roleCan("student", "content:read_published")).toBe(true);
    expect(roleCan("student", "management:manage_users")).toBe(false);
  });
});
