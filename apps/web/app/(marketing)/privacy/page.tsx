import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
              <rect width="28" height="28" rx="7" fill="white" />
              <rect x="6.5" y="11" width="2" height="6" rx="1" fill="#0a0a0a" opacity="0.35" />
              <rect x="10" y="8.5" width="2" height="11" rx="1" fill="#0a0a0a" opacity="0.55" />
              <rect x="13.5" y="6" width="2" height="16" rx="1" fill="#0a0a0a" />
              <rect x="17" y="9" width="2" height="10" rx="1" fill="#0a0a0a" opacity="0.55" />
              <rect x="20.5" y="11.5" width="2" height="5" rx="1" fill="#0a0a0a" opacity="0.35" />
            </svg>
            <span className="text-[15px] font-semibold tracking-tight">Liveagent.dev</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background hover:bg-foreground/90 transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Last updated: March 2026
          </p>

          <div className="mt-10 space-y-8 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                1. Information We Collect
              </h2>
              <p className="mb-2">
                <strong className="text-foreground">Account Information:</strong>{" "}
                When you sign up, we collect your name, email address, and
                organization details through our authentication system.
              </p>
              <p className="mb-2">
                <strong className="text-foreground">Agent Configuration:</strong>{" "}
                Voice agent settings including business name, greeting messages,
                instructions, voice preferences, and calendar integration
                details.
              </p>
              <p className="mb-2">
                <strong className="text-foreground">Call Data:</strong>{" "}
                Conversation transcripts, call metadata (duration, outcome),
                caller information provided during calls, and booking details.
              </p>
              <p>
                <strong className="text-foreground">Usage Data:</strong>{" "}
                Analytics about how you use the platform, including page views
                and feature usage.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                2. How We Use Your Information
              </h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>Provide and maintain the voice agent service</li>
                <li>Process and manage bookings via Google Calendar</li>
                <li>Generate call analytics and insights</li>
                <li>Improve the quality of AI voice interactions</li>
                <li>Send service-related communications</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                3. What We Don&apos;t Do
              </h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>Sell your data to third parties</li>
                <li>Use your business data to train AI models</li>
                <li>Share caller information outside your organization</li>
                <li>Store raw audio recordings after processing</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                4. Third-Party Services
              </h2>
              <p>We use the following third-party services:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <strong className="text-foreground">Google Cloud / Vertex AI</strong> —
                  AI voice processing via Gemini Live API
                </li>
                <li>
                  <strong className="text-foreground">Google Calendar</strong> —
                  Appointment scheduling integration
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                5. Data Retention
              </h2>
              <p>
                We retain your data for as long as your account is active. You
                can request deletion of your account and all associated data at
                any time through the Settings page or by contacting us.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                6. Your Rights
              </h2>
              <p>You have the right to:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Access the data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data in a portable format</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                7. Contact
              </h2>
              <p>
                If you have any questions about this Privacy Policy, please
                contact us at{" "}
                <span className="text-foreground">privacy@liveagent.dev</span>.
              </p>
            </section>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-[13px] text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Liveagent.dev</span>
          <nav className="flex items-center gap-4">
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
