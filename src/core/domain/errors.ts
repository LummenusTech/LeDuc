/**
 * Taxonomia de erros.
 *
 * O tipo do erro determina o tratamento, e a distinção que mais importa é entre
 * "erro de rede" e "erro de programação": o primeiro é rotina para este público
 * e nunca pode perder dado; o segundo é bug e deve gritar em desenvolvimento.
 */

export type ErrorKind =
  | "domain"
  | "validation"
  | "network"
  | "auth"
  | "not_found";

export abstract class LeDucError extends Error {
  abstract readonly kind: ErrorKind;
  /** Mensagem segura para exibir ao aluno, sem jargão técnico. */
  abstract readonly userMessage: string;
}

/** Violação de regra de negócio: lição bloqueada, item já resolvido. É bug. */
export class DomainError extends LeDucError {
  readonly kind = "domain" as const;
  readonly userMessage = "Não foi possível concluir esta ação agora.";

  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

/** Payload fora do schema. Aponta o campo — nunca é engolido. */
export class ValidationError extends LeDucError {
  readonly kind = "validation" as const;

  constructor(
    message: string,
    readonly field: string | null = null,
    readonly userMessage = "Confira as informações e tente de novo.",
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Offline ou tempo esgotado.
 *
 * `isRetryable` é o que autoriza a fila a reenviar. Um erro de rede jamais
 * descarta a resposta do aluno: ela vai para a fila e sai de lá quando der.
 */
export class NetworkError extends LeDucError {
  readonly kind = "network" as const;
  readonly userMessage =
    "Você está sem conexão. Seu progresso está salvo e será enviado depois.";
  readonly isRetryable = true;

  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class AuthError extends LeDucError {
  readonly kind = "auth" as const;
  readonly userMessage = "Sua sessão expirou. Entre de novo para continuar.";

  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class NotFoundError extends LeDucError {
  readonly kind = "not_found" as const;
  readonly userMessage = "Não encontramos este conteúdo.";

  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export function isLeDucError(error: unknown): error is LeDucError {
  return error instanceof LeDucError;
}

/** Mensagem a exibir para qualquer erro, inclusive os desconhecidos. */
export function toUserMessage(error: unknown): string {
  if (isLeDucError(error)) return error.userMessage;
  return "Algo não funcionou como esperado. Tente de novo em instantes.";
}
