import type { Metadata } from "next";

import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata: Metadata = { title: "Entrar · LeDuc" };

export default function SignInPage() {
  return <SignInForm />;
}
