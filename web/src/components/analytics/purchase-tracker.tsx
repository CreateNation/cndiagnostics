"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/track";
import {
  DIAGNOSTIC_CURRENCY,
  DIAGNOSTIC_PURCHASE_VALUE,
} from "@/lib/analytics/config";

/** Fires once when user lands on quiz after Stripe checkout (`session_id` present). */
export function PurchaseTracker({
  sessionId,
  submissionId,
}: {
  sessionId?: string | null;
  submissionId: string;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (!sessionId || fired.current) return;
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
  }, [sessionId, submissionId]);

  return null;
}
