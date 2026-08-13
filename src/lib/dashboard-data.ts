import type { CardAssetId } from "@/lib/cards";

export type GradeStatus = "complete" | "processing" | "queued";
export type WorthGrading = "yes" | "maybe" | "no";
export type Recommendation = "submit" | "wait" | "do-not-submit";

export interface DashboardGrade {
  id: string;
  name: string;
  set: string;
  year: string;
  category: string;
  /** Built-in marketing asset id when available; null for user uploads. */
  cardId: CardAssetId | null;
  /** Front image — data URL or public path. */
  imageUrl?: string | null;
  psa: number;
  beckett: string;
  confidence: number;
  worthGrading: WorthGrading;
  estimatedValue: number;
  date: string;
  status: GradeStatus;
  /** Scan credits consumed for this report (0 while processing). */
  creditUsed: number;
  centering: { lr: string; tb: string; pass: boolean };
  corners: { scores: [number, number, number, number]; notes: string };
  edges: { score: number; notes: string };
  surface: { score: number; notes: string };
  market: { raw: number; psa8: number; psa9: number; psa10: number };
  recommendation: Recommendation;
  insight: string;
}

export interface DashboardInsight {
  id: string;
  title: string;
  body: string;
  tone: "emerald" | "royal" | "neutral";
}

export interface ActivityItem {
  id: string;
  label: string;
  detail: string;
  time: string;
  type: "report" | "payment" | "suggestion" | "feature";
}

export const CARD_TYPES = [
  "Pokémon",
  "Sports",
  "Magic",
  "Yu-Gi-Oh",
  "One Piece",
  "Disney Lorcana",
] as const;

export const DASHBOARD_INSIGHTS: DashboardInsight[] = [];
export const ACTIVITY_FEED: ActivityItem[] = [];

export const FUTURE_FEATURES = [
  {
    title: "Collection Manager",
    description: "Organize inventory with binders, tags, and live values.",
  },
  {
    title: "Population Reports",
    description: "Compare your card against PSA and Beckett pop data.",
  },
  {
    title: "Marketplace",
    description: "List graded-ready cards with GemMint report attachments.",
  },
  {
    title: "Submission Tracker",
    description: "Track lab shipments, turnaround, and final slabs.",
  },
  {
    title: "Authenticity Reports",
    description: "AI-assisted counterfeit signals for high-value cards.",
  },
  {
    title: "AI Advisor",
    description: "Ask questions about your grades and submission strategy.",
  },
] as const;

export type NavId =
  | "dashboard"
  | "new-grade"
  | "lot-price"
  | "collection"
  | "reports"
  | "orders"
  | "billing"
  | "api"
  | "settings";
