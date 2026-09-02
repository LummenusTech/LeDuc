/**
 * Números que governam a atividade, a revisão e a sessão de estudo.
 *
 * Todos aqui, e não espalhados pelo código, porque são decisões pedagógicas:
 * o time que define "três tentativas" ou "revisar depois de sete dias" precisa
 * conseguir mudar isso sem ler TypeScript.
 */

/**
 * Tentativas por item antes de o app revelar a resposta e avançar (RN-A1).
 * Existe um limite para que ninguém fique preso num item — e ele é alto o
 * bastante para que errar não seja o fim da tentativa.
 */
export const MAX_ATTEMPTS_PER_ITEM = 3;

/** Dias após a conclusão até a lição entrar na fila de revisão (RN-R1). */
export const REVIEW_AFTER_DAYS = 7;

/**
 * Itens revisados mínimos para exibir a taxa de retenção (RN-R6).
 * Abaixo disso a interface mostra "—": uma porcentagem tirada de duas
 * respostas engana mais do que informa.
 */
export const MIN_ITEMS_FOR_RETENTION = 10;

/**
 * Inatividade que encerra a sessão de estudo (RN-T2). Sem isso, uma aba
 * esquecida aberta acumularia tempo e renderia XP.
 */
export const IDLE_TIMEOUT_MINUTES = 5;

/** Quantas revisões sugerir na tela inicial de uma vez (RN-R3). */
export const SUGGESTED_REVIEWS_LIMIT = 1;
