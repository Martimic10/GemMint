/**
 * Normalize market ladder + ROI so reports stay internally consistent.
 * Prefer live PriceCharting comps when available; otherwise AI + soft floors.
 */

export interface MarketLadder {
  raw: number;
  psa8: number;
  psa9: number;
  psa10: number;
}

export interface MarketEconomics {
  market: MarketLadder;
  estimatedValue: number;
  submissionCost: number;
  potentialProfit: number;
  roiLabel: string;
}

/** Graded market value for a predicted whole-number PSA grade. */
export function valueAtPredictedGrade(
  market: MarketLadder,
  psa: number,
  extras?: { psa7?: number | null; psa95?: number | null }
): number {
  const g = Math.round(psa * 2) / 2; // allow .5
  if (g >= 10) return market.psa10;
  if (g >= 9.5 && extras?.psa95 != null && extras.psa95 > 0) return extras.psa95;
  if (g >= 9) return market.psa9;
  if (g >= 8) return market.psa8;
  if (g >= 7 && extras?.psa7 != null && extras.psa7 > 0) return extras.psa7;
  if (g >= 7) {
    return Math.round(market.raw + (market.psa8 - market.raw) * 0.7);
  }
  if (g >= 6) {
    return Math.round(market.raw + (market.psa8 - market.raw) * 0.4);
  }
  return market.raw;
}

/**
 * Soft floors for well-known blue-chip cards when live market data is missing.
 */
function applyKnownCardFloors(
  name: string,
  set: string,
  year: string,
  market: MarketLadder
): MarketLadder {
  const key = `${name} ${set} ${year}`.toLowerCase();

  const floors: Array<{
    match: (k: string) => boolean;
    floors: MarketLadder;
  }> = [
    {
      match: (k) =>
        k.includes("griffey") &&
        (k.includes("upper deck") || k.includes("1989")),
      floors: { raw: 45, psa8: 120, psa9: 275, psa10: 1800 },
    },
    {
      match: (k) =>
        k.includes("jordan") &&
        (k.includes("fleer") || k.includes("1986") || k.includes("1987")),
      floors: { raw: 4000, psa8: 12000, psa9: 35000, psa10: 200000 },
    },
    {
      match: (k) =>
        k.includes("jackson") &&
        k.includes("bo") &&
        (k.includes("topps") || k.includes("1987") || k.includes("1986")),
      floors: { raw: 25, psa8: 80, psa9: 200, psa10: 900 },
    },
    {
      match: (k) =>
        k.includes("jeter") &&
        (k.includes("sp") || k.includes("1993") || k.includes("foil")),
      floors: { raw: 200, psa8: 600, psa9: 1800, psa10: 12000 },
    },
    {
      match: (k) =>
        k.includes("charizard") &&
        (k.includes("base") || k.includes("1999") || k.includes("shadowless")),
      floors: { raw: 200, psa8: 800, psa9: 2500, psa10: 15000 },
    },
    {
      // 1996 Kobe rookies (Topps / Chrome / Fleer Metal / SkyBox, etc.)
      match: (k) =>
        k.includes("kobe") &&
        (k.includes("1996") ||
          k.includes("topps") ||
          k.includes("chrome") ||
          k.includes("fleer") ||
          k.includes("skybox") ||
          k.includes("1986")), // mis-ID years still match
      floors: { raw: 55, psa8: 135, psa9: 320, psa10: 2200 },
    },
  ];

  for (const entry of floors) {
    if (!entry.match(key)) continue;
    return {
      raw: Math.max(market.raw, entry.floors.raw),
      psa8: Math.max(market.psa8, entry.floors.psa8),
      psa9: Math.max(market.psa9, entry.floors.psa9),
      psa10: Math.max(market.psa10, entry.floors.psa10),
    };
  }

  return market;
}

function enforceMonotonic(market: MarketLadder): MarketLadder {
  let { raw, psa8, psa9, psa10 } = market;
  raw = Math.max(0, Math.round(raw));
  psa8 = Math.max(raw, Math.round(psa8));
  psa9 = Math.max(psa8, Math.round(psa9));
  psa10 = Math.max(psa9, Math.round(psa10));
  return { raw, psa8, psa9, psa10 };
}

/** Typical collector PSA/BGS economy–value tier submission cost. */
export function normalizeSubmissionCost(cost: number): number {
  const n = Math.round(cost);
  if (!Number.isFinite(n) || n < 18) return 25;
  if (n > 150) return 50;
  return n;
}

export function formatRoiLabel(potentialProfit: number): string {
  const abs = Math.abs(Math.round(potentialProfit));
  const sign = potentialProfit >= 0 ? "+" : "-";
  return `${sign}$${abs.toLocaleString()}`;
}

/**
 * Rebuild estimated value + ROI from the market ladder and predicted PSA.
 * When `liveMarket` is true, the ladder is treated as authoritative comps.
 */
export function normalizeMarketEconomics(input: {
  name: string;
  set: string;
  year: string;
  psa: number;
  estimatedValue: number;
  market: MarketLadder;
  submissionCost: number;
  liveMarket?: boolean;
  psa7?: number | null;
  psa95?: number | null;
}): MarketEconomics {
  let market: MarketLadder = {
    raw: input.market.raw,
    psa8: input.market.psa8,
    psa9: input.market.psa9,
    psa10: input.market.psa10,
  };

  if (!input.liveMarket) {
    // Drop obvious AI placeholders ($100 flat / identical tiers) before floors.
    const vals = [market.raw, market.psa8, market.psa9, market.psa10];
    const allHundred = vals.every((v) => v === 100);
    const allSame = vals.every((v) => v === vals[0] && v > 0 && v <= 150);
    if (allHundred || allSame) {
      market = { raw: 0, psa8: 0, psa9: 0, psa10: 0 };
    }
  }

  // Soft floors always raise underpriced comps (never lower live data).
  market = applyKnownCardFloors(input.name, input.set, input.year, market);

  market = enforceMonotonic(market);

  const extras = { psa7: input.psa7, psa95: input.psa95 };
  let estimatedValue: number;

  if (input.liveMarket) {
    // Live comps win — do not let the model overwrite PriceCharting values.
    estimatedValue = valueAtPredictedGrade(market, input.psa, extras);
  } else {
    const g = Math.round(input.psa);
    const modelEstimate = Math.max(0, Math.round(input.estimatedValue));

    if (g >= 10) {
      market = enforceMonotonic({
        ...market,
        psa10: Math.max(market.psa10, modelEstimate),
      });
    } else if (g === 9) {
      market = enforceMonotonic({
        ...market,
        psa9: Math.max(market.psa9, modelEstimate),
      });
    } else if (g === 8) {
      market = enforceMonotonic({
        ...market,
        psa8: Math.max(market.psa8, modelEstimate),
      });
    }

    estimatedValue = Math.max(
      modelEstimate,
      valueAtPredictedGrade(market, input.psa, extras)
    );

    if (g >= 10) {
      market = { ...market, psa10: Math.max(market.psa10, estimatedValue) };
    } else if (g === 9) {
      market = { ...market, psa9: Math.max(market.psa9, estimatedValue) };
    } else if (g === 8) {
      market = { ...market, psa8: Math.max(market.psa8, estimatedValue) };
    }
    market = enforceMonotonic(market);
  }

  const submissionCost = normalizeSubmissionCost(input.submissionCost);
  const potentialProfit = Math.round(
    estimatedValue - market.raw - submissionCost
  );

  return {
    market,
    estimatedValue: Math.round(estimatedValue),
    submissionCost,
    potentialProfit,
    roiLabel: formatRoiLabel(potentialProfit),
  };
}
