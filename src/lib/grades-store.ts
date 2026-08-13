import type { DashboardGrade } from "@/lib/dashboard-data";
import type { RichGradeReport } from "@/lib/grade-flow-data";
import {
  deleteUserGrade,
  listUserGrades,
  loadUserReport,
  saveUserReport,
  upsertGradeDoc,
} from "@/lib/user-data";

/** Sync fallback for SSR — prefer loadGradesAsync. */
export function loadGrades(_uid?: string | null): DashboardGrade[] {
  return [];
}

export async function loadGradesAsync(
  uid?: string | null
): Promise<DashboardGrade[]> {
  if (typeof window === "undefined" || !uid) return [];
  try {
    return await listUserGrades(uid);
  } catch (error) {
    console.warn("Could not load grades:", error);
    return [];
  }
}

export async function saveGrades(
  grades: DashboardGrade[],
  uid?: string | null
): Promise<boolean> {
  if (!uid) return false;
  try {
    await Promise.all(grades.map((g) => upsertGradeDoc(uid, g)));
    return true;
  } catch (error) {
    console.warn("Could not save grades:", error);
    return false;
  }
}

export async function upsertGrade(
  grade: DashboardGrade,
  uid?: string | null
): Promise<DashboardGrade[]> {
  if (!uid) {
    console.warn("upsertGrade called without uid — grade may not follow login");
    return [grade];
  }
  await upsertGradeDoc(uid, grade);
  return loadGradesAsync(uid);
}

export async function deleteGrade(
  gradeId: string,
  uid?: string | null
): Promise<DashboardGrade[]> {
  if (!uid) {
    console.warn("deleteGrade called without uid");
    return [];
  }
  await deleteUserGrade(uid, gradeId);
  return loadGradesAsync(uid);
}

export function loadRichReport(
  _id: string,
  _uid?: string | null
): RichGradeReport | null {
  return null;
}

export async function loadRichReportAsync(
  id: string,
  uid?: string | null
): Promise<RichGradeReport | null> {
  if (typeof window === "undefined" || !uid) return null;
  return loadUserReport(uid, id);
}

export async function saveRichReport(
  report: RichGradeReport,
  uid?: string | null
): Promise<void> {
  if (!uid) return;
  await saveUserReport(uid, report);
}

export function computeStats(grades: DashboardGrade[]) {
  const complete = grades.filter((g) => g.status === "complete");
  const cardsGraded = complete.length;
  const averageGrade =
    cardsGraded === 0
      ? 0
      : complete.reduce((sum, g) => sum + g.psa, 0) / cardsGraded;
  const collectionValue = complete.reduce(
    (sum, g) => sum + g.estimatedValue,
    0
  );
  const moneySaved = complete
    .filter((g) => g.recommendation !== "submit")
    .reduce((sum, g) => sum + 20, 0);

  return {
    cardsGraded,
    averageGrade: Math.round(averageGrade * 10) / 10,
    moneySaved,
    collectionValue,
  };
}
