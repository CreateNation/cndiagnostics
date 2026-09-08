export type QuestionRole =
  | "personalization"
  | "stage_primary"
  | "stage_secondary"
  | "dimension_score"
  | "lead_qualification"
  | "objection_intelligence"
  | "urgency"
  | "contact";

export type QuestionType =
  | "single"
  | "multi"
  | "dropdown"
  | "scale"
  | "text"
  | "email";

export type QuestionOption = {
  value: string;
  label: string;
  /** 0–4 score when question is dimension-scored */
  score?: number;
};

export type Question = {
  id: string;
  section: string;
  prompt: string;
  helpText?: string;
  type: QuestionType;
  required: boolean;
  role: QuestionRole[];
  dimension?:
    | "audience"
    | "offer"
    | "funnel"
    | "content"
    | "systems";
  /** reverse: higher self-reliance / promo = lower score */
  reverse?: boolean;
  options?: QuestionOption[];
};

export const INDUSTRIES = [
  "Real Estate",
  "Healthcare / Clinics",
  "Education / Training",
  "Professional Services",
  "Retail / E-commerce",
  "Hospitality (non-restaurant)",
  "Technology / SaaS",
  "Construction / Contracting",
  "Automotive",
  "Beauty / Wellness",
  "Finance / Insurance",
  "Manufacturing",
  "Logistics / Transport",
  "Other",
] as const;

