import { IDLE_TIMEOUT_MINUTES } from "@/config/activity-rules";

/**
 * Tempo de permanência no aplicativo (RN-T1 a RN-T3).
 *
 * Alimenta o marco repetível de 30 minutos e o "tempo de estudo" do perfil.
 *
 * Só conta tempo com atividade real: uma aba esquecida aberta a noite inteira
 * não pode render XP. O limite de inatividade é o que separa "estudou meia
 * hora" de "deixou o telefone na mesa".
 */

export type StudySession = {
  /** Instante da última interação observada. */
  lastActivityAt: string;
  /** Minutos já contabilizados nesta sessão. */
  accumulatedMinutes: number;
};

const MS_PER_MINUTE = 60_000;

export function startStudySession(now: string): StudySession {
  return { lastActivityAt: now, accumulatedMinutes: 0 };
}

/**
 * Registra um sinal de atividade (toque, resposta, navegação).
 *
 * Se o intervalo desde o último sinal passou de `IDLE_TIMEOUT_MINUTES`, o
 * período é descartado e a contagem recomeça a partir de agora — o aluno esteve
 * ausente, não estudando.
 */
export function recordActivity(
  session: StudySession,
  now: string,
): StudySession {
  const elapsedMinutes =
    (new Date(now).getTime() - new Date(session.lastActivityAt).getTime()) /
    MS_PER_MINUTE;

  // Relógio do aparelho para trás: ignora o intervalo em vez de subtrair tempo.
  if (elapsedMinutes < 0) {
    return { ...session, lastActivityAt: now };
  }

  if (elapsedMinutes > IDLE_TIMEOUT_MINUTES) {
    return { ...session, lastActivityAt: now };
  }

  return {
    lastActivityAt: now,
    accumulatedMinutes: session.accumulatedMinutes + elapsedMinutes,
  };
}

/** Minutos inteiros, que é o que alimenta os marcos de XP. */
export function totalStudyMinutes(session: StudySession): number {
  return Math.floor(session.accumulatedMinutes);
}
