/**
 * Ofensiva — dias consecutivos de ACESSO ao aplicativo.
 *
 * Acesso, não conclusão: entrar já conta. Deixar de acessar um dia zera a
 * sequência. O dia corrente é tolerado enquanto não termina — quem acessou
 * ontem e ainda não acessou hoje mantém a ofensiva viva até o fim do dia.
 */

export type StreakResult = {
  current: number;
  longest: number;
  lastAccessDay: string | null;
};

/** Chave de dia no fuso local: "AAAA-MM-DD". */
export function toDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayKeyToUtcMs(dayKey: string): number {
  const [year, month, day] = dayKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

const MS_PER_DAY = 86_400_000;

function daysBetween(fromDayKey: string, toDayKeyValue: string): number {
  return Math.round(
    (dayKeyToUtcMs(toDayKeyValue) - dayKeyToUtcMs(fromDayKey)) / MS_PER_DAY,
  );
}

/**
 * @param accessDays chaves de dia dos acessos, em qualquer ordem, com repetição
 * @param today      chave do dia corrente
 */
export function computeStreak(
  accessDays: readonly string[],
  today: string,
): StreakResult {
  const uniqueDays = [...new Set(accessDays)].sort();

  if (uniqueDays.length === 0) {
    return { current: 0, longest: 0, lastAccessDay: null };
  }

  let longest = 1;
  let run = 1;

  for (let i = 1; i < uniqueDays.length; i += 1) {
    run = daysBetween(uniqueDays[i - 1], uniqueDays[i]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const lastAccessDay = uniqueDays[uniqueDays.length - 1];
  const gapToToday = daysBetween(lastAccessDay, today);

  // Mais de um dia sem acessar quebra a ofensiva. Acesso futuro (relógio do
  // aparelho adiantado) também não sustenta uma sequência.
  const current = gapToToday === 0 || gapToToday === 1 ? run : 0;

  return { current, longest, lastAccessDay };
}
