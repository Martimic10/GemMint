export const SITE = {
  name: "GemMint",
  tagline: "Professional AI Trading Card Grading",
  description:
    "Predict your PSA and Beckett grades in under 30 seconds using advanced computer vision.",
  url: "https://gemmint.ai",
} as const;

export const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Technology", href: "/#technology" },
  { label: "Pricing", href: "/pricing" },
] as const;

export const TRUST_CATEGORIES = [
  {
    title: "Centering",
    description:
      "Measures left-right and top-bottom borders with sub-millimeter precision.",
    icon: "centering" as const,
  },
  {
    title: "Corners",
    description:
      "Detects whitening, soft tips, and structural wear on every corner.",
    icon: "corners" as const,
  },
  {
    title: "Edges",
    description:
      "Analyzes chipping, wear, and print line consistency along all four edges.",
    icon: "edges" as const,
  },
  {
    title: "Surface",
    description:
      "Identifies scratches, print defects, stains, and surface imperfections.",
    icon: "surface" as const,
  },
  {
    title: "Print Quality",
    description:
      "Evaluates registration, color fidelity, and factory print anomalies.",
    icon: "print" as const,
  },
  {
    title: "Authenticity",
    description:
      "AI-assisted counterfeit detection trained on verified authentic cards.",
    icon: "authenticity" as const,
    comingSoon: true,
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Upload your card",
    description:
      "Capture clear front and back photos. GemMint detects the card instantly and prepares it for inspection.",
  },
  {
    step: 2,
    title: "AI inspection",
    description:
      "Computer vision scores centering, corners, edges, and surface independently — just like a grading lab.",
  },
  {
    step: 3,
    title: "Get your report",
    description:
      "Receive PSA and Beckett predictions, confidence, and a submission recommendation in under 30 seconds.",
  },
] as const;

export const FEATURE_DETAILS = [
  {
    id: "corners" as const,
    title: "Corner Analysis",
    description:
      "Pixel-level detection of whitening, rounding, and structural damage across all four corners.",
    points: [
      "Soft tip and whitening detection",
      "Independent scoring per corner",
      "Matches PSA and Beckett standards",
    ],
  },
  {
    id: "edges" as const,
    title: "Edge Inspection",
    description:
      "Continuous edge scanning identifies chipping, print lines, and wear with grading-lab accuracy.",
    points: [
      "Full perimeter edge tracing",
      "Chip and print-line detection",
      "Wear severity mapping",
    ],
  },
  {
    id: "centering" as const,
    title: "Centering Measurement",
    description:
      "Precise border ratio calculations matching PSA and Beckett centering standards.",
    points: [
      "Left-right and top-bottom ratios",
      "Sub-millimeter border precision",
      "Lab-aligned centering grades",
    ],
  },
  {
    id: "surface" as const,
    title: "Surface Scanning",
    description:
      "Heatmap visualization of scratches, stains, and print defects invisible to the naked eye.",
    points: [
      "Scratch and stain heatmaps",
      "Print defect highlighting",
      "Surface cleanliness score",
    ],
  },
] as const;

export const WHY_COMPARISON = [
  {
    category: "Time to result",
    traditional: "Days to weeks waiting on a lab",
    gemmint: "Under 30 seconds",
  },
  {
    category: "Cost per decision",
    traditional: "$20–$150+ per submission",
    gemmint: "Credit packs from $29.99",
  },
  {
    category: "Grade insight",
    traditional: "Guess based on experience",
    gemmint: "PSA & Beckett AI predictions",
  },
  {
    category: "Category breakdown",
    traditional: "Unavailable until slabbed",
    gemmint: "Centering, corners, edges, surface",
  },
  {
    category: "Visual evidence",
    traditional: "None before submission",
    gemmint: "Damage heatmap & annotations",
  },
  {
    category: "Submission guidance",
    traditional: "Trial and error",
    gemmint: "Clear submit / hold recommendation",
  },
] as const;

