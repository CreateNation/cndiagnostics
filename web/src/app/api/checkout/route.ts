import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createSubmission, appendEvent, updateSubmission } from "@/lib/store";
import {
  DIAGNOSTIC_PRICE_USD,
  getStripe,
  isDevBypassPayment,
} from "@/lib/stripe";
import { absoluteUrl } from "@/lib/urls";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      email?: string;
      name?: string;
    };

    const submission = await createSubmission({
      email: body.email ?? null,
      name: body.name ?? null,
      status: "pending_payment",
    });

    await appendEvent(submission.id, "checkout_started", {
      email: body.email ?? null,
    });

    if (isDevBypassPayment()) {
      const paid = await updateSubmission(submission.id, {
        status: "paid",
        stripeSessionId: `dev_${submission.id}`,
        clientReportToken: nanoid(24),
        advisorReportToken: nanoid(32),
      });
      await appendEvent(paid.id, "purchase_completed", { mode: "dev_bypass" });

      return NextResponse.json({
        mode: "dev_bypass",
        submissionId: paid.id,
        quizUrl: absoluteUrl(`/quiz/${paid.id}`),
      });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: DIAGNOSTIC_PRICE_USD,
            product_data: {
              name: "CNM Business Growth Diagnostic",
              description:
                "Personalized growth stage report for UAE business owners",
            },
          },
        },
      ],
      metadata: {
        submission_id: submission.id,
      },
      success_url: absoluteUrl(
        `/quiz/${submission.id}?session_id={CHECKOUT_SESSION_ID}`,
      ),
      cancel_url: absoluteUrl("/?cancelled=1"),
    });

    await updateSubmission(submission.id, {
      stripeSessionId: session.id,
    });

    return NextResponse.json({
      mode: "stripe",
      submissionId: submission.id,
      checkoutUrl: session.url,
    });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Checkout failed unexpectedly",
      },
      { status: 500 },
    );
  }
}
