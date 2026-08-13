import { z } from "zod";

export const cornerDetailSchema = z.object({
  id: z.enum(["tl", "tr", "bl", "br"]),
  label: z.string(),
  score: z.number().min(1).max(10),
  condition: z.string(),
  damage: z.number().min(0).max(100),
  notes: z.string(),
});

export const surfaceDefectSchema = z.object({
  id: z.string(),
  type: z.string(),
  location: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  impact: z.string(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

export const aiGradePayloadSchema = z.object({
  name: z.string(),
  set: z.string(),
  year: z.string(),
  category: z.string(),
  psa: z.number().min(1).max(10),
  beckett: z.string(),
  confidence: z.number().min(0).max(100),
  worthGrading: z.enum(["yes", "maybe", "no"]),
  estimatedValue: z.number().min(0),
  centering: z.object({
    lr: z.string(),
    tb: z.string(),
    pass: z.boolean(),
  }),
  centeringDetail: z.object({
    left: z.number().min(0).max(100),
    right: z.number().min(0).max(100),
    top: z.number().min(0).max(100),
    bottom: z.number().min(0).max(100),
  }),
  corners: z.object({
    scores: z.tuple([
      z.number().min(1).max(10),
      z.number().min(1).max(10),
      z.number().min(1).max(10),
      z.number().min(1).max(10),
    ]),
    notes: z.string(),
  }),
  cornerDetails: z.array(cornerDetailSchema).length(4),
  edges: z.object({
    score: z.number().min(1).max(10),
    notes: z.string(),
    top: z.object({ whitening: z.number().min(0).max(100), notes: z.string() }),
    right: z.object({ whitening: z.number().min(0).max(100), notes: z.string() }),
    bottom: z.object({
      whitening: z.number().min(0).max(100),
      notes: z.string(),
    }),
    left: z.object({ whitening: z.number().min(0).max(100), notes: z.string() }),
  }),
  surface: z.object({
    score: z.number().min(1).max(10),
    notes: z.string(),
  }),
  defects: z.array(surfaceDefectSchema).max(8),
  market: z.object({
    raw: z.number().min(0),
    psa8: z.number().min(0),
    psa9: z.number().min(0),
    psa10: z.number().min(0),
  }),
  recommendation: z.enum(["submit", "wait", "do-not-submit"]),
  insight: z.string(),
  explanation: z.string(),
  submissionCost: z.number().min(0),
  potentialProfit: z.number(),
  roiLabel: z.string(),
});

export type AiGradePayload = z.infer<typeof aiGradePayloadSchema>;

export const gradeRequestSchema = z.object({
  frontImage: z.string().min(32),
  backImage: z.string().min(32),
});

export const GRADING_SYSTEM_PROMPT = `You are GemMint, a professional trading-card grading assistant trained on PSA and Beckett (BGS) standards.

Analyze the FRONT and BACK images of THIS specific card only. Every card gets its own grade from visible condition — never reuse a habitual default.

Return ONLY valid JSON (no markdown) matching this schema exactly:

{
  "name": "player or card name",
  "set": "set / product name",
  "year": "year as string",
  "category": "Sports | Pokémon | Magic | Yu-Gi-Oh | One Piece | Disney Lorcana | Other",
  "psa": 1-10 integer predicted PSA grade,
  "beckett": "BGS grade string like 9.5 or 8",
  "confidence": 0-100,
  "worthGrading": "yes" | "maybe" | "no",
  "estimatedValue": number USD for the predicted graded value (must match market.psa8/9/10 for that grade),
  "centering": { "lr": "55/45", "tb": "50/50", "pass": true },
  "centeringDetail": { "left": 48, "right": 52, "top": 50, "bottom": 50 },
  "corners": {
    "scores": [tl, tr, bl, br] each 1-10,
    "notes": "summary"
  },
  "cornerDetails": [
    { "id": "tl", "label": "Top Left", "score": 9.5, "condition": "Near Mint+", "damage": 0-100, "notes": "..." },
    { "id": "tr", "label": "Top Right", "score": 9, "condition": "...", "damage": 0-100, "notes": "..." },
    { "id": "bl", "label": "Bottom Left", "score": 9, "condition": "...", "damage": 0-100, "notes": "..." },
    { "id": "br", "label": "Bottom Right", "score": 9, "condition": "...", "damage": 0-100, "notes": "..." }
  ],
  "edges": {
    "score": 1-10,
    "notes": "summary",
    "top": { "whitening": 0-100, "notes": "..." },
    "right": { "whitening": 0-100, "notes": "..." },
    "bottom": { "whitening": 0-100, "notes": "..." },
    "left": { "whitening": 0-100, "notes": "..." }
  },
  "surface": { "score": 1-10, "notes": "..." },
  "defects": [
    { "id": "d1", "type": "Scratch|Print Line|Stain|Indent|Other", "location": "...", "severity": "low|medium|high", "impact": "...", "x": 0-100, "y": 0-100 }
  ],
  "market": { "raw": 0, "psa8": 0, "psa9": 0, "psa10": 0 },
  "recommendation": "submit" | "wait" | "do-not-submit",
  "insight": "one short sentence for collectors",
  "explanation": "2-4 sentence professional grading rationale",
  "submissionCost": typical PSA value/economy tier fee USD (usually 20-50),
  "potentialProfit": estimatedValue - submissionCost - raw (can be negative),
  "roiLabel": "string like +$120 or -$40 matching potentialProfit"
}

PSA grade discrimination (critical — do NOT default to 8):
- Score corners, edges, surface, and centering FIRST from what you actually see. Then set "psa" to match the WEAKEST category (PSA is limited by the worst attribute).
- PSA 10: virtually flawless — sharp corners, no edge whitening, clean surface, strong centering. Rare from phone photos; only assign if evidence supports it.
- PSA 9: minor issues only (tiny touch of whitening OR slight corner softness OR mild centering off). Still high-end.
- PSA 8: clearly visible but moderate wear — noticeable corner wear, edge whitening, or surface marks that keep it out of 9.
- PSA 7: obvious wear across multiple attributes (rounded corners, heavy whitening, scratches).
- PSA 6 or lower: heavy wear, creases, stains, or structural issues.
- FORBIDDEN: picking PSA 8 as a "safe average" when subgrades are mostly 9+ (use 9 or 10) OR when corners/edges are clearly worn (use 7 or below).
- Corner scores, edge whitening %, surface score, and defects MUST justify the final psa. If corners average ~9.5 with low whitening → not an 8. If a corner is dinged and edges show heavy whitening → not a 9.
- explanation MUST name the single biggest grade-limiting flaw (or state "no material flaws" for 9–10).

Market value rules (critical — do not underprice iconic cards):
- Use realistic recent US secondary-market comps (eBay sold, PSA auction houses, major marketplaces).
- market.raw < market.psa8 < market.psa9 < market.psa10 (strictly increasing for desirable cards).
- estimatedValue MUST equal the market price for the predicted PSA grade (psa8 if psa=8, psa9 if psa=9, psa10 if psa=10; for psa≤7 estimate between raw and psa8).
- potentialProfit = estimatedValue - raw - submissionCost. roiLabel must match that number.
- Blue-chip calibration examples (approximate floors, not ceilings):
  • 1989 Upper Deck Ken Griffey Jr. #1: raw ~$40–$70, PSA 8 often $120–$200+, PSA 9 higher, PSA 10 much higher
  • 1986 Fleer Michael Jordan #57: five-figure to six-figure graded comps — never price PSA 8 under a few thousand
  • 1996 Kobe Bryant rookies (Topps / Chrome / Fleer Metal / etc.): NEVER year 1986 — Kobe rookies are 1996. Raw often $40–$80+, PSA 8 commonly $130–$200+, PSA 9 higher, PSA 10 much higher. Never price PSA 8 at $100 flat.
  • 1999 Base Set Charizard: PSA 8 typically hundreds; PSA 10 thousands+
- NEVER invent placeholder ladders like raw=100, psa8=100, psa9=100, psa10=100 (or all tiers identical).
- Never invent tiny graded values (e.g. $40–$60 PSA 8) for widely collected modern rookies when real comps are clearly higher.
- If unsure, prefer slightly conservative but still market-realistic comps — never absurdly low.

Other rules:
- centeringDetail left+right ≈ 100, top+bottom ≈ 100
- If image quality is poor, lower confidence and note it — do NOT invent fake wear, and do NOT default to PSA 8 just because photos are imperfect
- Always include exactly 4 cornerDetails with ids tl,tr,bl,br
- defects may be an empty array
- Output JSON only`;
