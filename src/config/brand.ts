/**
 * Central brand / product identity — the ONE place to change when cloning this
 * template into a new product (e.g. "Easy Queue").
 *
 * Pure constants with ZERO dependencies on purpose, so every layer
 * (domain/application/infrastructure/presentation) and both server & client can
 * import it without breaking the architecture rules or the client bundle.
 *
 * Note: long marketing prose (privacy policy, tutorial, landing copy) and the
 * static `app/*-image.alt.txt` social files are product-specific copy — a clone
 * rewrites those pages; they intentionally don't read from here.
 */
const NAME = "Easy Stamp";

export const BRAND = {
  /** Product name shown across UI, page titles, emails/OTP, TOTP issuer. */
  name: NAME,
  /** One-line tagline appended to the name in metadata / hero. */
  tagline: "ระบบบัตรสะสมแสตมป์",
  /** Meta description for SEO / social cards. */
  description:
    "บัตรสะสมแสตมป์ดิจิทัลสำหรับร้านค้าหลายสาขา ลูกค้าสะสมแต้มผ่านการสแกน QR ไม่ต้องพกบัตร ร้านจัดการง่ายในที่เดียว",
  /** Issuer label embedded in new TOTP authenticator entries. */
  totpIssuer: NAME,
  /** User-Agent for outbound geocoding requests (OSM politeness policy). */
  userAgent: "EasyStamp/1.0 (+admin lead tool)",
} as const;
