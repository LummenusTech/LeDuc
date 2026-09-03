import type { Metadata } from "next";

import { NotificationCenter } from "@/features/progress/components/notification-center";

export const metadata: Metadata = { title: "Notificações · LeDuc" };

export default function Page() {
  return <NotificationCenter />;
}
