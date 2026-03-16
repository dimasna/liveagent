import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liveagent.dev Voice Widget",
  description: "Voice booking widget powered by Liveagent.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-transparent">{children}</body>
    </html>
  );
}
