import { auth } from "@clerk/nextjs/server";

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export async function getAuthUser() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new AuthError();
  }

  return { userId, orgId };
}

export function getErrorStatus(error: unknown): number {
  if (error instanceof AuthError) return 401;
  return 500;
}
