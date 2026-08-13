import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import type { ScanPackId } from "@/lib/scan-packs";
import { getScanPack } from "@/lib/scan-packs";

function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY."
    );
  }

  // Support escaped newlines from .env files
  privateKey = privateKey.replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export function adminAuth() {
  return getAuth(getAdminApp());
}

export function adminDb() {
  return getFirestore(getAdminApp());
}

export async function verifyFirebaseIdToken(idToken: string) {
  return adminAuth().verifyIdToken(idToken);
}

export interface FulfilledPurchase {
  alreadyFulfilled: boolean;
  uid: string;
  packId: ScanPackId;
  credits: number;
  creditKind: "grade" | "lot";
  sessionId: string;
}

/**
 * Idempotent credit grant after a successful Stripe Checkout Session.
 * Uses the Stripe session id as the Firestore purchase document id.
 */
export async function fulfillCheckoutSession(params: {
  sessionId: string;
  uid: string;
  packId: string;
  amountTotalCents?: number | null;
  customerEmail?: string | null;
}): Promise<FulfilledPurchase> {
  const pack = getScanPack(params.packId);
  if (!pack) {
    throw new Error(`Unknown packId: ${params.packId}`);
  }

  const uid = params.uid;
  const sessionId = params.sessionId;
  const purchaseRef = adminDb()
    .collection("users")
    .doc(uid)
    .collection("purchases")
    .doc(sessionId);
  const userRef = adminDb().collection("users").doc(uid);

  const result = await adminDb().runTransaction(async (tx) => {
    const existing = await tx.get(purchaseRef);
    if (existing.exists) {
      return {
        alreadyFulfilled: true,
        uid,
        packId: pack.id,
        credits: pack.credits,
        creditKind: pack.creditKind,
        sessionId,
      } satisfies FulfilledPurchase;
    }

    const userSnap = await tx.get(userRef);
    const data = userSnap.exists ? userSnap.data() ?? {} : {};
    const isLot = pack.creditKind === "lot";

    const currentCredits =
      typeof data.credits === "number" ? data.credits : 1;
    const currentLot =
      typeof data.lotCredits === "number" ? data.lotCredits : 0;
    const totalPurchased =
      typeof data.totalPurchased === "number" ? data.totalPurchased : 0;
    const totalLotPurchased =
      typeof data.totalLotPurchased === "number" ? data.totalLotPurchased : 0;

    const amount =
      typeof params.amountTotalCents === "number"
        ? params.amountTotalCents / 100
        : pack.price;

    const purchase = {
      id: sessionId,
      packId: pack.id,
      packName: pack.name,
      credits: pack.credits,
      amount,
      status: "completed",
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      stripeSessionId: sessionId,
      creditKind: pack.creditKind,
      customerEmail: params.customerEmail ?? null,
      createdAt: FieldValue.serverTimestamp(),
    };

    const nextCredits = currentCredits + pack.credits;

    tx.set(
      userRef,
      isLot
        ? {
            lotCredits: currentLot + pack.credits,
            totalLotPurchased: totalLotPurchased + pack.credits,
            welcomeDismissed: true,
            updatedAt: FieldValue.serverTimestamp(),
          }
        : {
            credits: nextCredits,
            totalPurchased: totalPurchased + pack.credits,
            // High-water mark for sidebar tank — full bar after purchase.
            creditBalancePeak: nextCredits,
            welcomeDismissed: true,
            updatedAt: FieldValue.serverTimestamp(),
          },
      { merge: true }
    );
    tx.set(purchaseRef, purchase);

    return {
      alreadyFulfilled: false,
      uid,
      packId: pack.id,
      credits: pack.credits,
      creditKind: pack.creditKind,
      sessionId,
    } satisfies FulfilledPurchase;
  });

  return result;
}
