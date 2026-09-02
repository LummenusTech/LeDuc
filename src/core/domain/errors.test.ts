import { describe, expect, it } from "vitest";

import {
  AuthError,
  DomainError,
  isLeDucError,
  NetworkError,
  NotFoundError,
  toUserMessage,
  ValidationError,
} from "@/core/domain/errors";

describe("taxonomia de erros", () => {
  it("DomainError é violação de regra, com mensagem segura genérica", () => {
    const error = new DomainError("lição bloqueada");
    expect(error.kind).toBe("domain");
    expect(error.name).toBe("DomainError");
    expect(error.userMessage).toBe("Não foi possível concluir esta ação agora.");
  });

  it("ValidationError aponta o campo e aceita mensagem customizada", () => {
    const error = new ValidationError(
      "e-mail inválido",
      "email",
      "Verifique o e-mail informado.",
    );
    expect(error.kind).toBe("validation");
    expect(error.field).toBe("email");
    expect(error.userMessage).toBe("Verifique o e-mail informado.");
  });

  it("ValidationError usa mensagem genérica quando nenhuma é informada", () => {
    const error = new ValidationError("payload inválido");
    expect(error.field).toBeNull();
    expect(error.userMessage).toBe("Confira as informações e tente de novo.");
  });

  it("NetworkError é sempre reenviável", () => {
    const error = new NetworkError("timeout");
    expect(error.kind).toBe("network");
    expect(error.isRetryable).toBe(true);
  });

  it("AuthError orienta a entrar de novo", () => {
    const error = new AuthError("sessão expirada");
    expect(error.kind).toBe("auth");
    expect(error.userMessage).toBe(
      "Sua sessão expirou. Entre de novo para continuar.",
    );
  });

  it("NotFoundError orienta um estado vazio", () => {
    const error = new NotFoundError("trilha inexistente");
    expect(error.kind).toBe("not_found");
    expect(error.userMessage).toBe("Não encontramos este conteúdo.");
  });
});

describe("isLeDucError", () => {
  it("reconhece qualquer erro da taxonomia", () => {
    expect(isLeDucError(new DomainError("x"))).toBe(true);
    expect(isLeDucError(new Error("erro comum"))).toBe(false);
    expect(isLeDucError("não é nem erro")).toBe(false);
  });
});

describe("toUserMessage", () => {
  it("devolve a mensagem segura do erro conhecido", () => {
    expect(toUserMessage(new AuthError("x"))).toBe(
      "Sua sessão expirou. Entre de novo para continuar.",
    );
  });

  it("devolve mensagem genérica para erro desconhecido", () => {
    expect(toUserMessage(new Error("boom"))).toBe(
      "Algo não funcionou como esperado. Tente de novo em instantes.",
    );
    expect(toUserMessage("string qualquer")).toBe(
      "Algo não funcionou como esperado. Tente de novo em instantes.",
    );
  });
});