export const PRICING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 29.99,
    description:
      "Ideal for collectors grading a shortlist of cards.",
    featureGroup: "Includes",
    features: [
      "10 professional AI grading reports",
      "PSA & Beckett predictions",
      "Centering, corners, edges, surface",
      "Credits never expire",
    ],
    cta: "Get Starter",
    highlighted: false,
    credits: 10,
  },
  {
    id: "collector",
    name: "Collector",
    price: 49.99,
    description:
      "Best value for active collectors and small shops.",
    featureGroup: "Includes",
    features: [
      "25 professional AI grading reports",
      "Lowest cost per scan",
      "Full visual heatmaps & measurements",
      "PDF export ready",
      "Credits never expire",
    ],
    cta: "Get Collector",
    highlighted: true,
    credits: 25,
  },
  {
    id: "dealer",
    name: "Dealer",
    price: 199.99,
    description:
      "Volume pricing for dealers and high-volume graders.",
    featureGroup: "Includes",
    features: [
      "100 professional AI grading reports",
      "Best volume pricing",
      "Priority-ready for inventory",
      "Shared across your account",
      "Credits never expire",
    ],
    cta: "Get Dealer",
    highlighted: false,
    credits: 100,
  },
] as const;

export const PRICING_COMPARISON = [
  {
    feature: "Professional AI grading reports",
    starter: "10 credits",
    collector: "25 credits",
    dealer: "100 credits",
  },
  {
    feature: "PSA & Beckett predictions",
    starter: true,
    collector: true,
    dealer: true,
  },
  {
    feature: "Confidence score",
    starter: true,
    collector: true,
    dealer: true,
  },
  {
    feature: "Centering, corners, edges, surface",
    starter: true,
    collector: true,
    dealer: true,
  },
  {
    feature: "Damage heatmaps & measurements",
    starter: true,
    collector: true,
    dealer: true,
  },
  {
    feature: "PDF export",
    starter: true,
    collector: true,
    dealer: true,
  },
  {
    feature: "Credits never expire",
    starter: true,
    collector: true,
    dealer: true,
  },
  {
    feature: "Best cost per scan",
    starter: false,
    collector: true,
    dealer: true,
  },
  {
    feature: "Volume pricing",
    starter: false,
    collector: false,
    dealer: true,
  },
] as const;

export const PRICING_FAQ_ITEMS = [
  {
    question: "Do I need a subscription?",
    answer:
      "No. Every option is a one-time purchase — including the $7.99 Professional Report and Starter, Collector, and Dealer credit packs. Credits never expire and there is no monthly commitment.",
  },
  {
    question: "Can I buy just one report?",
    answer:
      "Yes. Professional Report is a one-time $7.99 purchase for a single full AI grading report — PSA and Beckett predictions, category analysis, heatmaps, market value, ROI guidance, and a downloadable PDF.",
  },
  {
    question: "How do scan credits work?",
    answer:
      "Every completed AI grading report uses one scan credit. Credits are only deducted after a report is successfully generated. Failed analyses do not consume a credit.",
  },
  {
    question: "Which option should I choose?",
    answer:
      "Need one card graded? Buy Professional Report ($7.99). Grading a shortlist? Starter (10). Active collecting? Collector (25) is the best value. High-volume shops should pick Dealer (100).",
  },
  {
    question: "Do new accounts get a free scan?",
    answer:
      "Yes. Every new account includes 1 free professional AI grading report — no credit card required.",
  },
  {
    question: "What payment methods will you accept?",
    answer:
      "Checkout will be powered by Stripe and support major credit and debit cards. Additional payment options may be added at launch.",
  },
  {
    question: "Is there a refund policy?",
    answer:
      "If analysis fails due to a technical issue on our side, we will re-run the report or refund the credit. Grade predictions themselves are informational and not eligible for refunds based on final lab results.",
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "How accurate are GemMint grade predictions?",
    answer:
      "Our computer vision models are trained on millions of professionally graded cards. Predictions typically fall within one half-grade of final lab results for modern cards in good lighting. Accuracy improves further with high-resolution, well-lit front and back images.",
  },
  {
    question: "Does GemMint replace PSA or Beckett grading?",
    answer:
      "No. GemMint is a pre-submission analysis tool. We help you predict likely grades, identify defects, and decide whether a card is worth the cost of professional grading. Final slabs still come from PSA, Beckett, and other labs.",
  },
  {
    question: "What image quality do I need?",
    answer:
      "Use a well-lit, high-resolution photo of both the front and back. Avoid glare, shadows, and tilted angles. Smartphone cameras work well when the card fills most of the frame and sits on a clean, contrasting background.",
  },
  {
    question: "Which card types are supported?",
    answer:
      "GemMint currently supports modern and vintage sports cards, Pokémon, and other major TCG categories. Coverage continues to expand as we train on additional sets and eras.",
  },
  {
    question: "How is estimated market value calculated?",
    answer:
      "We combine the predicted grade with recent comparable sales data for similar cards. Values are estimates intended for decision support and should not be treated as formal appraisals.",
  },
  {
    question: "Can I export or share my grading report?",
    answer:
      "Yes. Every scan credit unlocks a full professional report you can export as a PDF — including grades, subgrades, heatmaps, measurements, and submission recommendations.",
  },
  {
    question: "Do I need a subscription?",
    answer:
      "No. GemMint sells scan credit packs (Starter, Collector, Dealer). Buy when you need them — credits never expire, and new accounts get 1 free professional scan.",
  },
] as const;

