export type MetaCapiDeliveryStatus =
  | "pending"
  | "processing"
  | "sent"
  | "failed";

export type MetaCapiPurchaseDelivery = {
  eventId: string;
  eventName: "Purchase";
  sessionId: string;
  submissionId: string;
  status: MetaCapiDeliveryStatus;
  /** Unix seconds — original payment time, preserved across retries */
  eventTime: number;
  /** Major currency units (e.g. 9.0), from Stripe amount_total */
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
