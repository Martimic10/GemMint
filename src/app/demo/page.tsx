"use client";

import { DemoModeProvider } from "@/components/demo/demo-provider";
import { DemoWorkspace } from "@/components/demo/demo-workspace";

/**
 * Isolated Demo Mode — static curated data, no auth required, no Firestore writes.
 * Visiting /demo while signed in still shows demo data (does not touch the real account).
 */
export default function DemoPage() {
  return (
    <DemoModeProvider>
      <DemoWorkspace />
    </DemoModeProvider>
  );
}