export const FEATURES_HIGHLIGHTS = [
  {
    value: "<30s",
    label: "Average analysis time",
  },
  {
    value: "PSA + BGS",
    label: "Dual grading standards",
  },
  {
    value: "4+",
    label: "Independent category scores",
  },
  {
    value: "PDF",
    label: "Printable professional reports",
  },
] as const;

export const FEATURES_CAPABILITIES = [
  {
    title: "Dual-standard predictions",
    description:
      "Get PSA and Beckett grade estimates from the same scan so you can compare labs before you submit.",
    icon: "standards" as const,
  },
  {
    title: "Confidence scoring",
    description:
      "Every prediction includes a confidence score so you know when the model is certain — and when to look closer.",
    icon: "confidence" as const,
  },
  {
    title: "Damage heatmaps",
    description:
      "Visual overlays highlight scratches, whitening, and surface issues that are easy to miss by eye.",
    icon: "heatmap" as const,
  },
  {
    title: "Submission guidance",
    description:
      "Clear recommendations help you decide whether a card is worth grading fees — before you spend.",
    icon: "guidance" as const,
  },
  {
    title: "Market value estimates",
    description:
      "Pair predicted grades with estimated market ranges to prioritize the highest-ROI cards in your collection.",
    icon: "value" as const,
  },
  {
    title: "Centering precision",
    description:
      "Border ratios measured to lab standards so left-right and top-bottom centering are never a guess.",
    icon: "centering" as const,
  },
] as const;

export const FEATURES_FAQ_ITEMS = [
  {
    question: "What does GemMint analyze on each card?",
    answer:
      "Every scan evaluates centering, corners, edges, and surface — plus heatmaps, measurements, annotations, and submission guidance in the full professional report.",
  },
  {
    question: "How is this different from guessing a grade myself?",
    answer:
      "GemMint applies consistent computer-vision measurements across every category, then maps those signals to PSA and Beckett standards — reducing bias and catching defects that are easy to overlook.",
  },
  {
    question: "Will I see visual evidence in the report?",
    answer:
      "Yes. Reports include annotated card views, damage heatmaps, and centering measurements so you can understand why a grade was predicted.",
  },
  {
    question: "Can dealers and investors use GemMint at scale?",
    answer:
      "Yes. Buy Dealer packs for volume inventory, or Collector packs for active collecting. Credits never expire, so you can scan at your own pace.",
  },
  {
    question: "Does authenticity detection work today?",
    answer:
      "Authenticity analysis is listed as Coming Soon. Core grading categories — centering, corners, edges, surface, and print quality — are available now.",
  },
] as const;

export const FOOTER_LINKS = {
  product: [
    { label: "Features", href: "/features" },
    { label: "Technology", href: "/#technology" },
    { label: "Pricing", href: "/pricing" },
  ],
  company: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
  resources: [
    { label: "Report preview", href: "/features#report" },
    { label: "Professional Report", href: "/pricing#professional" },
    { label: "Starter Pack", href: "/pricing#starter" },
    { label: "Collector Pack", href: "/pricing#collector" },
  ],
} as const;
