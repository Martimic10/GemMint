import type { CardAssetId } from "@/lib/cards";
import type {
  DashboardGrade,
  Recommendation,
  WorthGrading,
} from "@/lib/dashboard-data";
import type {
  CornerDetail,
  RichGradeReport,
  SurfaceDefect,
} from "@/lib/grade-flow-data";

/** Compact seed row — expanded into DashboardGrade in `buildDemoGrades`. */
export interface DemoCardSeed {
  id: string;
  name: string;
  set: string;
  year: string;
  category: string;
  psa: number;
  beckett: string;
  value: number;
  /** Days ago relative to “today” for chart history. */
  daysAgo: number;
  recommendation: Recommendation;
  worthGrading: WorthGrading;
  confidence: number;
  cardId?: CardAssetId | null;
  insight: string;
  market: { raw: number; psa8: number; psa9: number; psa10: number };
  centering?: { lr: string; tb: string; pass: boolean };
  cornersNotes?: string;
  edgesNotes?: string;
  surfaceNotes?: string;
  featured?: boolean;
}

/**
 * Curated demo collection (~70 cards). Values and grades are illustrative
 * but grounded in recognizable cards collectors know.
 */
export const DEMO_CARD_SEEDS: DemoCardSeed[] = [
  {
    id: "demo-griffey-89",
    name: "Ken Griffey Jr.",
    set: "1989 Upper Deck",
    year: "1989",
    category: "Sports",
    psa: 9,
    beckett: "9.5",
    value: 4250,
    daysAgo: 2,
    recommendation: "submit",
    worthGrading: "yes",
    confidence: 91,
    cardId: "griffey",
    insight:
      "Iconic UD #1 rookie. Strong corners and clean surface — PSA 9 floor looks durable; PSA 10 is the upside case.",
    market: { raw: 180, psa8: 650, psa9: 4250, psa10: 28000 },
    centering: { lr: "55/45", tb: "50/50", pass: true },
    cornersNotes: "Micro soft on back TL; fronts look sharp.",
    edgesNotes: "Light whitening on left long edge under magnification.",
    surfaceNotes: "Print looks clean; no visible print lines.",
    featured: true,
  },
  {
    id: "demo-kobe-96",
    name: "Kobe Bryant",
    set: "1996 Topps Chrome",
    year: "1996",
    category: "Sports",
    psa: 8,
    beckett: "8.5",
    value: 1850,
    daysAgo: 5,
    recommendation: "submit",
    worthGrading: "yes",
    confidence: 86,
    cardId: "kobe",
    insight:
      "Chrome rookies remain liquid. Edge chipping caps the grade; still a clear submit at current PSA 8 comps.",
    market: { raw: 220, psa8: 1850, psa9: 5200, psa10: 18500 },
    centering: { lr: "60/40", tb: "55/45", pass: true },
    featured: true,
  },
  {
    id: "demo-bo-87",
    name: "Bo Jackson",
    set: "1987 Topps",
    year: "1987",
    category: "Sports",
    psa: 8,
    beckett: "8",
    value: 320,
    daysAgo: 8,
    recommendation: "wait",
    worthGrading: "maybe",
    confidence: 82,
    cardId: "bo",
    insight:
      "Classic Super Rookie look. Soft corners keep this from a clean 9 — wait for a better copy before slabbing.",
    market: { raw: 45, psa8: 320, psa9: 1100, psa10: 6500 },
    featured: true,
  },
  {
    id: "demo-jordan-86",
    name: "Michael Jordan",
    set: "1986 Fleer",
    year: "1986",
    category: "Sports",
    psa: 7,
    beckett: "7.5",
    value: 6200,
    daysAgo: 12,
    recommendation: "submit",
    worthGrading: "yes",
    confidence: 88,
    insight:
      "Even mid-grade '86 Fleer MJ retains serious demand. Surface scuffing is the limiter; still worth authenticating.",
    market: { raw: 2800, psa8: 14000, psa9: 42000, psa10: 250000 },
    centering: { lr: "65/35", tb: "60/40", pass: false },
    featured: true,
  },
  {
    id: "demo-jeter-93",
    name: "Derek Jeter",
    set: "1993 SP Foil",
    year: "1993",
    category: "Sports",
    psa: 8,
    beckett: "8.5",
    value: 2100,
    daysAgo: 15,
    recommendation: "submit",
    worthGrading: "yes",
    confidence: 84,
    insight: "Foil rookies are condition-sensitive. This copy clears PSA 8 with room to argue 8.5–9.",
    market: { raw: 280, psa8: 2100, psa9: 7800, psa10: 45000 },
    featured: true,
  },
  {
    id: "demo-trout-11",
    name: "Mike Trout",
    set: "2011 Topps Update",
    year: "2011",
    category: "Sports",
    psa: 10,
    beckett: "10",
    value: 980,
    daysAgo: 18,
    recommendation: "submit",
    worthGrading: "yes",
    confidence: 94,
    insight: "Update RC still the modern standard. Gem looks locked — submit for liquidity.",
    market: { raw: 95, psa8: 180, psa9: 320, psa10: 980 },
    featured: true,
  },
  {
    id: "demo-charizard-99",
    name: "Charizard",
    set: "1999 Base Set (Shadowless)",
    year: "1999",
    category: "Pokémon",
    psa: 8,
    beckett: "8",
    value: 3400,
    daysAgo: 3,
    recommendation: "submit",
    worthGrading: "yes",
    confidence: 87,
    insight:
      "Shadowless Holo #4. Centering is acceptable; mild edge wear keeps it from a 9. Strong mid-grade hold.",
    market: { raw: 900, psa8: 3400, psa9: 9800, psa10: 42000 },
    featured: true,
  },
  {
    id: "demo-pikachu-illust",
    name: "Pikachu Illustrator",
    set: "Promo (Proxy Display)",
    year: "1998",
    category: "Pokémon",
    psa: 9,
    beckett: "9",
    value: 890,
    daysAgo: 22,
    recommendation: "do-not-submit",
    worthGrading: "no",
    confidence: 72,
    insight:
      "Display copy for UI demo — not a verified Illustrator. Treated as a mid-value modern alternate art stand-in.",
    market: { raw: 120, psa8: 400, psa9: 890, psa10: 2200 },
  },
  {
    id: "demo-lugia-neo",
    name: "Lugia",
    set: "Neo Genesis",
    year: "2000",
    category: "Pokémon",
    psa: 9,
    beckett: "9",
    value: 720,
    daysAgo: 28,
    recommendation: "submit",
    worthGrading: "yes",
    confidence: 89,
    insight: "Neo Genesis holo remains a set cornerstone. Clean surface and strong corners.",
    market: { raw: 140, psa8: 320, psa9: 720, psa10: 2800 },
  },
  {
    id: "demo-black-lotus",
    name: "Black Lotus",
    set: "Revised (Proxy Display)",
    year: "1994",
    category: "Magic",
    psa: 8,
    beckett: "8",
    value: 1250,
    daysAgo: 9,
    recommendation: "wait",
    worthGrading: "maybe",
    confidence: 70,
    insight:
      "High-value archetype shown for portfolio mix — treat comps as illustrative for demo analytics.",
    market: { raw: 800, psa8: 1250, psa9: 3200, psa10: 9000 },
  },
  {
    id: "demo-lebron-03",
    name: "LeBron James",
    set: "2003 Topps Chrome",
    year: "2003",
    category: "Sports",
    psa: 9,
    beckett: "9.5",
    value: 1450,
    daysAgo: 11,
    recommendation: "submit",
    worthGrading: "yes",
    confidence: 90,
    insight: "Chrome RC still the blue-chip modern basketball hold.",
    market: { raw: 180, psa8: 520, psa9: 1450, psa10: 6200 },
  },
  {
    id: "demo-mahomes-17",
    name: "Patrick Mahomes",
    set: "2017 Prizm",
    year: "2017",
    category: "Sports",
    psa: 10,
    beckett: "10",
    value: 1100,
    daysAgo: 6,
    recommendation: "submit",
    worthGrading: "yes",
    confidence: 93,
    insight: "Base Prizm gem — liquid and easy to move at show prices.",
    market: { raw: 95, psa8: 220, psa9: 480, psa10: 1100 },
  },
  {
    id: "demo-wembanyama-23",
    name: "Victor Wembanyama",
    set: "2023 Prizm",
    year: "2023",
    category: "Sports",
    psa: 10,
    beckett: "10",
    value: 240,
    daysAgo: 1,
    recommendation: "wait",
    worthGrading: "maybe",
    confidence: 85,
    insight: "Modern volume RC — gem population is high; hold raw unless you need the slab for sale.",
    market: { raw: 45, psa8: 70, psa9: 120, psa10: 240 },
  },
  {
    id: "demo-ohtani-18",
    name: "Shohei Ohtani",
    set: "2018 Topps Update",
    year: "2018",
    category: "Sports",
    psa: 9,
    beckett: "9",
    value: 410,
    daysAgo: 14,
    recommendation: "submit",
    worthGrading: "yes",
    confidence: 88,
    insight: "Update RC remains the affordable Ohtani entry with real upside in 9s.",
    market: { raw: 55, psa8: 140, psa9: 410, psa10: 1600 },
  },
  {
    id: "demo-mantle-52",
    name: "Mickey Mantle",
    set: "1952 Topps (#311 Reprint Display)",
    year: "1952",
    category: "Sports",
    psa: 5,
    beckett: "5",
    value: 980,
    daysAgo: 40,
    recommendation: "do-not-submit",
    worthGrading: "no",
    confidence: 76,
    insight: "Display-grade vintage look for portfolio storytelling — not a raw original #311.",
    market: { raw: 600, psa8: 45000, psa9: 180000, psa10: 500000 },
  },
];

