import type { Metadata } from "next";

import { SettingsPage } from "@/features/analytics/components/settings-page";

export const metadata: Metadata = { title: "Configurações · LeDuc" };

export default function Page() {
  return <SettingsPage />;
}
