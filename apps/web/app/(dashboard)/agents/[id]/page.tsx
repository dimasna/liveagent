"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    // Default to Analytics when navigating to an agent
    router.replace(`/agents/${id}/analytics`);
  }, [id, router]);

  return null;
}
