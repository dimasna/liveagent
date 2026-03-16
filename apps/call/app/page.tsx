import Link from "next/link";

export default function CallLanding() {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0a]">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo waveform */}
        <div className="w-24 h-24 rounded-full bg-white/[0.04] flex items-center justify-center mb-6">
          <div className="flex items-center gap-[4px]">
            {[
              { height: 14, opacity: 0.35 },
              { height: 24, opacity: 0.55 },
              { height: 36, opacity: 1.0 },
              { height: 22, opacity: 0.55 },
              { height: 12, opacity: 0.35 },
            ].map((bar, i) => (
              <div
                key={i}
                className="call-wave-bar rounded-full"
                style={{
                  width: 5,
                  height: bar.height,
                  backgroundColor: "#ffffff",
                  opacity: bar.opacity * 0.6,
                }}
              />
            ))}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
          Liveagent.dev
        </h1>
        <p className="text-gray-400 text-sm text-center max-w-[280px] mb-8 leading-relaxed">
          AI voice agents for reservations and bookings. Talk to any business instantly.
        </p>

        {/* CTA */}
        <Link
          href="https://liveagent.dev"
          className="inline-flex items-center rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-black hover:bg-white/90 transition-all active:scale-95"
        >
          Create Your Agent
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-2"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>

      {/* Footer */}
      <div className="shrink-0 pb-6 text-center">
        <a
          href="https://liveagent.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
        >
          Powered by{" "}
          <span className="font-medium text-gray-500">liveagent.dev</span>
        </a>
      </div>
    </div>
  );
}
