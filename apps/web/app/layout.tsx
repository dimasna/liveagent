import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@modules/auth/components/auth-provider";
import { Toaster } from "sonner";
import { QueryProvider } from "@lib/query-provider";
import { ThemeProvider } from "@lib/theme-provider";
import "@liveagent/ui/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Liveagent.dev - AI Voice Booking Assistant",
  description:
    "Build AI voice agents that handle reservations and bookings via phone, integrated with Google Calendar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
        <head>
          {/* Prevent flash: apply saved theme before paint */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
            }}
          />
        </head>
        <body className={inter.className}>
          <AuthProvider>
            <ThemeProvider>
              <QueryProvider>
                {children}
                <Toaster richColors position="bottom-right" />
              </QueryProvider>
            </ThemeProvider>
          </AuthProvider>
        </body>
      </html>
  );
}
