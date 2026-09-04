import type { Metadata } from "next";

import { OnboardingFlow } from "@/features/onboarding/components/onboarding-flow";

export const metadata: Metadata = { title: "Bem-vindo · LeDuc" };

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
