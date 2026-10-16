"use client";

import { track } from "@/lib/analytics/track";

export function TrackedLink({
  href,
  className,
  children,
  event = "book_call_clicked",
  source,
  target = "_blank",
  submissionId,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  event?: string;
  source: string;
  target?: string;
  /** When set, moves the GHL opportunity to Book Call on click. */
  submissionId?: string;
}) {
  return (
    <a
      href={href}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className={className}
      onClick={() => {
        track(event, { source, submission_id: submissionId });
        if (submissionId && event === "book_call_clicked") {
          void fetch("/api/ghl/book-call", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ submissionId }),
            keepalive: true,
          }).catch(() => {
            // Non-blocking — booking navigation must not wait on GHL
          });
        }
      }}
    >
      {children}
    </a>
  );
}
