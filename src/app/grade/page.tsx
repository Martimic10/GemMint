import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Grade My Card",
  description:
    "Upload front and back images to predict PSA and Beckett grades with GemMint.",
};

/** Legacy /grade route — send everyone into the real dashboard grader. */
export default function GradePage() {
  redirect("/dashboard?view=new-grade");
}
