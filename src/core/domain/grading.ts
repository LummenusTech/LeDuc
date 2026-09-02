import type { Item } from "@/core/domain/types";

/**
 * Correção de itens (RN-G1 a RN-G5).
 *
 * Um contrato único para os quatro tipos: o player entrega uma resposta e
 * recebe um resultado, sem saber que tipo de item está exibindo. Acrescentar um
 * tipo novo é escrever um caso aqui e um renderizador na interface — o motor da
 * atividade não muda.
 */

export type ItemAnswer =
  | { type: "multiple_choice"; optionId: string }
  | { type: "column_match"; pairs: { leftId: string; rightId: string }[] }
  | { type: "fill_blanks"; values: string[] }
  | { type: "short_answer"; text: string };

export type GradeOutcome =
  | { status: "correct"; explanation: string }
  | { status: "incorrect"; explanation: string }
  | { status: "pending_review"; message: string };

export const PENDING_REVIEW_MESSAGE =
  "Recebemos sua resposta. Vamos conferir assim que você estiver conectado.";

/**
 * Normaliza um texto para comparação.
 *
 * Mexe em espaços e caixa, e nada mais. **Não corrige ortografia** (RN-G4):
 * numa plataforma de alfabetização, escrever "kasa" é justamente o erro que o
 * produto existe para tratar — engolir isso seria mentir para o aluno e para o
 * professor. Acento é a única tolerância, e é decisão de conteúdo por item:
 * nos primeiros níveis ele ainda não foi ensinado.
 */
export function normalizeText(
  value: string,
  { ignoreAccents }: { ignoreAccents: boolean },
): string {
  const collapsed = value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");

  return ignoreAccents
    ? collapsed.normalize("NFD").replace(/\p{Diacritic}/gu, "")
    : collapsed;
}

function gradeMultipleChoice(
  item: Extract<Item, { type: "multiple_choice" }>,
  answer: Extract<ItemAnswer, { type: "multiple_choice" }>,
): GradeOutcome {
  const isCorrect = answer.optionId === item.content.correctOptionId;
  return isCorrect
    ? { status: "correct", explanation: item.explanation }
    : { status: "incorrect", explanation: item.explanation };
}

function gradeColumnMatch(
  item: Extract<Item, { type: "column_match" }>,
  answer: Extract<ItemAnswer, { type: "column_match" }>,
): GradeOutcome {
  const { correctPairs } = item.content;

  // Tudo ou nada (RN-G2): associar metade das colunas não é meio-acerto, é uma
  // associação errada — e "quase certo" não é um conceito que o domínio tenha.
  const expected = new Map(
    correctPairs.map((pair) => [pair.leftId, pair.rightId]),
  );

  const isCorrect =
    answer.pairs.length === correctPairs.length &&
    answer.pairs.every((pair) => expected.get(pair.leftId) === pair.rightId);

  return isCorrect
    ? { status: "correct", explanation: item.explanation }
    : { status: "incorrect", explanation: item.explanation };
}

function gradeFillBlanks(
  item: Extract<Item, { type: "fill_blanks" }>,
  answer: Extract<ItemAnswer, { type: "fill_blanks" }>,
): GradeOutcome {
  const { acceptedAnswers } = item.content;
  const options = { ignoreAccents: item.ignoreAccents };

  const isCorrect =
    answer.values.length === acceptedAnswers.length &&
    acceptedAnswers.every((variants, index) => {
      const given = normalizeText(answer.values[index] ?? "", options);
      return variants.some(
        (variant) => normalizeText(variant, options) === given,
      );
    });

  return isCorrect
    ? { status: "correct", explanation: item.explanation }
    : { status: "incorrect", explanation: item.explanation };
}

/**
 * Corrige o que dá para corrigir no aparelho.
 *
 * Devolve `null` quando a correção depende da IA e há rede — o sinal de que o
 * chamador precisa aguardar `AiRepository`. Sem rede, a resposta curta é aceita
 * como `pending_review` (RN-G5): ficar offline não pode travar o aluno.
 */
export function gradeItemLocally(
  item: Item,
  answer: ItemAnswer,
  { isOnline }: { isOnline: boolean },
): GradeOutcome | null {
  if (item.type !== answer.type) {
    // Tipo de resposta incompatível com o item é bug de programação, não erro
    // do aluno — e silenciar viraria um "você errou" injusto.
    throw new Error(
      `Resposta do tipo "${answer.type}" enviada para item "${item.type}".`,
    );
  }

  switch (item.type) {
    case "multiple_choice":
      return gradeMultipleChoice(
        item,
        answer as Extract<ItemAnswer, { type: "multiple_choice" }>,
      );

    case "column_match":
      return gradeColumnMatch(
        item,
        answer as Extract<ItemAnswer, { type: "column_match" }>,
      );

    case "fill_blanks":
      return gradeFillBlanks(
        item,
        answer as Extract<ItemAnswer, { type: "fill_blanks" }>,
      );

    case "short_answer":
      return isOnline
        ? null
        : { status: "pending_review", message: PENDING_REVIEW_MESSAGE };
  }
}
