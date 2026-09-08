import { scoreAnswers } from "../src/lib/scoring";
import type { Answers } from "../src/lib/types";

/** Minimal Stage 4 Priority sample for smoke test */
const sample: Answers = {
  Q1: "real-estate",
  Q2: "5-10",
  Q3: "200k-500k",
  Q4: "2",
  Q5: "steady",
  Q6: "3",
  Q7: "2",
  Q8: "3",
  Q9: "2",
  Q10: "2",
  Q11: "1",
  Q12: "2",
  Q13: "1",
  Q14: "1",
  Q15: "10-25",
  Q16: "2",
  Q17: "2",
  Q18: "1",
  Q19: "5k-10k",
  Q20: "full-time",
  Q21: ["organic-social", "paid-ads"],
  Q22: "2",
  Q23: "dont-know",
  Q24: "3",
  Q25: "test@create-nation.com",
};

const result = scoreAnswers(sample);
console.log(JSON.stringify(result, null, 2));

if (result.adjustedStage !== 4) {
  console.error("Expected stage 4");
  process.exit(1);
}
if (result.band !== "Priority") {
  console.error("Expected Priority band");
  process.exit(1);
}
if (result.cta !== "book_call") {
  console.error("Expected book_call CTA");
  process.exit(1);
}
console.log("scoring smoke test OK");
