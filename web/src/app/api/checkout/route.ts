import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createSubmission, appendEvent, updateSubmission } from "@/lib/store";
import {
  DIAGNOSTIC_PRICE_USD,
  getStripe,
  getStripePriceId,
  isDevBypassPayment,
} from "@/lib/stripe";
import { syncCheckoutLeadToGhl } from "@/lib/ghl-lead";
import { absoluteUrl } from "@/lib/urls";
import type Stripe from "stripe";

function requestOrigin(req: Request): string | undefined {
  try {
    return new URL(req.url).origin;
  } catch {
    return undefined;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      email?: string;
      name?: string;
      phone?: string;
    };
    const origin = requestOrigin(req);

    const submission = await createSubmission({
      email: body.email ?? null,
      name: body.name ?? null,
      phone: body.phone?.trim() || null,
      status: "pending_payment",
    });

    await appendEvent(submission.id, "checkout_started", {
      email: body.email ?? null,
      phone: body.phone ?? null,
    });

    // Form submitted → GHL New Lead opportunity (before Stripe redirect).
    if (submission.email) {
      await syncCheckoutLeadToGhl(submission);
    }

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
        quizUrl: absoluteUrl(`/quiz/${paid.id}`, origin),
      });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 },
      );
    }

    const priceId = getStripePriceId();
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
      ? [{ quantity: 1, price: priceId }]
      : [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: DIAGNOSTIC_PRICE_USD,
              product_data: {
                name: "Create Nation Diagnostics",
                description:
                  "Personalized growth stage report for UAE business owners",
              },
            },
          },
        ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.email || undefined,
      line_items: lineItems,
      metadata: {
        submission_id: submission.id,
        phone: body.phone?.trim() || "",
      },
      success_url: absoluteUrl(
        `/quiz/${submission.id}?session_id={CHECKOUT_SESSION_ID}`,
        origin,
      ),
      cancel_url: absoluteUrl("/?cancelled=1", origin),
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