/** Additional depth so the collection and chart feel fully populated. */
const EXTRA_SEEDS: Omit<DemoCardSeed, "insight" | "market">[] = [
  { id: "demo-banks-55", name: "Ernie Banks", set: "1955 Topps", year: "1955", category: "Sports", psa: 6, beckett: "6", value: 420, daysAgo: 45, recommendation: "wait", worthGrading: "maybe", confidence: 78 },
  { id: "demo-aaron-54", name: "Hank Aaron", set: "1954 Topps", year: "1954", category: "Sports", psa: 5, beckett: "5.5", value: 890, daysAgo: 52, recommendation: "submit", worthGrading: "yes", confidence: 80 },
  { id: "demo-mays-52", name: "Willie Mays", set: "1952 Topps", year: "1952", category: "Sports", psa: 4, beckett: "4", value: 1100, daysAgo: 60, recommendation: "wait", worthGrading: "maybe", confidence: 74 },
  { id: "demo-clemente-55", name: "Roberto Clemente", set: "1955 Topps", year: "1955", category: "Sports", psa: 6, beckett: "6.5", value: 760, daysAgo: 33, recommendation: "submit", worthGrading: "yes", confidence: 81 },
  { id: "demo-ryan-68", name: "Nolan Ryan", set: "1968 Topps", year: "1968", category: "Sports", psa: 7, beckett: "7", value: 540, daysAgo: 37, recommendation: "submit", worthGrading: "yes", confidence: 83 },
  { id: "demo-henderson-80", name: "Rickey Henderson", set: "1980 Topps", year: "1980", category: "Sports", psa: 8, beckett: "8.5", value: 280, daysAgo: 41, recommendation: "wait", worthGrading: "maybe", confidence: 85 },
  { id: "demo-thomas-90", name: "Frank Thomas", set: "1990 Leaf", year: "1990", category: "Sports", psa: 9, beckett: "9", value: 160, daysAgo: 19, recommendation: "do-not-submit", worthGrading: "no", confidence: 86 },
  { id: "demo-pujols-01", name: "Albert Pujols", set: "2001 Topps", year: "2001", category: "Sports", psa: 9, beckett: "9.5", value: 210, daysAgo: 24, recommendation: "submit", worthGrading: "yes", confidence: 87 },
  { id: "demo-judge-17", name: "Aaron Judge", set: "2017 Topps Chrome", year: "2017", category: "Sports", psa: 10, beckett: "10", value: 380, daysAgo: 7, recommendation: "submit", worthGrading: "yes", confidence: 92 },
  { id: "demo-soto-18", name: "Juan Soto", set: "2018 Topps Update", year: "2018", category: "Sports", psa: 9, beckett: "9", value: 95, daysAgo: 16, recommendation: "wait", worthGrading: "maybe", confidence: 84 },
  { id: "demo-acuna-18", name: "Ronald Acuña Jr.", set: "2018 Topps Update", year: "2018", category: "Sports", psa: 10, beckett: "10", value: 190, daysAgo: 20, recommendation: "submit", worthGrading: "yes", confidence: 91 },
  { id: "demo-elway-84", name: "John Elway", set: "1984 Topps", year: "1984", category: "Sports", psa: 8, beckett: "8", value: 240, daysAgo: 48, recommendation: "wait", worthGrading: "maybe", confidence: 82 },
  { id: "demo-montana-81", name: "Joe Montana", set: "1981 Topps", year: "1981", category: "Sports", psa: 7, beckett: "7.5", value: 510, daysAgo: 55, recommendation: "submit", worthGrading: "yes", confidence: 80 },
  { id: "demo-rice-75", name: "Jerry Rice", set: "1986 Topps", year: "1986", category: "Sports", psa: 8, beckett: "8", value: 190, daysAgo: 43, recommendation: "wait", worthGrading: "maybe", confidence: 83 },
  { id: "demo-brady-00", name: "Tom Brady", set: "2000 Playoff Contenders", year: "2000", category: "Sports", psa: 8, beckett: "8.5", value: 3200, daysAgo: 27, recommendation: "submit", worthGrading: "yes", confidence: 86 },
  { id: "demo-burrow-20", name: "Joe Burrow", set: "2020 Prizm", year: "2020", category: "Sports", psa: 10, beckett: "10", value: 160, daysAgo: 4, recommendation: "wait", worthGrading: "maybe", confidence: 90 },
  { id: "demo-allen-18", name: "Josh Allen", set: "2018 Prizm", year: "2018", category: "Sports", psa: 9, beckett: "9", value: 210, daysAgo: 13, recommendation: "submit", worthGrading: "yes", confidence: 88 },
  { id: "demo-lawrence-21", name: "Trevor Lawrence", set: "2021 Prizm", year: "2021", category: "Sports", psa: 10, beckett: "10", value: 85, daysAgo: 10, recommendation: "do-not-submit", worthGrading: "no", confidence: 89 },
  { id: "demo-gretzky-79", name: "Wayne Gretzky", set: "1979 O-Pee-Chee", year: "1979", category: "Sports", psa: 6, beckett: "6", value: 2800, daysAgo: 70, recommendation: "submit", worthGrading: "yes", confidence: 79 },
  { id: "demo-lemieux-85", name: "Mario Lemieux", set: "1985 Topps", year: "1985", category: "Sports", psa: 8, beckett: "8", value: 620, daysAgo: 66, recommendation: "submit", worthGrading: "yes", confidence: 84 },
  { id: "demo-crosby-05", name: "Sidney Crosby", set: "2005 Upper Deck", year: "2005", category: "Sports", psa: 9, beckett: "9.5", value: 340, daysAgo: 31, recommendation: "submit", worthGrading: "yes", confidence: 87 },
  { id: "demo-mcdavid-15", name: "Connor McDavid", set: "2015 Upper Deck", year: "2015", category: "Sports", psa: 10, beckett: "10", value: 420, daysAgo: 17, recommendation: "submit", worthGrading: "yes", confidence: 92 },
  { id: "demo-bird-81", name: "Larry Bird", set: "1980 Topps", year: "1980", category: "Sports", psa: 7, beckett: "7", value: 480, daysAgo: 58, recommendation: "wait", worthGrading: "maybe", confidence: 81 },
  { id: "demo-magic-80", name: "Magic Johnson", set: "1980 Topps", year: "1980", category: "Sports", psa: 7, beckett: "7.5", value: 520, daysAgo: 61, recommendation: "submit", worthGrading: "yes", confidence: 82 },
  { id: "demo-curry-09", name: "Stephen Curry", set: "2009 Topps", year: "2009", category: "Sports", psa: 9, beckett: "9", value: 680, daysAgo: 25, recommendation: "submit", worthGrading: "yes", confidence: 88 },
  { id: "demo-giannis-13", name: "Giannis Antetokounmpo", set: "2013 Prizm", year: "2013", category: "Sports", psa: 9, beckett: "9", value: 390, daysAgo: 21, recommendation: "submit", worthGrading: "yes", confidence: 86 },
  { id: "demo-luka-18", name: "Luka Dončić", set: "2018 Prizm", year: "2018", category: "Sports", psa: 10, beckett: "10", value: 520, daysAgo: 9, recommendation: "submit", worthGrading: "yes", confidence: 91 },
  { id: "demo-ja-19", name: "Ja Morant", set: "2019 Prizm", year: "2019", category: "Sports", psa: 10, beckett: "10", value: 180, daysAgo: 12, recommendation: "wait", worthGrading: "maybe", confidence: 90 },
  { id: "demo-blastoise-99", name: "Blastoise", set: "1999 Base Set", year: "1999", category: "Pokémon", psa: 8, beckett: "8", value: 420, daysAgo: 35, recommendation: "submit", worthGrading: "yes", confidence: 85 },
  { id: "demo-venusaur-99", name: "Venusaur", set: "1999 Base Set", year: "1999", category: "Pokémon", psa: 7, beckett: "7.5", value: 210, daysAgo: 38, recommendation: "wait", worthGrading: "maybe", confidence: 82 },
  { id: "demo-mewtwo-99", name: "Mewtwo", set: "1999 Base Set", year: "1999", category: "Pokémon", psa: 9, beckett: "9", value: 310, daysAgo: 29, recommendation: "submit", worthGrading: "yes", confidence: 88 },
  { id: "demo-gyarados-99", name: "Gyarados", set: "1999 Base Set", year: "1999", category: "Pokémon", psa: 8, beckett: "8", value: 140, daysAgo: 44, recommendation: "do-not-submit", worthGrading: "no", confidence: 84 },
  { id: "demo-umbreon-neo", name: "Umbreon", set: "Neo Discovery", year: "2001", category: "Pokémon", psa: 9, beckett: "9", value: 890, daysAgo: 26, recommendation: "submit", worthGrading: "yes", confidence: 87 },
  { id: "demo-espeon-neo", name: "Espeon", set: "Neo Discovery", year: "2001", category: "Pokémon", psa: 8, beckett: "8.5", value: 260, daysAgo: 32, recommendation: "wait", worthGrading: "maybe", confidence: 85 },
  { id: "demo-rayquaza-ex", name: "Rayquaza ex", set: "Dragon Frontiers", year: "2006", category: "Pokémon", psa: 9, beckett: "9", value: 340, daysAgo: 23, recommendation: "submit", worthGrading: "yes", confidence: 86 },
  { id: "demo-moon-alpha", name: "Moon", set: "Alpha", year: "1993", category: "Magic", psa: 8, beckett: "8", value: 180, daysAgo: 50, recommendation: "wait", worthGrading: "maybe", confidence: 80 },
  { id: "demo-rhystic", name: "Rhystic Study", set: "Prophecy", year: "2000", category: "Magic", psa: 9, beckett: "9", value: 95, daysAgo: 36, recommendation: "do-not-submit", worthGrading: "no", confidence: 88 },
  { id: "demo-force-nature", name: "Force of Negation", set: "Modern Horizons", year: "2019", category: "Magic", psa: 10, beckett: "10", value: 70, daysAgo: 8, recommendation: "wait", worthGrading: "maybe", confidence: 93 },
  { id: "demo-blueeyes", name: "Blue-Eyes White Dragon", set: "LOB-001", year: "2002", category: "Yu-Gi-Oh", psa: 8, beckett: "8", value: 310, daysAgo: 42, recommendation: "submit", worthGrading: "yes", confidence: 84 },
  { id: "demo-darkmag", name: "Dark Magician", set: "LOB-005", year: "2002", category: "Yu-Gi-Oh", psa: 9, beckett: "9", value: 220, daysAgo: 39, recommendation: "submit", worthGrading: "yes", confidence: 87 },
  { id: "demo-exodia", name: "Exodia the Forbidden One", set: "LOB", year: "2002", category: "Yu-Gi-Oh", psa: 7, beckett: "7", value: 160, daysAgo: 47, recommendation: "wait", worthGrading: "maybe", confidence: 79 },
  { id: "demo-luffy-op01", name: "Monkey D. Luffy", set: "OP-01 Romance Dawn", year: "2022", category: "One Piece", psa: 10, beckett: "10", value: 130, daysAgo: 5, recommendation: "wait", worthGrading: "maybe", confidence: 91 },
  { id: "demo-zoro-op01", name: "Roronoa Zoro", set: "OP-01 Romance Dawn", year: "2022", category: "One Piece", psa: 9, beckett: "9", value: 75, daysAgo: 11, recommendation: "do-not-submit", worthGrading: "no", confidence: 89 },
  { id: "demo-nami-op01", name: "Nami", set: "OP-01 Romance Dawn", year: "2022", category: "One Piece", psa: 10, beckett: "10", value: 90, daysAgo: 14, recommendation: "wait", worthGrading: "maybe", confidence: 90 },
  { id: "demo-elsa-lorcana", name: "Elsa - Snow Queen", set: "The First Chapter", year: "2023", category: "Disney Lorcana", psa: 10, beckett: "10", value: 110, daysAgo: 6, recommendation: "wait", worthGrading: "maybe", confidence: 92 },
  { id: "demo-mickey-lorcana", name: "Mickey Mouse - Brave Little Tailor", set: "The First Chapter", year: "2023", category: "Disney Lorcana", psa: 9, beckett: "9", value: 85, daysAgo: 18, recommendation: "do-not-submit", worthGrading: "no", confidence: 88 },
  { id: "demo-stitch-lorcana", name: "Stitch - Carefree Surfer", set: "The First Chapter", year: "2023", category: "Disney Lorcana", psa: 10, beckett: "10", value: 65, daysAgo: 3, recommendation: "wait", worthGrading: "maybe", confidence: 91 },
  { id: "demo-robinson-48", name: "Jackie Robinson", set: "1948 Leaf (Reprint Display)", year: "1948", category: "Sports", psa: 5, beckett: "5", value: 640, daysAgo: 75, recommendation: "wait", worthGrading: "maybe", confidence: 73 },
  { id: "demo-williams-39", name: "Ted Williams", set: "1939 Play Ball (Reprint Display)", year: "1939", category: "Sports", psa: 4, beckett: "4", value: 520, daysAgo: 80, recommendation: "do-not-submit", worthGrading: "no", confidence: 71 },
  { id: "demo-bonds-87", name: "Barry Bonds", set: "1987 Topps Tiffany", year: "1987", category: "Sports", psa: 9, beckett: "9", value: 140, daysAgo: 53, recommendation: "wait", worthGrading: "maybe", confidence: 86 },
  { id: "demo-gwynn-83", name: "Tony Gwynn", set: "1983 Topps", year: "1983", category: "Sports", psa: 8, beckett: "8", value: 120, daysAgo: 57, recommendation: "do-not-submit", worthGrading: "no", confidence: 84 },
  { id: "demo-ripken-82", name: "Cal Ripken Jr.", set: "1982 Topps", year: "1982", category: "Sports", psa: 8, beckett: "8.5", value: 260, daysAgo: 49, recommendation: "submit", worthGrading: "yes", confidence: 85 },
  { id: "demo-sandberg-83", name: "Ryne Sandberg", set: "1983 Topps", year: "1983", category: "Sports", psa: 9, beckett: "9", value: 95, daysAgo: 54, recommendation: "do-not-submit", worthGrading: "no", confidence: 87 },
  { id: "demo-boggs-83", name: "Wade Boggs", set: "1983 Topps", year: "1983", category: "Sports", psa: 8, beckett: "8", value: 70, daysAgo: 62, recommendation: "do-not-submit", worthGrading: "no", confidence: 85 },
  { id: "demo-mattingly-84", name: "Don Mattingly", set: "1984 Donruss", year: "1984", category: "Sports", psa: 9, beckett: "9", value: 110, daysAgo: 46, recommendation: "wait", worthGrading: "maybe", confidence: 86 },
];

