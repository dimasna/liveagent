"use client";

import { useOrganization } from "@clerk/nextjs";

export function OrgGuard({ children }: { children: React.ReactNode }) {
  const { organization, isLoaded } = useOrganization();

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <h2 className="mb-2 text-xl font-bold">No Organization Selected</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Create or select an organization to get started.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
