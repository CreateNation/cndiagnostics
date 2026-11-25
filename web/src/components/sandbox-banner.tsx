import { isSandboxMode, isGhlDisabled, isTrackingDisabled } from "@/lib/runtime-flags";

/** Visible only when local sandbox flags are on — never on production unless misconfigured. */
export function SandboxBanner() {
  if (!isSandboxMode()) return null;

  const parts: string[] = [];
  if (isTrackingDisabled()) parts.push("tracking off");
  if (isGhlDisabled()) parts.push("GHL off");
  parts.push("free lead flow");

  return (
    <div className="bg-amber-500 px-3 py-1.5 text-center text-[11px] font-medium tracking-wide text-black">
      Sandbox · {parts.join(" · ") || "isolated"} · metrics not affected
    </div>
  );
}
