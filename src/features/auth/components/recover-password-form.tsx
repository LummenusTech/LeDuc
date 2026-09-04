"use client";

import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { ROUTES } from "@/config/routes";
import { useRequestPasswordReset } from "@/features/auth/hooks";

/**
 * Pedido de recuperação de senha.
 *
 * Não existe servidor de e-mail no protótipo — a confirmação aparece do
 * mesmo jeito com qualquer e-mail digitado, de propósito: uma tela de
 * recuperação nunca deve dizer se uma conta existe ou não.
 */
export function RecoverPasswordForm() {
  const [email, setEmail] = useState("");
  const requestReset = useRequestPasswordReset();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await requestReset.mutateAsync(email);
  }

  if (requestReset.isSuccess) {
    return (
      <div className="relative w-full max-w-md rounded-card border border-line bg-surface p-7 text-center shadow-raised sm:p-10">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary-soft text-primary">
          <MailCheck className="size-7" aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-ink">Verifique seu e-mail</h1>
        <p className="mt-2 text-ink-muted">
          Se <strong className="text-ink">{email}</strong> estiver cadastrado,
          você vai receber um link para escolher uma senha nova.
        </p>
        <Link
          href={ROUTES.auth.signIn}
          className="mt-7 inline-flex min-h-touch items-center gap-2 rounded-control bg-primary px-6 font-semibold text-ink-inverse transition-colors hover:bg-primary-hover"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Voltar para entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md rounded-card border border-line bg-surface p-7 shadow-raised sm:p-10">
      <div className="flex justify-center">
        <BrandMark className="size-14" />
      </div>

      <h1 className="mt-5 text-center text-2xl font-bold leading-tight text-ink sm:text-3xl">
        Esqueceu sua senha?
      </h1>
      <p className="mt-2 text-center text-sm text-ink-muted">
        Digite o e-mail da sua conta. A gente manda um link pra escolher uma
        senha nova.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
        <FormField id="recover-email" label="E-mail">
          <div className="flex min-h-touch items-center gap-3 rounded-pill border-2 border-tint-violeta-cover bg-surface px-5 focus-within:border-primary">
            <Mail className="size-5 shrink-0 text-primary" aria-hidden />
            <input
              id="recover-email"
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

        <Button type="submit" isLoading={requestReset.isPending} className="w-full">
          {requestReset.isPending ? "Enviando…" : "Enviar link"}
        </Button>

        <Link
          href={ROUTES.auth.signIn}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 self-center text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Voltar para entrar
        </Link>
      </form>
    </div>
  );
}
