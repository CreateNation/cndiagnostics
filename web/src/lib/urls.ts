export function absoluteUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function bookingUrl(): string {
  return (
    process.env.NEXT_PUBLIC_GHL_BOOKING_URL ??
    "https://create-nation.com/#contact"
  );
}
