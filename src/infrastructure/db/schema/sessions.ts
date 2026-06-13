import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { id, createdAt } from "./_shared";
import { users } from "./users";

export const sessions = sqliteTable(
  "sessions",
  {
    // The opaque random token stored in the httpOnly cookie.
    id: id(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("sessions_user_idx").on(t.userId),
    index("sessions_expires_idx").on(t.expiresAt),
  ],
);
