# CNM Business Growth Diagnostic — Funnel, CRM & Sales System

**Stack:** Stripe (checkout) → Quiz App → Report Generator (AI) → GoHighLevel (CRM, email, calendar)

---

## 1. Customer Journey

```
Landing Page → Stripe Checkout ($9) → Quiz (25 Q) → Bridge Page (processing)
  → Report Generated → Delivered via GHL email
  → Stage 4-6: Booking (GHL Calendar) → Pre-Call Prep → Sales Call
  → Stage 1-3: GHL Email Nurture Sequence (no call CTA)
```

## 2. Event Architecture

| Event | Trigger | Fires To |
|---|---|---|
| `lead_captured` | Landing page email/name capture (if used pre-checkout) | GHL |
| `checkout_started` | Stripe checkout session created | GHL |
| `purchase_completed` | Stripe payment success webhook | GHL (tags contact "Paid - Diagnostic") |
| `quiz_started` | First quiz question answered | GHL |
| `quiz_progressed` | Every 5 questions completed | Internal (drop-off tracking) |
| `quiz_completed` | Q25 submitted | GHL + triggers report generation |
| `report_generation_started` | Immediately after quiz_completed | Internal |
| `client_report_ready` | AI report generation succeeds | GHL (triggers delivery email) |
| `advisor_report_ready` | Same job, internal-only payload | GHL (internal note/custom field, not visible to contact-facing views) |
| `report_generation_failed` | AI job errors or times out | Alert to CNM owner + retry queue |
| `call_booked` | GHL Calendar booking confirmed | GHL |
| `call_attended` | Manually marked or Calendar no-show webhook | GHL |
| `offer_purchased` | Retainer agreement signed (manual entry) | GHL |

## 3. GHL Field Dictionary

Prefix all custom fields with `cnm_diag_` to avoid collisions with other GHL fields.

| Display Name | Internal Key | Type | Source | Example | Visible To |
|---|---|---|---|---|---|
| Stage (Adjusted) | `cnm_diag_stage` | Text | Scoring engine | "Traction" | Contact-facing + Closer |
| Stage Confidence | `cnm_diag_confidence` | Text | Scoring engine | "high" | Closer only |
| Qualification Band | `cnm_diag_band` | Text | Scoring engine | "Priority" | Closer only (internal note field) |
| Urgency Score | `cnm_diag_urgency` | Number (0-4) | Q24 | 3 | Closer only |
| Stated Objection | `cnm_diag_objection` | Text | Q23 | "Don't know what to fix" | Closer only |
| Current Agency Spend | `cnm_diag_spend` | Text | Q19 | "5K-10K AED" | Closer only |
| Marketing Team Size | `cnm_diag_team` | Text | Q20 | "Just me" | Closer only |
| Dimension Scores (JSON) | `cnm_diag_dims` | Text/JSON blob | Scoring engine | `{"audience":62,...}` | Closer only |
| Report URL (Client) | `cnm_diag_report_url` | URL | Report generator | link | Contact-facing |
| Report URL (Advisor) | `cnm_diag_advisor_url` | URL | Report generator | link | Closer only |
| CTA Type | `cnm_diag_cta` | Text | Scoring engine | "book_call" / "email_nurture" | Internal (drives workflow branch) |
| Submission ID | `cnm_diag_submission_id` | Text | Quiz app | UUID | Internal (idempotency key) |

**Rule:** Closer-only fields must not appear on any customer-facing GHL form, funnel page merge tag, or automated SMS/email to the contact. Restrict via GHL field permissions where available; otherwise enforce via workflow design (never merge these fields into contact-facing templates).

## 4. Webhook & Idempotency Notes

- Stripe webhook → sends `submission_id` (Stripe session ID) to quiz app and GHL. Never reuse.
- Quiz app → report generator: payload includes `submission_id`, contact email, schema version, timestamp.
- Report generator → GHL: **two separate updates** —
  1. Quiz answers (non-destructive, only fills empty fields)
  2. Report-ready payload (only fires once `client_report_ready` succeeds)
