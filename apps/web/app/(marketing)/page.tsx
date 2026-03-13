import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-foreground text-sm font-bold">
              LA
            </div>
            <span className="text-lg font-semibold">LiveAgent</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand/90"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-block rounded-full bg-brand/10 px-4 py-1.5 text-sm font-medium text-brand">
            Powered by Google Gemini Live API
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight">
            AI Voice Agents for{" "}
            <span className="text-brand">Reservations & Bookings</span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Build intelligent voice agents that answer calls, check
            availability, and book appointments — all synced with Google
            Calendar. Set up in minutes, not months.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="rounded-lg bg-brand px-6 py-3 text-sm font-medium text-brand-foreground hover:bg-brand/90"
            >
              Start Free
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-lg border border-border px-6 py-3 text-sm font-medium hover:bg-accent"
            >
              How It Works
            </Link>
          </div>
        </div>

        {/* Features */}
        <div
          id="how-it-works"
          className="mx-auto mt-24 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3"
        >
          <div className="rounded-xl border border-border p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold">Real-Time Voice</h3>
            <p className="text-sm text-muted-foreground">
              Natural bidirectional voice conversations powered by Gemini&apos;s
              native audio model. Callers can interrupt, ask questions, and get
              instant responses.
            </p>
          </div>

          <div className="rounded-xl border border-border p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold">Calendar Integration</h3>
            <p className="text-sm text-muted-foreground">
              Direct Google Calendar sync. Your agent checks real availability,
              creates bookings, reschedules, and sends confirmations
              automatically.
            </p>
          </div>

          <div className="rounded-xl border border-border p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold">Analytics Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              Track every call, booking, and conversation. See real-time
              transcripts, call outcomes, and conversion metrics.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} LiveAgent. Built on Google Cloud.
        </div>
      </footer>
    </div>
  );
}
