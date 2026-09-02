import type { Metadata } from "next";

import { TracksBrowser } from "@/features/content/components/tracks-browser";

export const metadata: Metadata = { title: "Trilhas · LeDuc" };

export default function TracksPage() {
  return <TracksBrowser />;
}
