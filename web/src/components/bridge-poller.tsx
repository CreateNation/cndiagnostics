"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function BridgePoller({
  ready,
  failed,
  submissionId,
  email,
  emailAlreadySent,
}: {
  ready: boolean;
  failed: boolean;
  submissionId: string;
  email: string | null;
  emailAlreadySent: boolean;
}) {
  const router = useRouter();
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "sending" | "sent" | "failed"
  >(emailAlreadySent ? "sent" : "idle");
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (ready || failed) return;
    const id = setInterval(() => router.refresh(), 2500);
    return () => clearInterval(id);
  }, [ready, failed, router]);

  useEffect(() => {
    if (!ready || !email || emailAlreadySent || emailStatus !== "idle") return;

    let cancelled = false;
    setEmailStatus("sending");

    void (async () => {
      try {
        const res = await fetch(`/api/quiz/${submissionId}/email`, {
          method: "POST",
        });
        const data = (await res.json()) as {
          sent?: boolean;
          alreadySent?: boolean;
          error?: string;
        };
        if (cancelled) return;
        if (res.ok && (data.sent || data.alreadySent)) {
          setEmailStatus("sent");
          router.refresh();
          return;
        }
        setEmailStatus("failed");
        setEmailError(data.error || "Could not send report email");
      } catch {
        if (cancelled) return;
        setEmailStatus("failed");
        setEmailError("Could not send report email");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, email, emailAlreadySent, emailStatus, submissionId, router]);

  if (!ready || !email) return null;

  return (
    <div className="mt-6 max-w-xl animate-fade-up-late text-sm leading-relaxed text-white/60">
      {emailStatus === "sending" && (
        <p>Sending a copy of your report to <span className="text-white">{email}</span>…</p>
      )}
      {emailStatus === "sent" && (
        <p>
          A copy of your report has been sent to{" "}
          <span className="text-white">{email}</span>.
        </p>
      )}
      {emailStatus === "failed" && (
        <p className="text-[var(--cn-red)]">
          We couldn&apos;t email the report yet
          {emailError ? `: ${emailError}` : ""}. You can still open it below.
        </p>
      )}
    </div>
  );
}
