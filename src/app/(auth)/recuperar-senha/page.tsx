import type { Metadata } from "next";

import { RecoverPasswordForm } from "@/features/auth/components/recover-password-form";

export const metadata: Metadata = { title: "Recuperar senha · LeDuc" };

export default function RecoverPasswordPage() {
  return <RecoverPasswordForm />;
}
