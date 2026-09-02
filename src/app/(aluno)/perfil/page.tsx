import type { Metadata } from "next";

import { ProfileSummary } from "@/features/analytics/components/profile-summary";

export const metadata: Metadata = { title: "Perfil · LeDuc" };

export default function ProfilePage() {
  return <ProfileSummary />;
}
