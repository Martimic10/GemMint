import type { Metadata } from "next";
import { ForceLightTheme } from "@/components/theme/theme-provider";

export const metadata: Metadata = {
  title: "Demo | GemMint AI",
  description:
    "Explore a read-only GemMint demo with AI grading reports, collection value, and portfolio analytics.",
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ForceLightTheme>{children}</ForceLightTheme>;
}