- If `submission_id` already has a completed report, return the existing report URL instead of regenerating — prevents duplicate/conflicting reports from double form submissions or webhook retries.

## 5. Essential Automations (GHL Workflows)

| # | Automation | Trigger | Action |
|---|---|---|---|
| 1 | Purchase confirmation | `purchase_completed` | Email: "Payment received — start your diagnostic now" + quiz link |
| 2 | Abandoned checkout | Stripe session created, no `purchase_completed` within 30 min | Email/SMS: "Complete your $9 diagnostic" |
| 3 | Incomplete quiz | `quiz_started`, no `quiz_completed` within 24h | Email: "You're almost done — finish your diagnostic" |
| 4 | Report preparation confirmation | `quiz_completed` | Immediate email: "Your report is being built — arriving within [X]" |
| 5 | Report ready | `client_report_ready` | Email with report link. Branch by `cnm_diag_cta`: if `book_call`, include booking CTA in same email |
| 6 | Booking invitation | `client_report_ready` AND `cnm_diag_cta = book_call` | Separate follow-up email/SMS if no booking within 24h |
| 7 | Booking confirmation + reminders | `call_booked` | GHL Calendar default confirmation + 24h/1h reminder |
| 8 | Pre-call personalized note | 2h before call | Internal task/notification to closer with advisor report link |
| 9 | No-show recovery | Calendar no-show | Email/SMS: rebook link, no guilt-tripping copy |
| 10 | Post-call paths | Manual tag after call: "Enrolled" / "Undecided" / "Nurture" / "Not a fit" | Branch into retainer onboarding, follow-up sequence, or long-term nurture |
| 11 | Stage 1-3 nurture | `cnm_diag_cta = email_nurture` | Enters standing CNM growth-resource nurture sequence (no call CTA ever injected) |

## 6. Closer / Advisor Workflow

**Before the call**, the closer opens the advisor report and reviews:
- Stage + confidence
- Primary bottleneck (page 4)
- Dimension scores — where they're weakest
- Stated objection (Q23) and urgency (Q24)
- Spend/team signals (Q19-21) — gives a read on budget reality before quoting AED 10-30k/mo

**On the call:**

1. **Confirm the result resonates** — "Does the [bottleneck] we identified match what you're feeling day to day?"
2. **Clarify inconsistencies** — if confidence was medium/low, ask directly rather than assuming (e.g., "You mentioned you're the one closing most sales — walk me through that").
3. **Reveal the implementation plan** — this is where the report's directional roadmap (page 10) becomes specific: what CNM would actually build, month by month.
4. **Separate DIY vs. done-for-you** — be explicit about what they could attempt alone vs. what requires CNM's execution.
5. **Recommend the retainer only if fit is genuine** — use the objection field (Q23) to address the real blocker (budget/time/skepticism) directly, not generically.

**Never:** expose the qualification band, urgency score, or spend data verbally in a way that sounds like it came from a quiz score ("our system flagged you as high-priority") — use it as internal prep only, not conversation script.

## 7. KPI Dictionary

Track each transition independently — do not rely on one blended conversion rate:

| Transition | Metric |
|---|---|
| Landing page → Checkout started | % |
| Checkout → Purchase completed | % |
| Purchase → Quiz started | % |
| Quiz started → Quiz completed | % (watch per-question drop-off, especially Q19-22 systems block) |
| Quiz completed → Report delivered | % + avg delivery time |
| Report delivered → Booking (Stage 4-6 only) | % |
| Booking → Call attended | % |
| Call attended → Retainer signed | % |
| Refund/complaint rate | % |
| Stage distribution | Count per stage 1-6 |
| Low-confidence rate | % of reports flagged medium/low confidence |

Set targets after your first 100-200 completions — don't assume industry benchmarks apply to a $9 UAE-specific diagnostic.
