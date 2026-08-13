/**
 * Firestore-backed per-user credits, grades, and reports.
 * IndexedDB/localStorage are only used for one-time migration + offline cache.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Timestamp,
} from "firebase/firestore";
import type { DashboardGrade } from "@/lib/dashboard-data";
import type { RichGradeReport } from "@/lib/grade-flow-data";
import { getFirestore } from "@/lib/firebase";
import {
  STORE_CREDITS,
  STORE_GRADES,
  STORE_REPORTS,
  dbGet,
  dbSet,
} from "@/lib/local-db";
import {
  FREE_SCAN_CREDITS,
  getScanPack,
  type ScanPackId,
} from "@/lib/scan-packs";
import type { LotPriceReport } from "@/lib/lot-report";

/** Soft cap for data-URL thumbs in Firestore docs (under 1MB doc limit). */
const MAX_IMAGE_CHARS = 700_000;

export type PurchaseStatus = "completed" | "pending" | "failed" | "refunded";

export interface CreditPurchase {
  id: string;
  packId: ScanPackId;
  packName: string;
  credits: number;
  amount: number;
  status: PurchaseStatus;
  date: string;
  stripeSessionId: string | null;
}

export interface CreditUsage {
  id: string;
  cardName: string;
  date: string;
  reportId?: string;
}

export interface CreditsLedger {
  credits: number;
  totalPurchased: number;
  totalUsed: number;
  /**
   * High-water mark for the grade-credit “tank” UI.
   * Set to the new balance on each purchase so the bar refills to 100%
   * and “used” only counts spends since that top-up.
   */
  creditBalancePeak: number;
  /** Separate balance for Lot Price Reports ($4.99 flat product). */
  lotCredits: number;
  totalLotPurchased: number;
  totalLotUsed: number;
  purchases: CreditPurchase[];
  usages: CreditUsage[];
  welcomeDismissed: boolean;
}

export function emptyLedger(): CreditsLedger {
  return {
    credits: FREE_SCAN_CREDITS,
    totalPurchased: 0,
    totalUsed: 0,
    creditBalancePeak: FREE_SCAN_CREDITS,
    lotCredits: 0,
    totalLotPurchased: 0,
    totalLotUsed: 0,
    purchases: [],
    usages: [],
    welcomeDismissed: true,
  };
}

function normalizeLedger(
  parsed: Partial<CreditsLedger> | null | undefined
): CreditsLedger {
  if (!parsed || typeof parsed !== "object") return emptyLedger();
  const credits =
    typeof parsed.credits === "number" && parsed.credits >= 0
      ? parsed.credits
      : FREE_SCAN_CREDITS;
  const peakRaw =
    typeof parsed.creditBalancePeak === "number" && parsed.creditBalancePeak >= 0
      ? parsed.creditBalancePeak
      : credits;
  return {
    credits,
    totalPurchased:
      typeof parsed.totalPurchased === "number" ? parsed.totalPurchased : 0,
    totalUsed: typeof parsed.totalUsed === "number" ? parsed.totalUsed : 0,
    // Peak never below current balance (covers legacy docs + top-ups).
    creditBalancePeak: Math.max(peakRaw, credits),
    lotCredits:
      typeof parsed.lotCredits === "number" && parsed.lotCredits >= 0
        ? parsed.lotCredits
        : 0,
    totalLotPurchased:
      typeof parsed.totalLotPurchased === "number"
        ? parsed.totalLotPurchased
        : 0,
    totalLotUsed:
      typeof parsed.totalLotUsed === "number" ? parsed.totalLotUsed : 0,
    purchases: Array.isArray(parsed.purchases) ? parsed.purchases : [],
    usages: Array.isArray(parsed.usages) ? parsed.usages : [],
    welcomeDismissed: parsed.welcomeDismissed !== false,
  };
}

function userRef(uid: string) {
  return doc(getFirestore(), "users", uid);
}

function gradesCol(uid: string) {
  return collection(getFirestore(), "users", uid, "grades");
}

function reportsCol(uid: string) {
  return collection(getFirestore(), "users", uid, "reports");
}

function lotsCol(uid: string) {
  return collection(getFirestore(), "users", uid, "lots");
}

function purchasesCol(uid: string) {
  return collection(getFirestore(), "users", uid, "purchases");
}

function usagesCol(uid: string) {
  return collection(getFirestore(), "users", uid, "usages");
}

