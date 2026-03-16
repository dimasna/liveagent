import Link from "next/link";
import {
  PhoneIcon,
  UsersIcon,
  ZapIcon,
  ShieldCheckIcon,
} from "lucide-react";

const values = [
  {
    icon: ZapIcon,
    title: "AI-First",
    description:
      "We leverage the latest in AI voice technology to create agents that sound natural and handle complex conversations.",
  },
  {
    icon: UsersIcon,
    title: "Customer-Centric",
    description:
      "Every feature is designed to help businesses serve their customers better, faster, and around the clock.",
  },
  {
    icon: PhoneIcon,
    title: "Simple by Default",
    description:
      "Set up a professional voice agent in minutes, not months. No coding required, no complex IVR trees.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Privacy-First",
    description:
      "Your data stays yours. We process calls securely and never use your business data to train our models.",
  },
];

export default function AboutPage() {
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
              href="/about"
              className="text-[13px] font-medium text-foreground"
            >
              About
            </Link>
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
        {/* Hero */}
        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none" className="mx-auto mb-6">
            <rect width="28" height="28" rx="7" fill="white" />
            <rect x="6.5" y="11" width="2" height="6" rx="1" fill="#0a0a0a" opacity="0.35" />
            <rect x="10" y="8.5" width="2" height="11" rx="1" fill="#0a0a0a" opacity="0.55" />
            <rect x="13.5" y="6" width="2" height="16" rx="1" fill="#0a0a0a" />
            <rect x="17" y="9" width="2" height="10" rx="1" fill="#0a0a0a" opacity="0.55" />
            <rect x="20.5" y="11.5" width="2" height="5" rx="1" fill="#0a0a0a" opacity="0.35" />
          </svg>
          <h1 className="text-4xl font-bold tracking-tight">
            About Liveagent.dev
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            We&apos;re building AI voice agents that help businesses handle
            reservations and bookings automatically, so they never miss a call
            or lose a customer.
          </p>
        </section>

        {/* Mission */}
        <section className="border-t border-border/50">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <h2 className="text-2xl font-bold">Our Mission</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Small businesses lose thousands of dollars every year from missed
              calls and unreturned voicemails. A restaurant during rush hour, a
              salon with back-to-back appointments, a clinic with a packed
              schedule — they all share the same problem: they can&apos;t always
              answer the phone.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Liveagent.dev solves this with AI voice agents that answer every call,
              check real-time availability on Google Calendar, and book
              appointments on the spot. No hold music, no voicemail, no missed
              opportunities.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="border-t border-border/50">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="mb-8 text-center text-2xl font-bold">
              What We Believe
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <v.icon className="mb-3 h-5 w-5 text-foreground" />
                  <h3 className="mb-2 text-[15px] font-semibold">{v.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    {v.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/50">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <h2 className="text-2xl font-bold">Ready to get started?</h2>
            <p className="mt-2 text-muted-foreground">
              Create your first voice agent in under 5 minutes.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-foreground/90 transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="/"
                className="rounded-lg border border-border px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>
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
