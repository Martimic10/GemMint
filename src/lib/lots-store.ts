import type { LotPriceReport } from "@/lib/lot-report";
import {
  deleteUserLot,
  listUserLots,
  saveUserLot,
} from "@/lib/user-data";

export async function loadLotsAsync(
  uid?: string | null
): Promise<LotPriceReport[]> {
  if (typeof window === "undefined" || !uid) return [];
  try {
    return await listUserLots(uid);
  } catch (error) {
    console.warn("Could not load lots:", error);
    return [];
  }
}

export async function saveLotReport(
  report: LotPriceReport,
  uid?: string | null
): Promise<void> {
  if (!uid) return;
  await saveUserLot(uid, report);
}

export async function deleteLot(
  lotId: string,
  uid?: string | null
): Promise<LotPriceReport[]> {
  if (!uid) return [];
  await deleteUserLot(uid, lotId);
  return loadLotsAsync(uid);
}
