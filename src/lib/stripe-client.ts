"use client";

import { getFirebaseAuth } from "@/lib/firebase";
import type { ScanPackId } from "@/lib/scan-packs";

async function authHeader(): Promise<string> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sign in required.");
  const token = await user.getIdToken();
  return `Bearer ${token}`;
}

export async function startStripeCheckout(
  packId: ScanPackId
): Promise<{ url: string; sessionId: string }> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: await authHeader(),
    },
    body: JSON.stringify({ packId }),
  });
  const data = (await res.json()) as { url?: string; sessionId?: string; error?: string };
  if (!res.ok || !data.url || !data.sessionId) {
    throw new Error(data.error || "Could not start Stripe Checkout.");
  }
  return { url: data.url, sessionId: data.sessionId };
}

export async function confirmStripeCheckout(sessionId: string): Promise<{
  ok: boolean;
  alreadyFulfilled?: boolean;
  packId?: string;
  credits?: number;
  creditKind?: "grade" | "lot";
  packName?: string;
  error?: string;
}> {
  const res = await fetch("/api/checkout/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: await authHeader(),
    },
    body: JSON.stringify({ sessionId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Could not confirm payment.");
  }
  return data;
}
