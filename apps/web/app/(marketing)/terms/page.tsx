import Link from "next/link";

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Last updated: March 2026
          </p>

          <div className="mt-10 space-y-8 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                1. Account Registration
              </h2>
              <p>
                To use Liveagent.dev, you must create an account with a valid email
                address and secure credentials. You must be at least 16 years
                old. You are responsible for maintaining the security of your
                account and all activity under it.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                2. Acceptable Use
              </h2>
              <p>You agree not to:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Use the service for illegal or fraudulent purposes</li>
                <li>Impersonate other individuals or businesses</li>
                <li>Attempt to reverse-engineer the AI voice models</li>
                <li>Use the service for spam calls or harassment</li>
                <li>Exceed reasonable usage limits for your plan</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                3. Your Content
              </h2>
              <p>
                You retain ownership of all content you provide, including agent
                configurations, business information, and knowledge base
                documents. You grant Liveagent.dev a limited license to process this
                content solely for providing the voice agent service.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                4. AI-Generated Responses
              </h2>
              <p>
                Liveagent.dev uses AI to generate voice responses during calls.
                While we strive for accuracy, AI responses may occasionally be
                incorrect or inappropriate. You are responsible for configuring
                your agent properly and monitoring its interactions. Liveagent.dev is
                not liable for decisions made based on AI-generated responses.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                5. Service Availability
              </h2>
              <p>
                We aim to provide reliable service but do not guarantee 100%
                uptime. We may perform maintenance, updates, or experience
                outages. We will make reasonable efforts to notify you of
                planned downtime.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                6. Pricing & Payments
              </h2>
              <p>
                Liveagent.dev offers free and paid plans. Paid plans are billed
                monthly or annually. Prices may change with 30 days notice.
                Refunds are handled on a case-by-case basis.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                7. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by law, Liveagent.dev shall not be
                liable for any indirect, incidental, special, consequential, or
                punitive damages resulting from your use of the service,
                including but not limited to lost revenue, missed bookings, or
                data loss.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                8. Termination
              </h2>
              <p>
                You may terminate your account at any time through the Settings
                page. We may terminate or suspend your account if you violate
                these terms. Upon termination, your data will be deleted within
                30 days.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                9. Changes to Terms
              </h2>
              <p>
                We may update these terms from time to time. We will notify you
                of significant changes via email or in-app notification.
                Continued use of the service after changes constitutes
                acceptance.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                10. Contact
              </h2>
              <p>
                If you have any questions about these Terms, please contact us
                at{" "}
                <span className="text-foreground">legal@liveagent.dev</span>.
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
