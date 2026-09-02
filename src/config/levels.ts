/**
 * Limiares de XP por nível (RN-X8).
 *
 * Tabela explícita, e não uma fórmula: o time pedagógico precisa poder olhar a
 * progressão e dizer "o nível 4 está longe demais" sem interpretar uma equação.
 *
 * A curva é suave no começo — os primeiros níveis chegam rápido, porque quem
 * está aprendendo a ler precisa ver que avançou — e vai se espaçando depois.
 *
 * `XP_LEVEL_THRESHOLDS[n]` é o XP acumulado necessário para ATINGIR o nível
 * `n + 1`. O índice 0 é o nível 1, que todo mundo tem ao começar.
 */
export const XP_LEVEL_THRESHOLDS: readonly number[] = [
  0, // nível 1
  50, // nível 2
  150, // nível 3
  300, // nível 4
  500, // nível 5
  750, // nível 6
  1_050, // nível 7
  1_400, // nível 8
  1_800, // nível 9
  2_250, // nível 10
  2_750, // nível 11
  3_300, // nível 12
];

/**
 * XP a mais por nível depois do último limiar da tabela.
 * Evita que quem passa do nível 12 fique sem progressão.
 */
export const XP_PER_LEVEL_BEYOND_TABLE = 600;
