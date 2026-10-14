"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/track";

export function ReportViewTracker({
  token,
  stageName,
}: {
  token: string;
  stageName?: string | null;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track("report_viewed", {
      report_token: token.slice(0, 8),
      stage: stageName ?? undefined,
    });
  }, [token, stageName]);

  return null;
}