function compactGrade(g: DashboardGrade): DashboardGrade {
  return {
    ...g,
    imageUrl:
      g.imageUrl && g.imageUrl.length > MAX_IMAGE_CHARS ? null : g.imageUrl,
  };
}

/** Firestore rejects `undefined` field values. */
function stripUndefined<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefined(v)) as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

function compactReport(report: RichGradeReport): RichGradeReport {
  return {
    ...report,
    grade: compactGrade(report.grade),
  };
}

function formatDate(d = new Date()) {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sortGrades(grades: DashboardGrade[]): DashboardGrade[] {
  return [...grades].sort((x, y) => {
    const dx = Date.parse(x.date) || 0;
    const dy = Date.parse(y.date) || 0;
    if (dy !== dx) return dy - dx;
    return y.id.localeCompare(x.id);
  });
}

function mergeById(a: DashboardGrade[], b: DashboardGrade[]): DashboardGrade[] {
  const map = new Map<string, DashboardGrade>();
  for (const g of [...b, ...a]) map.set(g.id, g);
  return sortGrades(Array.from(map.values()));
}

/* ——— Local cache / migration helpers ——— */

function lsCreditsKey(uid: string) {
  return `gemmint-credits-v2:${uid}`;
}

function readLocalCredits(uid: string): CreditsLedger | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(lsCreditsKey(uid));
    if (!raw) return null;
    return normalizeLedger(JSON.parse(raw) as Partial<CreditsLedger>);
  } catch {
    return null;
  }
}

function writeLocalCredits(uid: string, ledger: CreditsLedger) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(lsCreditsKey(uid), JSON.stringify(ledger));
  } catch {
    /* ignore */
  }
}

async function readIdbCredits(uid: string): Promise<CreditsLedger | null> {
  try {
    const stored = await dbGet<CreditsLedger>(STORE_CREDITS, uid);
    return stored ? normalizeLedger(stored) : null;
  } catch {
    return null;
  }
}

async function mirrorCreditsCache(uid: string, ledger: CreditsLedger) {
  writeLocalCredits(uid, ledger);
  try {
    await dbSet(STORE_CREDITS, uid, ledger);
  } catch {
    /* ignore */
  }
}

function pickRicher(a: CreditsLedger, b: CreditsLedger): CreditsLedger {
  const score = (l: CreditsLedger) =>
    l.totalUsed * 1000 +
    l.totalPurchased * 100 +
    (FREE_SCAN_CREDITS - l.credits);
  return score(a) >= score(b) ? a : b;
}

async function readLocalGrades(uid: string): Promise<DashboardGrade[]> {
  try {
    const stored = await dbGet<DashboardGrade[]>(STORE_GRADES, uid);
    if (Array.isArray(stored) && stored.length > 0) return stored;
  } catch {
    /* ignore */
  }
  if (typeof window === "undefined") return [];
  try {
    const meta = localStorage.getItem(`gemmint-grades-meta-v1:${uid}`);
    if (meta) {
      const parsed = JSON.parse(meta) as DashboardGrade[];
      if (Array.isArray(parsed)) return parsed;
    }
    const bulky = localStorage.getItem(`gemmint-grades-v1:${uid}`);
    if (bulky) {
      const parsed = JSON.parse(bulky) as DashboardGrade[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

async function mirrorGradesCache(uid: string, grades: DashboardGrade[]) {
  try {
    await dbSet(STORE_GRADES, uid, grades.map(compactGrade));
  } catch {
    /* ignore */
  }
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `gemmint-grades-meta-v1:${uid}`,
      JSON.stringify(grades.map((g) => ({ ...g, imageUrl: null })))
    );
  } catch {
    /* ignore */
  }
}

/* ——— Credits ——— */

function ledgerFromUserDoc(
  data: Record<string, unknown> | undefined
): CreditsLedger | null {
  if (!data || typeof data.credits !== "number") return null;
  return normalizeLedger({
    credits: data.credits as number,
    totalPurchased: data.totalPurchased as number | undefined,
    totalUsed: data.totalUsed as number | undefined,
    creditBalancePeak: data.creditBalancePeak as number | undefined,
    lotCredits: data.lotCredits as number | undefined,
    totalLotPurchased: data.totalLotPurchased as number | undefined,
    totalLotUsed: data.totalLotUsed as number | undefined,
    welcomeDismissed: data.welcomeDismissed as boolean | undefined,
    purchases: [],
    usages: [],
  });
}

async function loadPurchaseHistory(uid: string): Promise<CreditPurchase[]> {
  try {
    const snap = await getDocs(query(purchasesCol(uid), orderBy("createdAt", "desc")));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        packId: data.packId as ScanPackId,
        packName: String(data.packName ?? ""),
        credits: Number(data.credits ?? 0),
        amount: Number(data.amount ?? 0),
        status: (data.status as PurchaseStatus) ?? "completed",
        date: String(data.date ?? ""),
        stripeSessionId: (data.stripeSessionId as string | null) ?? null,
      };
    });
  } catch {
    return [];
  }
}

