import type { AiGradePayload } from "@/lib/grade-schema";

/**
 * Derive a PSA prediction from category scores so the model cannot
 * collapse everything to a default "8" when subgrades say otherwise.
 */
export function derivePsaFromCategories(payload: AiGradePayload): number {
  const cornerScores = payload.corners.scores;
  const cornerMin = Math.min(...cornerScores);
  const cornerAvg =
    cornerScores.reduce((sum, s) => sum + s, 0) / cornerScores.length;
  const edge = payload.edges.score;
  const surface = payload.surface.score;

  const { left, right, top, bottom } = payload.centeringDetail;
  const lrDiff = Math.abs(left - right);
  const tbDiff = Math.abs(top - bottom);
  // Rough PSA centering: ~55/45 or better is fine for 9–10; worse hurts.
  let centeringScore = 10;
  if (lrDiff > 20 || tbDiff > 20) centeringScore = 5;
  else if (lrDiff > 14 || tbDiff > 14) centeringScore = 6;
  else if (lrDiff > 10 || tbDiff > 10) centeringScore = 7;
  else if (lrDiff > 6 || tbDiff > 6) centeringScore = 8;
  else if (lrDiff > 3 || tbDiff > 3) centeringScore = 9;
  if (!payload.centering.pass) centeringScore = Math.min(centeringScore, 7);

  const edgeWhitening = Math.max(
    payload.edges.top.whitening,
    payload.edges.right.whitening,
    payload.edges.bottom.whitening,
    payload.edges.left.whitening
  );
  let edgeAdj = edge;
  if (edgeWhitening >= 55) edgeAdj = Math.min(edgeAdj, 6);
  else if (edgeWhitening >= 35) edgeAdj = Math.min(edgeAdj, 7);
  else if (edgeWhitening >= 20) edgeAdj = Math.min(edgeAdj, 8);
  else if (edgeWhitening >= 10) edgeAdj = Math.min(edgeAdj, 9);

  const highDefects = payload.defects.filter((d) => d.severity === "high").length;
  const medDefects = payload.defects.filter((d) => d.severity === "medium").length;
  let surfaceAdj = surface;
  if (highDefects >= 2) surfaceAdj = Math.min(surfaceAdj, 6);
  else if (highDefects >= 1) surfaceAdj = Math.min(surfaceAdj, 7);
  else if (medDefects >= 2) surfaceAdj = Math.min(surfaceAdj, 8);
  else if (medDefects >= 1) surfaceAdj = Math.min(surfaceAdj, 9);

  // Worst corner tends to cap the grade; average softens a single ding.
  const cornerLimiting = cornerMin * 0.65 + cornerAvg * 0.35;
  const limiting = Math.min(cornerLimiting, edgeAdj, surfaceAdj, centeringScore);

  if (limiting >= 9.6 && cornerMin >= 9.5 && edgeAdj >= 9.5 && surfaceAdj >= 9.5) {
    return 10;
  }
  if (limiting >= 9.0 && cornerMin >= 8.5) return 9;
  if (limiting >= 8.0) return 8;
  if (limiting >= 7.0) return 7;
  if (limiting >= 6.0) return 6;
  if (limiting >= 5.0) return 5;
  if (limiting >= 4.0) return 4;
  if (limiting >= 3.0) return 3;
  if (limiting >= 2.0) return 2;
  return 1;
}

function beckettForPsa(psa: number, existing: string): string {
  // Keep half-grades when they already match the PSA band; otherwise map cleanly.
  const map: Record<number, string> = {
    10: "10",
    9: "9.5",
    8: "8.5",
    7: "7.5",
    6: "6.5",
    5: "5",
    4: "4",
    3: "3",
    2: "2",
    1: "1",
  };
  const mapped = map[psa] ?? String(psa);
  const existingNum = Number.parseFloat(existing);
  if (
    Number.isFinite(existingNum) &&
    Math.abs(existingNum - psa) <= 0.5
  ) {
    return existing;
  }
  return mapped;
}

/**
 * Reconcile model PSA with category-derived PSA.
 * Prefer evidence from subgrades when the headline grade looks like a default 8
 * or conflicts with the category scores by more than 1 point.
 */
export function reconcileGradePrediction(
  payload: AiGradePayload
): AiGradePayload {
  const modelPsa = Math.round(
    Math.min(10, Math.max(1, payload.psa))
  );
  const derived = derivePsaFromCategories(payload);

  let psa = modelPsa;

  // Strong conflict: trust the category-derived grade.
  if (Math.abs(modelPsa - derived) >= 2) {
    psa = derived;
  } else if (modelPsa === 8 && derived !== 8) {
    // Classic mode-collapse: model parks on 8 while evidence says otherwise.
    psa = derived;
  } else if (Math.abs(modelPsa - derived) === 1) {
    // Mild conflict — lean toward the more evidence-based derived grade.
    psa = derived;
  }

  const confidence =
    modelPsa === derived
      ? payload.confidence
      : Math.min(payload.confidence, modelPsa === 8 ? 72 : 78);

  return {
    ...payload,
    psa,
    beckett: beckettForPsa(psa, payload.beckett),
    confidence: Math.round(confidence),
  };
}
