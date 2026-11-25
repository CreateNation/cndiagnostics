export type MetaCapiDeliveryStatus =
  | "pending"
  | "processing"
  | "sent"
  | "failed";

/** Standard Meta Pixel / CAPI event names we send server-side. */
export type MetaCapiEventName =
  | "Purchase"
  | "Lead"
  | "CompleteRegistration";

export type MetaCapiPurchaseDelivery = {
  eventId: string;
  eventName: MetaCapiEventName;
  /** Stripe Checkout Session ID for Purchase; null for Lead / CompleteRegistration */
  sessionId: string | null;
  submissionId: string;
  status: MetaCapiDeliveryStatus;
  /** Unix seconds — original event time, preserved across retries */
  eventTime: number;
  /** Major currency units (0 for free Lead / CompleteRegistration) */
  value: number;
  currency: string;
  emailHash: string | null;
  phoneHash: string | null;
  clientUserAgent: string | null;
  clientEventSourceUrl: string | null;
  fbp: string | null;
  fbc: string | null;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  nextAttemptAt: number;
};

export function purchaseEventId(sessionId: string): string {
  return `purchase_${sessionId}`;
}

export function leadEventId(submissionId: string): string {
  return `lead_${submissionId}`;
}

export function completeRegistrationEventId(submissionId: string): string {
  return `complete_registration_${submissionId}`;
}
