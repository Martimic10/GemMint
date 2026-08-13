import type { Recommendation } from "@/lib/dashboard-data";

export type GradeStage = "upload" | "quality" | "inspection" | "report";

export const SUPPORTED_GAMES = [
  "Pokémon",
  "Sports",
  "Magic",
  "Yu-Gi-Oh!",
  "One Piece",
  "Disney Lorcana",
] as const;

export const UPLOAD_TIPS = [
  "Place the card on a flat, contrasting surface",
  "Use bright, even lighting — avoid glare",
  "Keep the entire card visible in frame",
  "No fingers covering edges or corners",
] as const;

export type QualityCheckId =
  | "resolution"
  | "lighting"
  | "perspective"
  | "sharpness"
  | "detection";

export interface QualityCheck {
  id: QualityCheckId;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

export type InspectionStepId =
  | "detection"
  | "perspective"
  | "borders"
  | "centering"
  | "corners"
  | "edges"
  | "surface"
  | "print"
  | "market"
  | "grade";

export interface InspectionStep {
  id: InspectionStepId;
  label: string;
  /** Overlay mode while this step is active */
  overlay:
    | "detect"
    | "perspective"
    | "borders"
    | "centering"
    | "corners"
    | "edges"
    | "surface"
    | "print"
    | "market"
    | "grade";
  durationMs: number;
}

/** Visual timeline pacing while the AI request runs (not a fake grade). */
export const INSPECTION_STEPS: InspectionStep[] = [
  { id: "detection", label: "Card Detection", overlay: "detect", durationMs: 1800 },
  { id: "perspective", label: "Perspective Correction", overlay: "perspective", durationMs: 1600 },
  { id: "borders", label: "Border Measurements", overlay: "borders", durationMs: 1800 },
  { id: "centering", label: "Centering Analysis", overlay: "centering", durationMs: 2000 },
  { id: "corners", label: "Corner Inspection", overlay: "corners", durationMs: 2000 },
  { id: "edges", label: "Edge Inspection", overlay: "edges", durationMs: 1800 },
  { id: "surface", label: "Surface Analysis", overlay: "surface", durationMs: 2200 },
  { id: "print", label: "Print Defect Detection", overlay: "print", durationMs: 1600 },
  { id: "market", label: "Market Value Lookup", overlay: "market", durationMs: 1600 },
  { id: "grade", label: "Final Grade Calculation", overlay: "grade", durationMs: 2000 },
];

export const INSPECTION_TOTAL_MS = INSPECTION_STEPS.reduce(
  (sum, s) => sum + s.durationMs,
  0
);

export interface CornerDetail {
  id: "tl" | "tr" | "bl" | "br";
  label: string;
  score: number;
  condition: string;
  damage: number;
  notes: string;
}

export interface SurfaceDefect {
  id: string;
  type: string;
  location: string;
  severity: "low" | "medium" | "high";
  impact: string;
  /** Relative position inside photo frame (0–100) */
  x: number;
  y: number;
}

export interface RichGradeReport {
  grade: import("@/lib/dashboard-data").DashboardGrade;
  explanation: string;
  centeringDetail: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  corners: CornerDetail[];
  edges: {
    top: { whitening: number; notes: string };
    right: { whitening: number; notes: string };
    bottom: { whitening: number; notes: string };
    left: { whitening: number; notes: string };
  };
  defects: SurfaceDefect[];
  submissionCost: number;
  potentialProfit: number;
  roiLabel: string;
  /** Where market comps came from */
  marketSource?: "pricecharting" | "web" | "estimate";
  marketProductName?: string | null;
  marketUrl?: string | null;
}

export function recommendationCopy(rec: Recommendation): {
  title: string;
  tone: "emerald" | "amber" | "red";
  label: string;
} {
  if (rec === "submit") {
    return { title: "Worth Grading", tone: "emerald", label: "Submit" };
  }
  if (rec === "wait") {
    return { title: "Wait", tone: "amber", label: "Wait" };
  }
  return { title: "Sell Raw", tone: "red", label: "Sell Raw" };
}
