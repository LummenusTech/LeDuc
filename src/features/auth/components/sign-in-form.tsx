"use client";

import { Check, Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { ROUTES } from "@/config/routes";
import { dataSource } from "@/core/data/provider";
import { toUserMessage } from "@/core/domain/errors";
import { useSignIn } from "@/features/auth/hooks";
import { cn } from "@/lib/cn";

/**
 * Entrada por e-mail e senha, conforme a tela recebida.
 *
 * Cuidados que a tela já previa e que aqui viram comportamento: "salvar minha
 * senha" marcado por padrão e botão de revelar a senha — os dois reduzem o
 * atrito de digitar credenciais para quem ainda está em alfabetização.
 */
export function SignInForm() {
  const router = useRouter();
  const signIn = useSignIn();

  const [email, setEmail] = useState("user.estudante@gmail.com");
  const [password, setPassword] = useState("leduc123");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await signIn.mutateAsync({ email, password, rememberMe });
      const seenOnboarding = await dataSource.auth.hasSeenOnboarding();
      router.push(seenOnboarding ? ROUTES.student.home : ROUTES.onboarding);
    } catch {
      // O erro é exibido abaixo, a partir de `signIn.error`.
    }
  }

  return (
    <div className="relative w-full max-w-md rounded-card border border-line bg-surface p-7 shadow-raised sm:p-10">
      <div className="flex justify-center">
        <BrandMark className="size-14" />
      </div>

      <h1 className="mt-5 text-center text-2xl font-bold leading-tight text-ink sm:text-3xl">
        Bem-vindo,
        <br />
        <span className="text-primary">estudante</span> ao LeDuc
      </h1>
      <p className="mt-2 text-center text-sm text-ink-muted">
        Construindo seu futuro
      </p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
        <FormField id="email" label="E-mail">
          <div className="flex min-h-touch items-center gap-3 rounded-pill border-2 border-tint-violeta-cover bg-surface px-5 focus-within:border-primary">
            <Mail className="size-5 shrink-0 text-primary" aria-hidden />
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="E-mail"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-muted focus-visible:outline-none"
            />
          </div>
        </FormField>

        <FormField id="password" label="Senha">
          <div className="flex min-h-touch items-center gap-3 rounded-pill border-2 border-tint-violeta-cover bg-surface px-5 focus-within:border-primary">
            <Lock className="size-5 shrink-0 text-primary" aria-hidden />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              required
              placeholder="Senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-muted focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
              className="shrink-0 rounded-full p-1 text-ink-muted hover:text-primary"
            >
              {showPassword ? (
                <EyeOff className="size-5" aria-hidden />
              ) : (
                <Eye className="size-5" aria-hidden />
              )}
            </button>
          </div>
        </FormField>

        <button
          type="button"
          onClick={() => setRememberMe((current) => !current)}
          aria-pressed={rememberMe}
          className="flex items-center gap-2.5 self-start rounded-control py-1 text-sm text-ink-muted"
        >
          <span
            className={cn(
              "grid size-5 shrink-0 place-items-center rounded border-2 transition-colors",
              rememberMe
                ? "border-primary bg-primary text-ink-inverse"
                : "border-line bg-surface",
            )}
            aria-hidden
          >
            {rememberMe && <Check className="size-3.5" strokeWidth={3} />}
          </span>
          Salvar a minha senha
        </button>

        <Link
          href={ROUTES.auth.recoverPassword}
          className="self-start text-sm font-semibold text-primary hover:underline"
        >
          Esqueceu sua senha?
        </Link>

        {signIn.error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {toUserMessage(signIn.error)}
          </p>
        )}

        <Button type="submit" isLoading={signIn.isPending} className="w-full">
          {signIn.isPending ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
