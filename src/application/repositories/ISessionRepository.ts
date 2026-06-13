import type { Session, User } from "@/src/domain/entities";

export interface CreateSessionInput {
  userId: string;
  expiresAt: string;
}

export interface ISessionRepository {
  create(input: CreateSessionInput): Promise<Session>;
  /** Returns the session + its (active) user when the token is valid and unexpired. */
  findValid(token: string, now: Date): Promise<{ session: Session; user: User } | null>;
  delete(token: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}