function defaultMarket(value: number, psa: number) {
  const raw = Math.max(5, Math.round(value * (psa >= 9 ? 0.18 : psa >= 8 ? 0.28 : 0.4)));
  return {
    raw,
    psa8: Math.round(value * (psa === 8 ? 1 : 0.55)),
    psa9: Math.round(value * (psa === 9 ? 1 : psa >= 10 ? 0.55 : 1.35)),
    psa10: Math.round(value * (psa >= 10 ? 1 : 2.8)),
  };
}

function defaultInsight(name: string, psa: number, rec: Recommendation): string {
  if (rec === "submit") {
    return `${name} grades around PSA ${psa.toFixed(1)} with market support for submission at current comps.`;
  }
  if (rec === "wait") {
    return `${name} is close, but condition or pop risk suggests waiting for a stronger copy before paying grading fees.`;
  }
  return `${name} is better held raw — grading fees would likely exceed the expected slab premium.`;
}

function cornerScores(psa: number): [number, number, number, number] {
  const base = Math.min(10, Math.max(4, psa));
  return [
    Math.min(10, base + 0.5),
    base,
    Math.min(10, base + 0.25),
    Math.max(4, base - 0.25),
  ];
}

function formatDemoDate(daysAgo: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function seedToGrade(seed: DemoCardSeed): DashboardGrade {
  const psa = seed.psa;
  return {
    id: seed.id,
    name: seed.name,
    set: seed.set,
    year: seed.year,
    category: seed.category,
    cardId: seed.cardId ?? null,
    imageUrl: seed.cardId
      ? null
      : demoPlaceholderImage(seed.name, seed.category),
    psa,
    beckett: seed.beckett,
    confidence: seed.confidence,
    worthGrading: seed.worthGrading,
    estimatedValue: seed.value,
    date: formatDemoDate(seed.daysAgo),
    status: "complete",
    creditUsed: 1,
    centering: seed.centering ?? {
      lr: psa >= 9 ? "50/50" : psa >= 8 ? "55/45" : "65/35",
      tb: psa >= 9 ? "50/50" : "55/45",
      pass: psa >= 8,
    },
    corners: {
      scores: cornerScores(psa),
      notes: seed.cornersNotes ?? "Corners inspected under angled light.",
    },
    edges: {
      score: Math.min(10, Math.max(4, psa - (psa >= 9 ? 0 : 0.5))),
      notes: seed.edgesNotes ?? "Minor factory edge texture; no heavy chipping.",
    },
    surface: {
      score: Math.min(10, Math.max(4, psa + (psa >= 9 ? 0.25 : 0))),
      notes: seed.surfaceNotes ?? "No major scratches or print defects observed.",
    },
    market: seed.market,
    recommendation: seed.recommendation,
    insight: seed.insight,
  };
}

/** Simple branded SVG placeholder so non-asset cards still look intentional. */
export function demoPlaceholderImage(name: string, category: string): string {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const label = name.replace(/[<>&"']/g, "");
  const cat = category.replace(/[<>&"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="700" viewBox="0 0 500 700">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#14532d"/>
    </linearGradient>
  </defs>
  <rect width="500" height="700" rx="28" fill="url(#g)"/>
  <rect x="22" y="22" width="456" height="656" rx="18" fill="none" stroke="#16A34A" stroke-width="6"/>
  <rect x="40" y="40" width="420" height="620" rx="12" fill="none" stroke="#16A34A" stroke-opacity="0.35" stroke-width="2"/>
  <text x="250" y="320" text-anchor="middle" font-family="Georgia, serif" font-size="92" fill="#86efac" font-weight="700">${initials}</text>
  <text x="250" y="390" text-anchor="middle" font-family="system-ui,sans-serif" font-size="22" fill="#ecfdf5">${label}</text>
  <text x="250" y="430" text-anchor="middle" font-family="system-ui,sans-serif" font-size="16" fill="#86efac" opacity="0.85">${cat}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function expandExtra(
  row: Omit<DemoCardSeed, "insight" | "market">
): DemoCardSeed {
  return {
    ...row,
    market: defaultMarket(row.value, row.psa),
    insight: defaultInsight(row.name, row.psa, row.recommendation),
  };
}

let cachedGrades: DashboardGrade[] | null = null;

export function getDemoGrades(): DashboardGrade[] {
  if (cachedGrades) return cachedGrades;
  const all = [
    ...DEMO_CARD_SEEDS,
    ...EXTRA_SEEDS.map(expandExtra),
  ];
  cachedGrades = all.map(seedToGrade).sort((a, b) => {
    const da = Date.parse(a.date) || 0;
    const db = Date.parse(b.date) || 0;
    return db - da;
  });
  return cachedGrades;
}

export function getDemoGradeById(id: string): DashboardGrade | undefined {
  return getDemoGrades().find((g) => g.id === id);
}

function buildCorners(psa: number): CornerDetail[] {
  const scores = cornerScores(psa);
  const ids = ["tl", "tr", "bl", "br"] as const;
  const labels = ["Top Left", "Top Right", "Bottom Left", "Bottom Right"];
  return ids.map((id, i) => ({
    id,
    label: labels[i],
    score: scores[i],
    condition:
      scores[i] >= 9.5 ? "Sharp" : scores[i] >= 8.5 ? "Slight soft" : "Visible wear",
    damage: scores[i] >= 9.5 ? 0 : scores[i] >= 8.5 ? 8 : 22,
    notes:
      scores[i] >= 9.5
        ? "Sharp under 10x."
        : scores[i] >= 8.5
          ? "Slight softening visible at an angle."
          : "Visible wear that caps the overall grade.",
  }));
}

function buildDefects(psa: number): SurfaceDefect[] {
  if (psa >= 9.5) return [];
  if (psa >= 8.5) {
    return [
      {
        id: "d1",
        type: "scratch",
        severity: "low",
        location: "Lower photo area",
        impact: "Minor — does not dominate the surface score.",
        x: 48,
        y: 72,
      },
    ];
  }
  return [
    {
      id: "d1",
      type: "print-line",
      severity: "medium",
      location: "Center face",
      impact: "Factory print line that factors into the surface score.",
      x: 52,
      y: 44,
    },
    {
      id: "d2",
      type: "scratch",
      severity: "low",
      location: "Back lower edge",
      impact: "Light sleeve scuff.",
      x: 60,
      y: 88,
    },
  ];
}

export function getDemoRichReport(grade: DashboardGrade): RichGradeReport {
  const submissionCost = grade.category === "Sports" ? 25 : 20;
  const potentialProfit = Math.max(
    0,
    Math.round(grade.estimatedValue - grade.market.raw - submissionCost)
  );
  const roi =
    grade.market.raw > 0
      ? Math.round((potentialProfit / (grade.market.raw + submissionCost)) * 100)
      : 0;

  const [l, r] = grade.centering.lr.split("/").map((n) => Number(n) || 50);
  const [t, b] = grade.centering.tb.split("/").map((n) => Number(n) || 50);

  return {
    grade,
    explanation: grade.insight,
    centeringDetail: {
      left: l,
      right: r,
      top: t,
      bottom: b,
    },
    corners: buildCorners(grade.psa),
    edges: {
      top: { whitening: grade.psa >= 9 ? 5 : 18, notes: grade.edges.notes },
      right: { whitening: grade.psa >= 9 ? 4 : 14, notes: "Right edge clean overall." },
      bottom: { whitening: grade.psa >= 9 ? 6 : 20, notes: "Bottom factory edge." },
      left: { whitening: grade.psa >= 9 ? 5 : 16, notes: "Left long edge." },
    },
    defects: buildDefects(grade.psa),
    submissionCost,
    potentialProfit,
    roiLabel: roi >= 40 ? "Strong" : roi >= 15 ? "Moderate" : "Thin",
    marketSource: "estimate",
    marketProductName: `${grade.year} ${grade.set} ${grade.name}`,
    marketUrl: null,
  };
}

export const DEMO_USER = {
  displayName: "Demo Collector",
  email: "demo@gemmint.ai",
  tagline: "Sample portfolio for product walkthroughs",
} as const;
