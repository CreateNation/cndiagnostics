import PDFDocument from "pdfkit";
import type { ClientReport, ScoringResult } from "../types";
import { normalizeReportPages } from "./normalize";

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

export async function buildReportPdf(input: {
  report: ClientReport;
  scoring: ScoringResult | null;
  ninetyDayUnlocked?: boolean;
}): Promise<Buffer> {
  const pages = normalizeReportPages(input.report.pages, input.scoring);
  const unlocked = Boolean(input.ninetyDayUnlocked);

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

    // Cover
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
      doc
        .fontSize(11)
        .fillColor(MUTED)
        .text(
          "This section is unlocked during your complimentary strategy call. Book a call and we’ll share the access code live.",
          { paragraphGap: 6 },
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
