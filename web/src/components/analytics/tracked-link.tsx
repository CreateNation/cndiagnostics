"use client";

import { track } from "@/lib/analytics/track";

export function TrackedLink({
  href,
  className,
  children,
  event = "book_call_clicked",
  source,
  target = "_blank",
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  event?: string;
  source: string;
  target?: string;
}) {
  return (
    <a
      href={href}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className={className}
      onClick={() => track(event, { source })}
    >
      {children}
    </a>
  );
}
