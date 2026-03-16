import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Call | Liveagent.dev",
  description: "Voice call powered by Liveagent.dev",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white antialiased">{children}</body>
    </html>
  );
}
