"use client";

import { CheckCircle2, ChevronLeft, Flame, Sparkles, Volume2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";

import { SpeakButton } from "@/components/a11y/speak-button";
import { useSpeak } from "@/components/a11y/use-speak";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { dataSource } from "@/core/data/provider";
import { cn } from "@/lib/cn";

type Step = {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: "Bem-vindo ao LeDuc",
    description:
      "Aqui você aprende a ler e escrever no seu ritmo, um passo de cada vez.",
  },
  {
    icon: Volume2,
    title: "Tudo pode ser ouvido",
    description:
      "Toque no alto-falante em qualquer tela para ouvir o texto em voz alta.",
  },
  {
    icon: Flame,
    title: "Você ganha pontos todo dia",
    description:
      "Cada atividade concluída rende pontos e mantém sua sequência de dias viva.",
  },
  {
    icon: CheckCircle2,
    title: "Você nunca fica travado",
    description:
      "Errou uma questão? Sem problema. O LeDuc mostra a resposta certa e você segue em frente.",
  },
];

/**
 * Introdução de primeiro acesso — RN de onboarding que a rota `/onboarding`
 * reservava sem tela nenhuma por trás.
 *
 * Curta de propósito (4 passos, uma frase cada) e com áudio em todos eles:
 * é a primeira tela de quem ainda está em alfabetização, então texto sozinho
 * não pode ser a única forma de entender o que fazer aqui.
 */
export function OnboardingFlow() {
  const router = useRouter();
  const { speak } = useSpeak();
  const [stepIndex, setStepIndex] = useState(0);

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  useEffect(() => {
    speak(`${step.title}. ${step.description}`);
  }, [step, speak]);

  async function finish() {
    await dataSource.auth.markOnboardingSeen();
    router.push(ROUTES.student.home);
  }

  return (
    <div className="relative w-full max-w-md rounded-card bg-surface p-7 shadow-raised sm:p-9">
      <div className="flex items-center justify-between">
        {isFirst ? (
          <BrandMark className="size-10" />
        ) : (
          <button
            type="button"
            onClick={() => setStepIndex((i) => i - 1)}
            aria-label="Voltar"
            className="grid size-11 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface-muted"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
        )}

        <button
          type="button"
          onClick={finish}
          className="rounded-control px-2 py-1 text-sm font-semibold text-ink-muted hover:text-primary"
        >
          Pular
        </button>
      </div>

      <div className="mt-4 flex flex-col items-center text-center">
        <span
          className="grid size-20 place-items-center rounded-full bg-primary-soft text-primary"
          aria-hidden
        >
          <step.icon className="size-10" />
        </span>

        <h1 className="mt-5 text-2xl font-bold leading-tight text-ink">
          {step.title}
        </h1>
        <p className="mt-2 text-ink-muted">{step.description}</p>

        <SpeakButton
          text={`${step.title}. ${step.description}`}
          className="mt-4"
        />
      </div>

      <div className="mt-7 flex items-center justify-center gap-2">
        {STEPS.map((s, index) => (
          <span
            key={s.title}
            aria-hidden
            className={cn(
              "h-2 rounded-pill transition-all",
              index === stepIndex ? "w-6 bg-primary" : "w-2 bg-surface-muted",
            )}
          />
        ))}
      </div>

      <Button
        onClick={() => (isLast ? finish() : setStepIndex((i) => i + 1))}
        className="mt-6 w-full"
      >
        {isLast ? "Começar agora" : "Continuar"}
      </Button>
    </div>
  );
}
