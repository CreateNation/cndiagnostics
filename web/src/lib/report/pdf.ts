import PDFDocument from "pdfkit";
import type { ClientReport, ScoringResult } from "../types";
import { normalizeReportPages } from "./normalize";
import { bookingUrl } from "../urls";

const DIM_LABELS: Record<string, string> = {
  audience: "Audience & Positioning",
  offer: "Offer Strength",
  funnel: "Funnel & Conversion",
  content: "Content & Demand",
  systems: "Systems & Tracking",
};

const RED = "#e44336";
const INK = "#0e0e0e";
const MUTED = "#667070";

function bullets(doc: PDFKit.PDFDocument, items: string[]) {
  for (const item of items) {
    if (!item?.trim()) continue;
    doc
      .fillColor(INK)
      .fontSize(10)
      .text(`•  ${item}`, { paragraphGap: 4, align: "left" });
  }
  doc.moveDown(0.4);
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.6);
  doc.fillColor(RED).fontSize(13).text(title.toUpperCase(), { paragraphGap: 6 });
  doc.fillColor(INK);
}

function drawLockedNinetyDay(
  doc: PDFKit.PDFDocument,
  weeks: { label: string; focus: string }[],
  assumptions: string,
  bookHref: string,
) {
  const startY = doc.y;
  const left = doc.page.margins.left;
  const width =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Faded “blurred” preview of the real content underneath
  doc.save();
  doc.fillOpacity(0.22);
  for (const week of weeks.slice(0, 3)) {
    doc.fontSize(11).fillColor(INK).text(week.label, { paragraphGap: 2 });
    doc.fontSize(10).fillColor(MUTED).text(week.focus, { paragraphGap: 6 });
  }
  if (assumptions) {
    doc.fontSize(9).fillColor(MUTED).text(assumptions);
  }
  doc.restore();

  const endY = Math.max(doc.y, startY + 120);
  const boxTop = startY - 4;
  const boxHeight = endY - startY + 8;

  // Frosted overlay
  doc
    .save()
    .fillColor("#f3f3f1")
    .fillOpacity(0.82)
    .roundedRect(left - 2, boxTop, width + 4, boxHeight, 8)
    .fill()
    .restore();

  doc
    .save()
    .strokeColor(RED)
    .lineWidth(1)
    .roundedRect(left - 2, boxTop, width + 4, boxHeight, 8)
    .stroke()
    .restore();

  const centerY = boxTop + boxHeight / 2 - 28;
  doc.fillColor(RED).fontSize(10).text("LOCKED SECTION", left, centerY, {
    width,
    align: "center",
  });
  doc
    .fillColor(INK)
    .fontSize(14)
    .text("Want the full 90-day path?", left, centerY + 16, {
      width,
      align: "center",
    });
  doc
    .fillColor(MUTED)
    .fontSize(10)
    .text(
      "Book a complimentary strategy call and we’ll unlock this section with a code during the call.",
      left + 24,
      centerY + 38,
      { width: width - 48, align: "center" },
    );

  const ctaY = centerY + 72;
  doc.fillColor(RED).fontSize(11).text("Book a complimentary call  →", left, ctaY, {
    width,
    align: "center",
    link: bookHref,
    underline: true,
  });

  doc.y = boxTop + boxHeight + 12;
}

