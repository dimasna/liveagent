"use client";

import { useState, useRef, useEffect } from "react";
import { LogOutIcon } from "lucide-react";
import { useAuth } from "./auth-provider";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-foreground text-xs font-semibold hover:bg-accent/80 transition-colors"
      >
        {user.username.charAt(0).toUpperCase()}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 min-w-44 rounded-xl border border-border bg-card p-1 shadow-2xl shadow-black/40">
          <div className="px-3 py-2 text-[13px] text-muted-foreground border-b border-border mb-1">
            {user.username}
          </div>
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-foreground hover:bg-accent transition-colors"
          >
            <LogOutIcon className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
