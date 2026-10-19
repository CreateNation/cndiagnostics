/**
 * Turn long report prose into short, scannable lines for the client UI.
 * Existing stored reports stay readable without regenerating.
 */

const MAX_LEAD_CHARS = 110;
const MAX_BULLET_CHARS = 95;
const MAX_BULLETS = 4;

/** Split on sentence boundaries (keeps abbreviations mostly intact). */
export function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const parts = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [cleaned];
  return parts.map((s) => s.trim()).filter(Boolean);
}

function shorten(line: string, max: number): string {
  const t = line.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const at = Math.max(cut.lastIndexOf(" "), cut.lastIndexOf(","));
  return `${(at > 40 ? cut.slice(0, at) : cut).trim()}…`;
}

export type ScanBlock = {
  lead: string;
  bullets: string[];
};

/** One short lead + up to a few bullet lines. Drops dense paragraphs. */
export function toScanBlock(text: string): ScanBlock {
  const sentences = splitSentences(text);
  if (!sentences.length) return { lead: "", bullets: [] };

  const lead = shorten(sentences[0].replace(/[.!?]+$/, ""), MAX_LEAD_CHARS);
  const bullets = sentences
    .slice(1)
    .map((s) => shorten(s.replace(/[.!?]+$/, ""), MAX_BULLET_CHARS))
    .filter((s) => s.length > 12)
    .slice(0, MAX_BULLETS);

  return { lead, bullets };
}

/** Prefer list items as-is, but cap length for scan. */
export function shortenList(items: string[], max = 4): string[] {
  return items
    .map((item) => shorten(item.replace(/[.!?]+$/, ""), MAX_BULLET_CHARS))
    .filter(Boolean)
    .slice(0, max);
}
