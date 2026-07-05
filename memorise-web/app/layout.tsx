import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MemoRise",
  description: "Spaced-repetition learning for any subject.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
