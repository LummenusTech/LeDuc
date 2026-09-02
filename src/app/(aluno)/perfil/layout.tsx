import type { ReactNode } from "react";

import { ProfileHeader } from "@/features/analytics/components/profile-header";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <ProfileHeader />
      {children}
    </div>
  );
}
