"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/track";
import {
  DIAGNOSTIC_CURRENCY,
  DIAGNOSTIC_PURCHASE_VALUE,
} from "@/lib/analytics/config";

/**
 * Fires `purchase` once after Stripe payment is server-verified.
 * `transaction_id` is the Stripe Checkout Session ID (stable for dedupe).
 */
export function PurchaseTracker({
  sessionId,
  submissionId,
  paid,
}: {
  sessionId?: string | null;
  submissionId: string;
  /** True only after confirmCheckoutSession / paid status */
  paid: boolean;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (!sessionId || !paid || fired.current) return;
    const key = `cnm_purchase_${sessionId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // continue
    }
    fired.current = true;
    track("purchase", {
      transaction_id: sessionId,
      submission_id: submissionId,
      value: DIAGNOSTIC_PURCHASE_VALUE,
      currency: DIAGNOSTIC_CURRENCY,
    });
  }, [sessionId, submissionId, paid]);

  return null;
}
