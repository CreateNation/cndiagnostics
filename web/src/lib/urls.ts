export function absoluteUrl(path: string): string {
  const base =
    (
      process.env.APP_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000"
    ).replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function bookingUrl(): string {
  return (
    process.env.GHL_BOOKING_URL ??
    process.env.NEXT_PUBLIC_GHL_BOOKING_URL ??
    "https://create-nation.com/#contact"
  );
}
