import type { Metadata } from "next";
import { Cairo, Zalando_Sans } from "next/font/google";
import "./globals.css";

const display = Zalando_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["wdth"],
});

const body = Cairo({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CNM Business Growth Diagnostic | Create Nation",
  description:
    "A $9 assessment that pinpoints where your marketing-to-sales funnel is leaking — built for UAE business owners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