async function loadUsageHistory(uid: string): Promise<CreditUsage[]> {
  try {
    const snap = await getDocs(query(usagesCol(uid), orderBy("createdAt", "desc")));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        cardName: String(data.cardName ?? "Grading report"),
        date: String(data.date ?? ""),
        reportId: data.reportId ? String(data.reportId) : undefined,
      };
    });
  } catch {
    return [];
  }
}

/** Load credits from Firestore; migrate local data once if cloud is empty. */
export async function loadUserCredits(uid: string): Promise<CreditsLedger> {
  try {
    const ref = userRef(uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const base = ledgerFromUserDoc(snap.data() as Record<string, unknown>);
      if (base) {
        const [purchases, usages] = await Promise.all([
          loadPurchaseHistory(uid),
          loadUsageHistory(uid),
        ]);
        const ledger = {
          ...base,
          purchases: purchases.length > 0 ? purchases : base.purchases,
          usages: usages.length > 0 ? usages : base.usages,
        };
        await mirrorCreditsCache(uid, ledger);
        return ledger;
      }
    }

    // Cloud empty — migrate richest local ledger, else seed free credit.
    const fromIdb = await readIdbCredits(uid);
    const fromLs = readLocalCredits(uid);
    const fromAnonIdb = uid !== "anon" ? await readIdbCredits("anon") : null;
    const fromAnonLs = uid !== "anon" ? readLocalCredits("anon") : null;

    let local: CreditsLedger | null = null;
    for (const candidate of [fromIdb, fromLs, fromAnonIdb, fromAnonLs]) {
      if (!candidate) continue;
      local = local ? pickRicher(local, candidate) : candidate;
    }

    const ledger = local ?? emptyLedger();
    await saveUserCredits(uid, ledger);

    // Persist purchase/usage history from migration if present.
    if (ledger.purchases.length > 0 || ledger.usages.length > 0) {
      try {
        const batch = writeBatch(getFirestore());
        for (const p of ledger.purchases.slice(0, 50)) {
          batch.set(doc(purchasesCol(uid), p.id), {
            ...p,
            createdAt: serverTimestamp(),
          });
        }
        for (const u of ledger.usages.slice(0, 100)) {
          batch.set(doc(usagesCol(uid), u.id), {
            ...u,
            createdAt: serverTimestamp(),
          });
        }
        await batch.commit();
      } catch (error) {
        console.warn("Could not migrate credit history:", error);
      }
    }

    return ledger;
  } catch (error) {
    console.warn("Firestore credits unavailable, using local cache:", error);
    const fromIdb = await readIdbCredits(uid);
    const fromLs = readLocalCredits(uid);
    if (fromIdb && fromLs) return pickRicher(fromIdb, fromLs);
    return fromIdb ?? fromLs ?? emptyLedger();
  }
}