export const QUESTIONS: Question[] = [
  {
    id: "Q1",
    section: "Identity",
    prompt: "What industry is your business in?",
    helpText: "We do not work with restaurants.",
    type: "dropdown",
    required: true,
    role: ["personalization"],
    options: INDUSTRIES.map((label) => ({
      value: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label,
    })),
  },
  {
    id: "Q2",
    section: "Identity",
    prompt: "How many years has the business been operating?",
    type: "single",
    required: true,
    role: ["personalization", "stage_secondary"],
    options: [
      { value: "under-1", label: "Less than 1 year", score: 0 },
      { value: "1-3", label: "1–3 years", score: 1 },
      { value: "3-5", label: "3–5 years", score: 2 },
      { value: "5-10", label: "5–10 years", score: 3 },
      { value: "over-10", label: "10+ years", score: 4 },
    ],
  },
  {
    id: "Q3",
    section: "Current Results",
    prompt: "What is your average monthly revenue over the last 3–6 months?",
    type: "single",
    required: true,
    role: ["stage_primary"],
    options: [
      { value: "pre-revenue", label: "Pre-revenue" },
      { value: "under-50k", label: "Under AED 50K / month" },
      { value: "50k-200k", label: "AED 50K–200K / month" },
      { value: "200k-500k", label: "AED 200K–500K / month" },
      { value: "500k-1m", label: "AED 500K–1M / month" },
      { value: "over-1m", label: "Over AED 1M / month" },
    ],
  },
  {
    id: "Q4",
    section: "Current Results",
    prompt: "Do you personally close most sales yourself?",
    type: "scale",
    required: true,
    role: ["stage_secondary"],
    reverse: true,
    options: [
      { value: "0", label: "Always me — I close almost everything", score: 0 },
      { value: "1", label: "Mostly me", score: 1 },
      { value: "2", label: "Split between me and others", score: 2 },
      { value: "3", label: "Mostly delegated", score: 3 },
      { value: "4", label: "Fully delegated", score: 4 },
    ],
  },
  {
    id: "Q5",
    section: "Current Results",
    prompt: "How has revenue trended over the last 6 months?",
    type: "single",
    required: true,
    role: ["personalization", "urgency"],
    options: [
      { value: "declining", label: "Declining", score: 0 },
      { value: "flat", label: "Flat", score: 1 },
      { value: "slow", label: "Slowly growing", score: 2 },
      { value: "steady", label: "Growing steadily", score: 3 },
      { value: "fast", label: "Growing fast", score: 4 },
    ],
  },
  {
    id: "Q6",
    section: "Audience & Positioning",
    prompt: "How specifically can you describe your ideal customer?",
    type: "scale",
    required: true,
    role: ["dimension_score"],
    dimension: "audience",
    options: [
      { value: "0", label: "Broad guess only", score: 0 },
      { value: "1", label: "Vague industry or location", score: 1 },
      { value: "2", label: "Some traits defined", score: 2 },
      { value: "3", label: "Clear profile with needs and budget", score: 3 },
      { value: "4", label: "Hyper-specific (need, budget, behavior)", score: 4 },
    ],
  },
  {
    id: "Q7",
    section: "Audience & Positioning",
    prompt:
      "If a prospect compared you to 3 competitors, how clear is your answer for why they’d choose you?",
    type: "scale",
    required: true,
    role: ["dimension_score"],
    dimension: "audience",
    options: [
      { value: "0", label: "No clear answer", score: 0 },
      { value: "1", label: "Generic claims", score: 1 },
      { value: "2", label: "Some differentiation", score: 2 },
      { value: "3", label: "Clear point of difference", score: 3 },
      { value: "4", label: "One sharp sentence — tested and proven", score: 4 },
    ],
  },
  {
    id: "Q8",
    section: "Audience & Positioning",
    prompt: "Do you know which customer type is most profitable for you?",
    type: "scale",
    required: true,
    role: ["dimension_score"],
    dimension: "audience",
    options: [
      { value: "0", label: "No idea", score: 0 },
      { value: "1", label: "Rough sense", score: 1 },
      { value: "2", label: "Somewhat clear", score: 2 },
      { value: "3", label: "Yes, we know them", score: 3 },
      { value: "4", label: "Yes — and we prioritize acquiring them", score: 4 },
    ],
  },
  {
    id: "Q9",
    section: "Offer Strength",
    prompt:
      "Is your offer built around the outcome the client gets, or a list of services?",
    type: "scale",
    required: true,
    role: ["dimension_score"],
    dimension: "offer",
    options: [
      { value: "0", label: "Mostly a service list", score: 0 },
      { value: "1", label: "Services with some benefits", score: 1 },
      { value: "2", label: "Mix of services and outcomes", score: 2 },
      { value: "3", label: "Mostly outcome-framed", score: 3 },
      { value: "4", label: "Fully outcome-framed with proof", score: 4 },
    ],
  },
  {
    id: "Q10",
    section: "Offer Strength",
    prompt: "How confident are you that your pricing matches your value vs. the market?",
    type: "scale",
    required: true,
    role: ["dimension_score"],
    dimension: "offer",
    options: [
      { value: "0", label: "Guessing", score: 0 },
      { value: "1", label: "Low confidence", score: 1 },
      { value: "2", label: "Somewhat confident", score: 2 },
      { value: "3", label: "Confident from experience", score: 3 },
      { value: "4", label: "Data-backed and tested", score: 4 },
    ],
  },
  {
    id: "Q11",
    section: "Offer Strength",
    prompt:
      "Have you tested or changed pricing/packaging in the last 12 months based on real data?",
    type: "scale",
    required: true,
    role: ["dimension_score"],
    dimension: "offer",
    options: [
      { value: "0", label: "Never", score: 0 },
      { value: "1", label: "Once, gut feel", score: 1 },
      { value: "2", label: "Occasionally", score: 2 },
      { value: "3", label: "Several times with feedback", score: 3 },
      { value: "4", label: "Regularly, based on results", score: 4 },
    ],
  },
  {
    id: "Q12",
    section: "Funnel & Conversion",
    prompt:
      "Can you map the exact steps a prospect takes from discovering you to paying?",
    type: "scale",
    required: true,
    role: ["dimension_score"],
    dimension: "funnel",
    options: [
      { value: "0", label: "No defined path", score: 0 },
      { value: "1", label: "Rough idea", score: 1 },
      { value: "2", label: "Partial map", score: 2 },
      { value: "3", label: "Documented for main channel", score: 3 },
      { value: "4", label: "Fully documented, repeated for every lead", score: 4 },
    ],
  },
  {
    id: "Q13",
    section: "Funnel & Conversion",
    prompt: "Do you know exactly where you lose the most interested prospects?",
    type: "scale",
    required: true,
    role: ["dimension_score"],
    dimension: "funnel",
    options: [
      { value: "0", label: "No idea", score: 0 },
      { value: "1", label: "Vague sense", score: 1 },
      { value: "2", label: "Know the stage, not the %", score: 2 },
      { value: "3", label: "Know stage and approximate %", score: 3 },
      { value: "4", label: "Exact stage and % known", score: 4 },
    ],
  },
  {
    id: "Q14",
    section: "Funnel & Conversion",
    prompt:
      "Is there one written, consistent sales script/process anyone on your team follows?",
    type: "scale",
    required: true,
    role: ["dimension_score"],
    dimension: "funnel",
    options: [
      { value: "0", label: "Everyone improvises", score: 0 },
      { value: "1", label: "Loose talking points", score: 1 },
      { value: "2", label: "Partial process", score: 2 },
      { value: "3", label: "Written process for most deals", score: 3 },
      { value: "4", label: "Fully scripted: value, differentiation, close", score: 4 },
    ],
  },
  {
    id: "Q15",
    section: "Funnel & Conversion",
    prompt: "What % of qualified leads convert to paying customers?",
    type: "single",
    required: true,
    role: ["dimension_score", "personalization"],
    dimension: "funnel",
    options: [
      { value: "under-10", label: "Under 10%", score: 0 },
      { value: "10-25", label: "10–25%", score: 1 },
      { value: "25-40", label: "25–40%", score: 2 },
      { value: "40-60", label: "40–60%", score: 3 },
      { value: "over-60", label: "60%+", score: 4 },
    ],
  },
  {
    id: "Q16",
    section: "Content & Demand",
    prompt:
      "Does your organic content build trust and authority, or is it mostly direct offers/promotion?",
    type: "scale",
    required: true,
    role: ["dimension_score"],
    dimension: "content",
    options: [
      { value: "0", label: "Mostly promo / hard sell", score: 0 },
      { value: "1", label: "Mostly promo with some value", score: 1 },
      { value: "2", label: "Balanced", score: 2 },
      { value: "3", label: "Mostly authority-building", score: 3 },
      { value: "4", label: "Fully authority-building", score: 4 },
    ],
  },
  {
    id: "Q17",
    section: "Content & Demand",
    prompt:
      "Are paid ads tied to one clear offer with a specific CTA, or mostly general brand awareness?",
    type: "scale",
    required: true,
    role: ["dimension_score"],
    dimension: "content",
    options: [
      { value: "0", label: "No ads / generic with no CTA", score: 0 },
      { value: "1", label: "Mostly awareness", score: 1 },
      { value: "2", label: "Mix of brand and offers", score: 2 },
      { value: "3", label: "Mostly offer-led", score: 3 },
      { value: "4", label: "Fully offer-led, one clear CTA", score: 4 },
    ],
  },
  {
    id: "Q18",
    section: "Content & Demand",
    prompt:
      "Does your content reach cold/new audiences, or only people already close to buying?",
    type: "scale",
    required: true,
    role: ["dimension_score"],
    dimension: "content",
    options: [
      { value: "0", label: "Only warm audience", score: 0 },
      { value: "1", label: "Mostly warm", score: 1 },
      { value: "2", label: "Some cold reach", score: 2 },
      { value: "3", label: "Cold and warm planned", score: 3 },
      { value: "4", label: "Deliberate content for every awareness level", score: 4 },
    ],
  },
  {
    id: "Q19",
    section: "Systems",
    prompt: "Do you currently work with an agency or freelancer? If yes, monthly spend?",
    type: "single",
    required: true,
    role: ["lead_qualification"],
    options: [
      { value: "none", label: "No agency / freelancer" },
      { value: "under-5k", label: "Under AED 5K / month" },
      { value: "5k-10k", label: "AED 5K–10K / month" },
      { value: "10k-20k", label: "AED 10K–20K / month" },
      { value: "over-20k", label: "AED 20K+ / month" },
    ],
  },
  {
    id: "Q20",
    section: "Systems",
    prompt: "How many people are dedicated to your marketing today (in-house or outsourced)?",
    type: "single",
    required: true,
    role: ["dimension_score", "lead_qualification"],
    dimension: "systems",
    options: [
      { value: "just-me", label: "Just me — no one else", score: 0 },
      { value: "part-time", label: "1 person part-time", score: 1 },
      { value: "full-time", label: "1 person full-time", score: 2 },
      { value: "2-3", label: "2–3 person in-house team", score: 3 },
      { value: "outsourced", label: "Outsourced agency or freelancer handling it", score: 3 },
      { value: "4-plus", label: "4+ person team or department", score: 4 },
    ],
  },
  {
    id: "Q21",
    section: "Systems",
    prompt: "Which marketing activities are you currently running?",
    helpText: "Select all that apply.",
    type: "multi",
    required: true,
    role: ["dimension_score", "personalization"],
    dimension: "systems",
    options: [
      { value: "organic-social", label: "Organic social media", score: 1 },
      { value: "paid-ads", label: "Paid ads (Meta, Google, TikTok)", score: 1 },
      { value: "seo", label: "SEO", score: 1 },
      { value: "email", label: "Email marketing", score: 1 },
      { value: "influencer", label: "Influencer / partnerships", score: 1 },
      { value: "referral-only", label: "Referral / word-of-mouth only", score: 0 },
      { value: "none", label: "None currently", score: 0 },
    ],
  },
  {
    id: "Q22",
    section: "Systems",
    prompt:
      "Do you track numbers tied to revenue (CAC, cost-per-lead, ROI) or mostly engagement (likes, followers)?",
    type: "scale",
    required: true,
    role: ["dimension_score"],
    dimension: "systems",
    options: [
      { value: "0", label: "Engagement only / nothing meaningful", score: 0 },
      { value: "1", label: "Mostly engagement", score: 1 },
      { value: "2", label: "Some lead metrics", score: 2 },
      { value: "3", label: "Lead + some revenue metrics", score: 3 },
      { value: "4", label: "Fully revenue-linked tracking", score: 4 },
    ],
  },
  {
    id: "Q23",
    section: "Mindset",
    prompt: "What’s the biggest thing that has stopped you from fixing this so far?",
    type: "single",
    required: true,
    role: ["objection_intelligence"],
    options: [
      { value: "budget", label: "Budget" },
      { value: "time", label: "Time" },
      { value: "dont-know", label: "Don’t know what to fix" },
      { value: "tried-failed", label: "Tried before, failed" },
      { value: "not-priority", label: "Not a priority yet" },
    ],
  },
  {
    id: "Q24",
    section: "Mindset",
    prompt: "How urgent is solving this right now?",
    type: "scale",
    required: true,
    role: ["urgency"],
    options: [
      { value: "0", label: "Not urgent", score: 0 },
      { value: "1", label: "Slightly urgent", score: 1 },
      { value: "2", label: "Moderately urgent", score: 2 },
      { value: "3", label: "High urgency", score: 3 },
      { value: "4", label: "Extremely urgent — this quarter", score: 4 },
    ],
  },
  {
    id: "Q25",
    section: "Contact",
    prompt: "Best email for your personalized report and follow-up",
    type: "email",
    required: true,
    role: ["contact"],
  },
];

export function getQuestion(id: string): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}
