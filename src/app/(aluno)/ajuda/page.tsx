import type { Metadata } from "next";
import { Mail, MessageCircleQuestion, Phone } from "lucide-react";

import { Card, HighlightHeading } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Ajuda · LeDuc" };

const FAQ = [
  {
    question: "Errei uma questão. E agora?",
    answer:
      "Você tem até 3 tentativas por questão. Errando todas, o LeDuc mostra a resposta certa com uma explicação e você segue em frente — nunca fica travado numa questão.",
  },
  {
    question: "Preciso estar online para estudar?",
    answer:
      "Não. Suas respostas ficam salvas no aparelho e enviadas quando a conexão voltar. Só a resposta curta com correção automática precisa de internet — sem ela, sua resposta fica guardada para conferir depois.",
  },
  {
    question: "Posso repetir uma lição já concluída?",
    answer:
      "Sim, quando quiser. Revisar não muda o seu domínio registrado nem tira nenhuma conquista — é só reforço.",
  },
  {
    question: "Como funciona o XP?",
    answer:
      "Você ganha XP em toda atividade concluída, mesmo errando tudo. Acertar de primeira rende mais. O XP nunca diminui.",
  },
  {
    question: "Perco minha sequência de dias se pular um dia?",
    answer:
      "A sequência conta os dias em que você entrou no LeDuc. Deixar de entrar por um dia inteiro zera a contagem atual — mas o seu recorde fica registrado para sempre.",
  },
];

export default function Page() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <HighlightHeading
        highlight="Ajuda"
        description="Perguntas frequentes e como falar com a gente"
      />

      <ul className="flex flex-col gap-3">
        {FAQ.map((item) => (
          <li key={item.question}>
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <MessageCircleQuestion
                  className="mt-0.5 size-5 shrink-0 text-primary"
                  aria-hidden
                />
                <div>
                  <p className="font-semibold text-ink">{item.question}</p>
                  <p className="mt-1 text-sm text-ink-muted">{item.answer}</p>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Card className="p-5">
        <h2 className="font-bold text-ink">Fale com a gente</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Não achou o que precisava? A equipe do LeDuc responde por estes
          canais.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <a
            href="mailto:suporte@leduc.org.br"
            className="flex min-h-touch items-center gap-3 rounded-control px-2 hover:bg-surface-muted"
          >
            <Mail className="size-5 shrink-0 text-primary" aria-hidden />
            <span className="text-sm font-medium text-ink">
              suporte@leduc.org.br
            </span>
          </a>
          <a
            href="tel:+550000000000"
            className="flex min-h-touch items-center gap-3 rounded-control px-2 hover:bg-surface-muted"
          >
            <Phone className="size-5 shrink-0 text-primary" aria-hidden />
            <span className="text-sm font-medium text-ink">
              0800 000 0000
            </span>
          </a>
        </div>
      </Card>
    </div>
  );
}