export async function saveUserCredits(
  uid: string,
  ledger: CreditsLedger
): Promise<void> {
  await setDoc(
    userRef(uid),
    {
      credits: ledger.credits,
      totalPurchased: ledger.totalPurchased,
      totalUsed: ledger.totalUsed,
      creditBalancePeak: ledger.creditBalancePeak,
      lotCredits: ledger.lotCredits,
      totalLotPurchased: ledger.totalLotPurchased,
      totalLotUsed: ledger.totalLotUsed,
      welcomeDismissed: ledger.welcomeDismissed,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  await mirrorCreditsCache(uid, ledger);
}

export async function consumeCreditTxn(
  uid: string,
  meta?: { cardName?: string; reportId?: string }
): Promise<CreditsLedger | null> {
  const usageId = `use-${Date.now()}`;
  const usage: CreditUsage = {
    id: usageId,
    cardName: meta?.cardName ?? "Grading report",
    date: formatDate(),
    reportId: meta?.reportId,
  };

  const result = await runTransaction(getFirestore(), async (tx) => {
    const ref = userRef(uid);
    const snap = await tx.get(ref);
    const current = snap.exists()
      ? ledgerFromUserDoc(snap.data() as Record<string, unknown>)
      : emptyLedger();

    if (!current || current.credits < 1) return null;

    const next: CreditsLedger = {
      ...current,
      credits: current.credits - 1,
      totalUsed: current.totalUsed + 1,
      usages: [usage, ...current.usages],
      welcomeDismissed: true,
    };

    tx.set(
      ref,
      {
        credits: next.credits,
        totalPurchased: next.totalPurchased,
        totalUsed: next.totalUsed,
        creditBalancePeak: next.creditBalancePeak,
        lotCredits: next.lotCredits,
        totalLotPurchased: next.totalLotPurchased,
        totalLotUsed: next.totalLotUsed,
        welcomeDismissed: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(doc(usagesCol(uid), usageId), {
      ...usage,
      createdAt: serverTimestamp(),
    });

    return next;
  });

  if (result) {
    // Refresh history lists for UI
    const [purchases, usages] = await Promise.all([
      loadPurchaseHistory(uid),
      loadUsageHistory(uid),
    ]);
    const full = { ...result, purchases, usages };
    await mirrorCreditsCache(uid, full);
    return full;
  }
  return null;
}

export async function consumeLotCreditTxn(
  uid: string,
  meta?: { lotTitle?: string; reportId?: string }
): Promise<CreditsLedger | null> {
  const usageId = `lot-use-${Date.now()}`;
  const usage: CreditUsage = {
    id: usageId,
    cardName: meta?.lotTitle ?? "Lot price report",
    date: formatDate(),
    reportId: meta?.reportId,
  };

  const result = await runTransaction(getFirestore(), async (tx) => {
    const ref = userRef(uid);
    const snap = await tx.get(ref);
    const current = snap.exists()
      ? ledgerFromUserDoc(snap.data() as Record<string, unknown>)
      : emptyLedger();

    if (!current || current.lotCredits < 1) return null;

    const next: CreditsLedger = {
      ...current,
      lotCredits: current.lotCredits - 1,
      totalLotUsed: current.totalLotUsed + 1,
      usages: [usage, ...current.usages],
      welcomeDismissed: true,
    };

    tx.set(
      ref,
      {
        credits: next.credits,
        totalPurchased: next.totalPurchased,
        totalUsed: next.totalUsed,
        creditBalancePeak: next.creditBalancePeak,
        lotCredits: next.lotCredits,
        totalLotPurchased: next.totalLotPurchased,
        totalLotUsed: next.totalLotUsed,
        welcomeDismissed: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(doc(usagesCol(uid), usageId), {
      ...usage,
      kind: "lot",
      createdAt: serverTimestamp(),
    });

    return next;
  });

  if (result) {
    const [purchases, usages] = await Promise.all([
      loadPurchaseHistory(uid),
      loadUsageHistory(uid),
    ]);
    const full = { ...result, purchases, usages };
    await mirrorCreditsCache(uid, full);
    return full;
  }
  return null;
}

export async function purchasePackTxn(
  uid: string,
  purchase: CreditPurchase
): Promise<CreditsLedger> {
  const pack = getScanPack(purchase.packId);
  const isLot = pack?.creditKind === "lot";

  const result = await runTransaction(getFirestore(), async (tx) => {
    const ref = userRef(uid);
    const snap = await tx.get(ref);
    const current = snap.exists()
      ? ledgerFromUserDoc(snap.data() as Record<string, unknown>) ?? emptyLedger()
      : emptyLedger();

    const next: CreditsLedger = isLot
      ? {
          ...current,
          lotCredits: current.lotCredits + purchase.credits,
          totalLotPurchased: current.totalLotPurchased + purchase.credits,
          purchases: [purchase, ...current.purchases],
          welcomeDismissed: true,
        }
      : {
          ...current,
          credits: current.credits + purchase.credits,
          totalPurchased: current.totalPurchased + purchase.credits,
          // Refill the tank UI to 100% on purchase.
          creditBalancePeak: current.credits + purchase.credits,
          purchases: [purchase, ...current.purchases],
          welcomeDismissed: true,
        };

    tx.set(
      ref,
      {
        credits: next.credits,
        totalPurchased: next.totalPurchased,
        totalUsed: next.totalUsed,
        creditBalancePeak: next.creditBalancePeak,
        lotCredits: next.lotCredits,
        totalLotPurchased: next.totalLotPurchased,
        totalLotUsed: next.totalLotUsed,
        welcomeDismissed: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(doc(purchasesCol(uid), purchase.id), {
      ...purchase,
      creditKind: isLot ? "lot" : "grade",
      createdAt: serverTimestamp(),
    });

    return next;
  });

  const [purchases, usages] = await Promise.all([
    loadPurchaseHistory(uid),
    loadUsageHistory(uid),
  ]);
  const full = { ...result, purchases, usages };
  await mirrorCreditsCache(uid, full);
  return full;
}

export async function addCreditsTxn(
  uid: string,
  amount: number
): Promise<CreditsLedger> {
  if (amount <= 0) return loadUserCredits(uid);

  const result = await runTransaction(getFirestore(), async (tx) => {
    const ref = userRef(uid);
    const snap = await tx.get(ref);
    const current = snap.exists()
      ? ledgerFromUserDoc(snap.data() as Record<string, unknown>) ?? emptyLedger()
      : emptyLedger();

    const next: CreditsLedger = {
      ...current,
      credits: current.credits + amount,
      totalPurchased: current.totalPurchased + amount,
      creditBalancePeak: current.credits + amount,
    };

    tx.set(
      ref,
      {
        credits: next.credits,
        totalPurchased: next.totalPurchased,
        totalUsed: next.totalUsed,
        creditBalancePeak: next.creditBalancePeak,
        welcomeDismissed: next.welcomeDismissed,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return next;
  });

  await mirrorCreditsCache(uid, result);
  return result;
}

export async function resetCreditsTxn(uid: string): Promise<CreditsLedger> {
  const ledger = { ...emptyLedger(), welcomeDismissed: true };
  await saveUserCredits(uid, ledger);
  return ledger;
}

/* ——— Grades & reports ——— */

function gradeFromDoc(
  id: string,
  data: Record<string, unknown>
): DashboardGrade | null {
  if (!data || typeof data.name !== "string") return null;
  const {
    createdAt: _c,
    updatedAt: _u,
    ...rest
  } = data;
  return {
    ...(rest as unknown as DashboardGrade),
    id,
  };
}

/** List grades from Firestore; migrate local once if cloud is empty. */
export async function listUserGrades(uid: string): Promise<DashboardGrade[]> {
  try {
    const snap = await getDocs(gradesCol(uid));
    const fromCloud = snap.docs
      .map((d) => gradeFromDoc(d.id, d.data() as Record<string, unknown>))
      .filter((g): g is DashboardGrade => Boolean(g));

    if (fromCloud.length > 0) {
      const sorted = sortGrades(fromCloud);
      await mirrorGradesCache(uid, sorted);
      return sorted;
    }

    // Migrate local / anon grades into Firestore.
    const local = await readLocalGrades(uid);
    const anon = uid !== "anon" ? await readLocalGrades("anon") : [];
    const merged = mergeById(local, anon);

    if (merged.length > 0) {
      await Promise.all(merged.map((g) => upsertGradeDoc(uid, g)));
      await mirrorGradesCache(uid, merged);
    }

    return merged;
  } catch (error) {
    console.warn("Firestore grades unavailable, using local cache:", error);
    const local = await readLocalGrades(uid);
    const anon = uid !== "anon" ? await readLocalGrades("anon") : [];
    return mergeById(local, anon);
  }
}

export async function upsertGradeDoc(
  uid: string,
  grade: DashboardGrade
): Promise<void> {
  const compact = compactGrade(grade);
  const createdMs = Date.parse(grade.date) || Date.now();
  await setDoc(
    doc(gradesCol(uid), grade.id),
    stripUndefined({
      ...compact,
      createdAt: createdMs,
      updatedAt: serverTimestamp(),
    }),
    { merge: true }
  );

  // Refresh local mirror with this grade merged in.
  try {
    const existing = await readLocalGrades(uid);
    await mirrorGradesCache(uid, mergeById([compact], existing));
  } catch {
    /* ignore */
  }
}

/** Delete a grade and its rich report from Firestore + local cache. */
export async function deleteUserGrade(
  uid: string,
  gradeId: string
): Promise<void> {
  const result = await Promise.allSettled([
    deleteDoc(doc(gradesCol(uid), gradeId)),
    deleteDoc(doc(reportsCol(uid), gradeId)),
  ]);

  if (result[0].status === "rejected") {
    console.warn("Could not delete grade doc:", result[0].reason);
    throw result[0].reason;
  }
  if (result[1].status === "rejected") {
    console.warn("Could not delete report doc:", result[1].reason);
  }

  try {
    const existing = await readLocalGrades(uid);
    await mirrorGradesCache(
      uid,
      existing.filter((g) => g.id !== gradeId)
    );
  } catch {
    /* ignore */
  }

  try {
    const map =
      (await dbGet<Record<string, RichGradeReport>>(STORE_REPORTS, uid)) ?? {};
    if (gradeId in map) {
      delete map[gradeId];
      await dbSet(STORE_REPORTS, uid, map);
    }
  } catch {
    /* ignore */
  }
}

export async function loadUserReport(
  uid: string,
  gradeId: string
): Promise<RichGradeReport | null> {
  try {
    const snap = await getDoc(doc(reportsCol(uid), gradeId));
    if (snap.exists()) {
      return snap.data() as RichGradeReport;
    }
  } catch (error) {
    console.warn("Could not load Firestore report:", error);
  }

  try {
    const map = await dbGet<Record<string, RichGradeReport>>(STORE_REPORTS, uid);
    if (map?.[gradeId]) return map[gradeId];
  } catch {
    /* ignore */
  }
  return null;
}

export async function saveUserReport(
  uid: string,
  report: RichGradeReport
): Promise<void> {
  const compact = compactReport(report);
  await setDoc(
    doc(reportsCol(uid), report.grade.id),
    stripUndefined({
      ...compact,
      updatedAt: serverTimestamp(),
    }),
    { merge: true }
  );

  try {
    const existing =
      (await dbGet<Record<string, RichGradeReport>>(STORE_REPORTS, uid)) ?? {};
    existing[report.grade.id] = compact;
    await dbSet(STORE_REPORTS, uid, existing);
  } catch {
    /* ignore */
  }
}

/** Strip Firestore Timestamp fields that may leak into grade objects. */
export function stripFirestoreMeta<T extends object>(obj: T): T {
  const clone = { ...obj } as Record<string, unknown>;
  delete clone.createdAt;
  delete clone.updatedAt;
  return clone as T;
}

/* ——— Lot price reports ——— */

function compactLot(report: LotPriceReport): LotPriceReport {
  return {
    ...report,
    imageUrls: report.imageUrls
      .map((url) => (url.length > MAX_IMAGE_CHARS ? "" : url))
      .filter(Boolean)
      .slice(0, 3),
  };
}

export async function saveUserLot(
  uid: string,
  report: LotPriceReport
): Promise<void> {
  const compact = compactLot(report);

  // Always mirror locally so the UI history works even if Firestore rules
  // haven't been published for /lots yet.
  try {
    const key = `gemmint-lots-v1:${uid}`;
    const raw = localStorage.getItem(key);
    const list = raw ? (JSON.parse(raw) as LotPriceReport[]) : [];
    const next = [compact, ...list.filter((l) => l.id !== compact.id)].slice(
      0,
      40
    );
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    /* ignore */
  }

  try {
    await setDoc(
      doc(lotsCol(uid), report.id),
      stripUndefined({
        ...compact,
        createdAt: Date.parse(report.date) || Date.now(),
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  } catch (error) {
    console.warn(
      "Firestore lot save failed (publish firestore.rules if /lots is missing):",
      error
    );
  }
}

export async function listUserLots(uid: string): Promise<LotPriceReport[]> {
  try {
    const snap = await getDocs(lotsCol(uid));
    const fromCloud = snap.docs.map((d) => {
      const data = d.data() as LotPriceReport & {
        createdAt?: unknown;
        updatedAt?: unknown;
      };
      const { createdAt: _c, updatedAt: _u, ...rest } = data;
      return { ...rest, id: d.id } as LotPriceReport;
    });
    if (fromCloud.length > 0) {
      return fromCloud.sort(
        (a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)
      );
    }
  } catch (error) {
    console.warn("Firestore lots unavailable:", error);
  }

  try {
    const raw = localStorage.getItem(`gemmint-lots-v1:${uid}`);
    if (raw) {
      const parsed = JSON.parse(raw) as LotPriceReport[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

export async function deleteUserLot(uid: string, lotId: string): Promise<void> {
  await deleteDoc(doc(lotsCol(uid), lotId)).catch((error) => {
    console.warn("Could not delete lot:", error);
    throw error;
  });
  try {
    const key = `gemmint-lots-v1:${uid}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const list = JSON.parse(raw) as LotPriceReport[];
      localStorage.setItem(
        key,
        JSON.stringify(list.filter((l) => l.id !== lotId))
      );
    }
  } catch {
    /* ignore */
  }
}

export type { Timestamp };
