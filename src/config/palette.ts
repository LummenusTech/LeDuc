/**
 * Tintas categóricas — uma por trilha.
 *
 * Os valores de cor vivem exclusivamente em `src/app/globals.css`. Este módulo
 * mapeia cada tinta para as classes utilitárias correspondentes, porque nomes
 * de classe do Tailwind precisam ser estáticos para sobreviver ao build.
 *
 * Regra de uso: `cover` e `solid` são preenchimentos e nunca recebem texto
 * pequeno. Texto colorido usa sempre `ink`, a única variante com contraste AA.
 * E cor nunca é o único sinal — todo card e chip carrega também ícone e rótulo.
 */

export const TRACK_TINTS = ["violeta", "verde", "pessego", "azul"] as const;

export type TrackTint = (typeof TRACK_TINTS)[number];

type TintClasses = {
  /** Capa do card. Pastel. */
  cover: string;
  /** Preenchimento de barra de progresso, ícone. Saturado. */
  bar: string;
  /** Fundo de chip. */
  chip: string;
  /** Texto e ícone sobre `chip` ou sobre branco. Contraste AA. */
  ink: string;
  /** Borda sutil no tom da tinta. */
  border: string;
};

export const TINT_CLASSES: Record<TrackTint, TintClasses> = {
  violeta: {
    cover: "bg-tint-violeta-cover",
    bar: "bg-tint-violeta-solid",
    chip: "bg-tint-violeta-soft",
    ink: "text-tint-violeta-ink",
    border: "border-tint-violeta-cover",
  },
  verde: {
    cover: "bg-tint-verde-cover",
    bar: "bg-tint-verde-solid",
    chip: "bg-tint-verde-soft",
    ink: "text-tint-verde-ink",
    border: "border-tint-verde-cover",
  },
  pessego: {
    cover: "bg-tint-pessego-cover",
    bar: "bg-tint-pessego-solid",
    chip: "bg-tint-pessego-soft",
    ink: "text-tint-pessego-ink",
    border: "border-tint-pessego-cover",
  },
  azul: {
    cover: "bg-tint-azul-cover",
    bar: "bg-tint-azul-solid",
    chip: "bg-tint-azul-soft",
    ink: "text-tint-azul-ink",
    border: "border-tint-azul-cover",
  },
};

export function tint(token: TrackTint): TintClasses {
  return TINT_CLASSES[token];
}
