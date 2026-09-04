import type { Metadata } from "next";

import { AllTracks } from "@/features/content/components/all-tracks";

export const metadata: Metadata = { title: "Todas as trilhas · LeDuc" };

export default function Page() {
  return <AllTracks />;
}
