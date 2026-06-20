// Break-glass: clear an admin's 2FA when they've lost their device AND recovery
// codes. Works even when every admin is locked out (direct DB access). On next
// login the account re-enrolls (2FA is mandatory for admins).
//
// Usage:
//   node scripts/reset-2fa.mjs <email>            # local DB
//   NODE_ENV=production node scripts/reset-2fa.mjs <email> --yes   # prod (explicit)
import { loadEnvConfig } from "@next/env";
import { createClient } from "@libsql/client";

loadEnvConfig(process.cwd());

const email = process.argv[2];
const force = process.argv.includes("--yes");
if (!email || email.startsWith("--")) {
  console.error("Usage: node scripts/reset-2fa.mjs <email> [--yes]");
  process.exit(1);
}

const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
const isRemote = !url.startsWith("file:");

if (isRemote && !force) {
  console.error(`⚠️  TURSO_DATABASE_URL ชี้ฐานข้อมูล REMOTE: ${url}`);
  console.error("    น่าจะเป็น production — ถ้าตั้งใจจริง เติม --yes ต่อท้ายคำสั่ง");
  process.exit(1);
}

const db = createClient({ url, authToken });

const reset = await db.execute({
  sql: "update users set totp_secret = null, totp_confirmed_at = null, totp_recovery_codes = null where email = ?",
  args: [email],
});
if (reset.rowsAffected === 0) {
  console.error(`ไม่พบบัญชี: ${email}`);
  process.exit(1);
}
await db.execute({
  sql: "delete from sessions where user_id in (select id from users where email = ?)",
  args: [email],
});

console.log(
  `✅ รีเซ็ต 2FA + ล้าง session ของ ${email} แล้ว (DB: ${url})\n   เข้าระบบครั้งหน้าจะถูกบังคับให้ตั้ง 2FA ใหม่`,
);
