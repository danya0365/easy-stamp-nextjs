import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { id, createdAt } from "./_shared";
import { shops } from "./shops";
import { users } from "./users";

export const CONTACT_REQUEST_STATUSES = ["open", "resolved"] as const;

/** A shop owner's request for the platform admin to contact them back. */
export const contactRequests = sqliteTable(
  "contact_requests",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    createdBy: text()
      .notNull()
      .references(() => users.id),
    subject: text().notNull(),
    message: text().notNull(),
    // How the admin should reach back (phone / LINE id / email — free text).
    contactChannel: text().notNull(),
    status: text({ enum: CONTACT_REQUEST_STATUSES }).notNull().default("open"),
    resolvedBy: text().references(() => users.id),
    resolvedAt: text(),
    createdAt: createdAt(),
  },
  (t) => [index("contact_requests_status_created_idx").on(t.status, t.createdAt)],
);
