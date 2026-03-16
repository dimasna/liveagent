"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useRef } from "react";
import { UserMenu } from "@modules/auth/components/user-menu";
import {
  PhoneIcon,
  PhoneIncomingIcon,
  PlayIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  BarChart3Icon,
  CalendarIcon,
  CalendarCheckIcon,
  PlugIcon,
  SunIcon,
  MoonIcon,
} from "lucide-react";
import { useTheme } from "@lib/theme-provider";

interface AgentSummary {
  id: string;
  name: string;
}

const WORKSPACE_ROUTES = ["/workspace", "/settings", "/files", "/onboarding", "/integrations"];

function isWorkspaceLevel(pathname: string) {
  if (pathname === "/agents") return true;
  return WORKSPACE_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
}

function getAgentIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/agents\/([^/]+)/);
  return match ? match[1] : null;
}

const workspaceNav = [
  { href: "/workspace", label: "Agents", icon: PhoneIcon },
  { href: "/integrations", label: "Connections", icon: PlugIcon },
];

function getAgentNav(agentId: string) {
  return [
    { href: `/agents/${agentId}/analytics`, label: "Analytics", icon: BarChart3Icon },
    { href: `/conversations?agentId=${agentId}`, label: "Call Activity", icon: PhoneIncomingIcon },
    { href: `/playground?agentId=${agentId}`, label: "Playground", icon: PlayIcon },
    { href: `/agents/${agentId}/calendar`, label: "Bookings", icon: CalendarCheckIcon },
    { href: `/agents/${agentId}/integrations`, label: "Google Calendar", icon: CalendarIcon },
  ];
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}

function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentIdParam = searchParams.get("agentId");
  const isWs = isWorkspaceLevel(pathname) && !agentIdParam;

  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAgents(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const idFromPath = getAgentIdFromPath(pathname) || agentIdParam;
    if (idFromPath) {
      setActiveAgentId(idFromPath);
    } else if (!isWs && agents.length > 0 && !activeAgentId) {
      setActiveAgentId(agents[0].id);
    }
  }, [pathname, agents, isWs, agentIdParam]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activeAgent = agents.find((a) => a.id === activeAgentId) || null;
  const isInsideAgent = !isWs && !!activeAgent;
  const agentNav = activeAgentId ? getAgentNav(activeAgentId) : [];
  const nav = isWs ? workspaceNav : agentNav;

  function switchAgent(agentId: string) {
    setActiveAgentId(agentId);
    setDropdownOpen(false);
    const idFromPath = getAgentIdFromPath(pathname);
    if (idFromPath) {
      const suffix = pathname.replace(`/agents/${idFromPath}`, "");
      router.push(`/agents/${agentId}${suffix}`);
    } else if (agentIdParam) {
      // Handle query-param-based routes like /conversations?agentId=xxx
      const params = new URLSearchParams(searchParams.toString());
      params.set("agentId", agentId);
      router.push(`${pathname}?${params.toString()}`);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-13 shrink-0 items-center border-b border-border/50 bg-background px-4">
        <div className="flex items-center">
          <Link href="/workspace" className="flex items-center gap-2.5">
            <svg
              width="24"
              height="24"
              viewBox="0 0 28 28"
              fill="none"
              className="shrink-0"
            >
              <rect width="28" height="28" rx="7" className="fill-foreground" />
              <rect x="6.5" y="11" width="2" height="6" rx="1" className="fill-background" opacity="0.35" />
              <rect x="10" y="8.5" width="2" height="11" rx="1" className="fill-background" opacity="0.55" />
              <rect x="13.5" y="6" width="2" height="16" rx="1" className="fill-background" />
              <rect x="17" y="9" width="2" height="10" rx="1" className="fill-background" opacity="0.55" />
              <rect x="20.5" y="11.5" width="2" height="5" rx="1" className="fill-background" opacity="0.35" />
            </svg>
            <span className="text-[13px] font-semibold tracking-tight text-foreground">
              Liveagent.dev
            </span>
          </Link>

          <span className="mx-2.5 text-[16px] text-muted-foreground/30 font-light select-none">/</span>

          <Link
            href="/workspace"
            className="rounded-md px-2 py-1 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            My Workspace
          </Link>

          {isInsideAgent && activeAgent && (
            <>
              <span className="mx-2.5 text-[16px] text-muted-foreground/30 font-light select-none">/</span>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-foreground hover:bg-accent transition-colors"
                >
                  {activeAgent.name}
                  <ChevronsUpDownIcon className="h-3 w-3 text-muted-foreground" />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1.5 min-w-52 rounded-xl border border-border bg-card p-1 shadow-2xl shadow-black/40">
                    {agents.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => switchAgent(agent.id)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] hover:bg-accent transition-colors"
                      >
                        <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate text-left">{agent.name}</span>
                        {agent.id === activeAgentId && (
                          <CheckIcon className="h-3.5 w-3.5 shrink-0 text-foreground" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-52 flex-col border-r border-border/50 bg-background">
          <nav className="flex-1 space-y-0.5 p-2.5">
            {nav.map((item) => {
              const hrefPath = item.href.split("?")[0];
              let active: boolean;
              if (hrefPath === "/workspace") {
                active = pathname === "/workspace";
              } else if (hrefPath.startsWith("/agents/")) {
                active = pathname === hrefPath;
              } else {
                active =
                  pathname === hrefPath ||
                  pathname.startsWith(hrefPath + "/");
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                    active
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <SunIcon className="h-4 w-4" />
      ) : (
        <MoonIcon className="h-4 w-4" />
      )}
    </button>
  );
}
