export const CARD_ASSETS = {
  griffey: {
    src: "/kengriffey.jpg",
    alt: "1989 Upper Deck Ken Griffey Jr. rookie card",
    aspect: "500/695",
    viewBox: { w: 500, h: 695 },
    photo: { x: 20, y: 22, w: 458, h: 606 },
    outer: { x: 4, y: 4, w: 492, h: 687 },
  },
  kobe: {
    src: "/kobebryant-rookie.jpg",
    alt: "Topps Kobe Bryant rookie card",
    aspect: "749/1048",
    viewBox: { w: 749, h: 1048 },
    photo: { x: 38, y: 44, w: 674, h: 968 },
    outer: { x: 5, y: 5, w: 739, h: 1038 },
  },
  bo: {
    src: "/bojackson-rookie.jpg",
    alt: "1987 Topps Bo Jackson Super Rookie card",
    aspect: "684/957",
    viewBox: { w: 684, h: 957 },
    photo: { x: 36, y: 50, w: 598, h: 865 },
    outer: { x: 4, y: 4, w: 676, h: 949 },
  },
} as const;

export type CardAssetId = keyof typeof CARD_ASSETS;

/** Generic frame for user-uploaded cards. */
export const GENERIC_CARD_FRAME = {
  src: "",
  alt: "Uploaded trading card",
  aspect: "5/7",
  viewBox: { w: 1000, h: 1400 },
  photo: { x: 55, y: 55, w: 890, h: 1290 },
  outer: { x: 12, y: 12, w: 976, h: 1376 },
} as const;

export type CardFrame = {
  src: string;
  alt: string;
  aspect: string;
  viewBox: { w: number; h: number };
  photo: { x: number; y: number; w: number; h: number };
  outer: { x: number; y: number; w: number; h: number };
};

export function resolveCardFrame(
  cardId: CardAssetId | null | undefined
): CardFrame {
  if (cardId && cardId in CARD_ASSETS) {
    return CARD_ASSETS[cardId];
  }
  return GENERIC_CARD_FRAME;
}

export function gradeImageSrc(grade: {
  imageUrl?: string | null;
  cardId?: CardAssetId | null;
  name?: string;
}): string {
  const display = gradeDisplaySrc(grade);
  return display;
}

/** Infer a built-in asset when the AI didn't set cardId but the name is known. */
export function inferCardAssetId(grade: {
  cardId?: CardAssetId | null;
  name?: string | null;
}): CardAssetId | null {
  if (grade.cardId && grade.cardId in CARD_ASSETS) return grade.cardId;
  const name = (grade.name || "").toLowerCase();
  if (name.includes("griffey")) return "griffey";
  if (name.includes("kobe")) return "kobe";
  if (name.includes("bo jackson")) return "bo";
  return null;
}

/** Prefer crisp built-in assets over tiny stored thumbs when available. */
export function gradeDisplaySrc(grade: {
  imageUrl?: string | null;
  cardId?: CardAssetId | null;
  name?: string | null;
}): string {
  const assetId = inferCardAssetId(grade);
  const upload = grade.imageUrl;

  // Tiny/legacy thumbs look muddy when scaled — prefer the hi-res asset.
  const uploadIsTiny =
    !upload ||
    (upload.startsWith("data:") && upload.length < 80_000);

  if (assetId && uploadIsTiny) {
    return CARD_ASSETS[assetId].src;
  }
  if (upload) return upload;
  if (assetId) return CARD_ASSETS[assetId].src;
  return "";
}

/** Avoid "1989 1989 Upper Deck" when set already includes the year. */
export function formatCardMeta(grade: {
  year?: string | null;
  set?: string | null;
  category?: string | null;
}): string {
  const year = (grade.year || "").trim();
  const set = (grade.set || "").trim();
  const category = (grade.category || "").trim();

  let title = set;
  if (year && set) {
    const setHasYear =
      set === year ||
      set.startsWith(`${year} `) ||
      set.includes(` ${year} `) ||
      set.endsWith(` ${year}`);
    title = setHasYear ? set : `${year} · ${set}`;
  } else {
    title = year || set;
  }

  if (category && !title.toLowerCase().includes(category.toLowerCase())) {
    return title ? `${title} · ${category}` : category;
  }
  return title;
}

export const FEATURE_CARD_ORDER: CardAssetId[] = [
  "griffey",
  "kobe",
  "bo",
  "griffey",
];
