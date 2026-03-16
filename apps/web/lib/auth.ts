import { getSession } from "./session";

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export async function getAuthUser() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    throw new AuthError();
  }

  return { userId: session.userId, orgId: session.orgId };
}

export function getErrorStatus(error: unknown): number {
  if (error instanceof AuthError) return 401;
  return 500;
}