export async function buildReportPdf(input: {
  report: ClientReport;
  scoring: ScoringResult | null;
  ninetyDayUnlocked?: boolean;
  bookingHref?: string;
}): Promise<Buffer> {
  const pages = normalizeReportPages(input.report.pages, input.scoring);
  const unlocked = Boolean(input.ninetyDayUnlocked);
  const bookHref = input.bookingHref || bookingUrl();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 54, bottom: 54, left: 54, right: 54 },
      info: {
        Title: `CNM Growth Diagnostic — ${pages.cover.businessName}`,
        Author: "Create Nation",
        Subject: "Business Growth Diagnostic Report",
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fillColor(RED).fontSize(11).text("CREATE NATION", { characterSpacing: 2 });
    doc
      .fillColor(INK)
      .fontSize(22)
      .text("Business Growth Diagnostic", { paragraphGap: 8 });
    doc.fillColor(MUTED).fontSize(11).text(pages.cover.date);
    doc.moveDown(0.8);
    doc.fillColor(INK).fontSize(28).text(pages.cover.businessName, { paragraphGap: 6 });
    doc.fillColor(RED).fontSize(14).text(`Stage: ${pages.cover.stageName}`);
    doc.moveDown(1);
    doc
      .moveTo(54, doc.y)
      .lineTo(541, doc.y)
      .strokeColor(RED)
      .lineWidth(2)
      .stroke();
    doc.moveDown(1);

    sectionTitle(doc, "Your stage & what it means");
    doc.fontSize(11).fillColor(INK).text(pages.stage.evidence, { paragraphGap: 8 });
    doc.fontSize(10).fillColor(MUTED).text(pages.stage.scopeBoundary);

    sectionTitle(doc, "Dimension scorecard");
    doc.fontSize(11).fillColor(INK).text(pages.scorecard.summary, { paragraphGap: 8 });
    for (const [key, score] of Object.entries(pages.scorecard.dimensions)) {
      doc
        .fontSize(10)
        .fillColor(INK)
        .text(`${DIM_LABELS[key] ?? key}: ${score}/100`, { paragraphGap: 2 });
    }

    sectionTitle(doc, "Primary bottleneck");
    doc.fontSize(13).fillColor(INK).text(pages.bottleneck.title, { paragraphGap: 6 });
    doc.fontSize(11).text(pages.bottleneck.explanation, { paragraphGap: 6 });
    bullets(doc, pages.bottleneck.evidence);

    sectionTitle(doc, "Strengths");
    bullets(doc, pages.strengthsRisks.strengths);
    sectionTitle(doc, "Risks");
    bullets(doc, pages.strengthsRisks.risks);

    sectionTitle(doc, "Where the leak is");
    doc.fontSize(11).fillColor(INK).text(pages.leak.diagnosis, { paragraphGap: 6 });
    bullets(doc, pages.leak.leakPoints);

    sectionTitle(doc, "What next stage looks like");
    doc.fontSize(12).fillColor(INK).text(pages.nextStage.milestone, { paragraphGap: 6 });
    doc.fontSize(11).fillColor(MUTED).text(pages.nextStage.whatItLooksLike);

    sectionTitle(doc, "Cost of staying here");
    doc.fontSize(11).fillColor(INK).text(pages.costOfStaying.narrative, { paragraphGap: 6 });
    doc.fontSize(10).fillColor(MUTED).text(pages.costOfStaying.note);

    sectionTitle(doc, "Priority matrix");
    for (const [label, items] of [
      ["Now", pages.priorityMatrix.now],
      ["Next", pages.priorityMatrix.next],
      ["Later", pages.priorityMatrix.later],
      ["Avoid", pages.priorityMatrix.avoid],
    ] as const) {
      doc.fontSize(11).fillColor(RED).text(label, { paragraphGap: 3 });
      bullets(doc, items);
    }

    sectionTitle(doc, "Directional 90-day path");
    if (unlocked) {
      for (const week of pages.ninetyDayPath.weeks) {
        doc.fontSize(11).fillColor(INK).text(week.label, { paragraphGap: 2 });
        doc.fontSize(10).fillColor(MUTED).text(week.focus, { paragraphGap: 6 });
      }
      doc.fontSize(9).fillColor(MUTED).text(pages.ninetyDayPath.assumptions);
    } else {
      drawLockedNinetyDay(
        doc,
        pages.ninetyDayPath.weeks,
        pages.ninetyDayPath.assumptions,
        bookHref,
      );
    }

    sectionTitle(doc, "7-day quick wins");
    bullets(doc, pages.quickWins);

    sectionTitle(doc, "Next step");
    doc.fontSize(13).fillColor(INK).text(pages.nextStep.headline, { paragraphGap: 6 });
    doc.fontSize(11).text(pages.nextStep.body);

    doc.moveDown(1.5);
    doc
      .fontSize(9)
      .fillColor(MUTED)
      .text(
        "Create Nation — Bridging the gap between creativity and results · create-nation.com",
      );

    doc.end();
  });
}

export function reportPdfFilename(businessName: string): string {
  const safe = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `cnm-growth-diagnostic-${safe || "report"}.pdf`;
}
