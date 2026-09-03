import type { Metadata } from "next";

import { EditProfileForm } from "@/features/analytics/components/edit-profile-form";

export const metadata: Metadata = { title: "Editar perfil · LeDuc" };

export default function Page() {
  return <EditProfileForm />;
}
