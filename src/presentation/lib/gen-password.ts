/**
 * Suggest an easy-to-read password (no ambiguous characters like 0/O, 1/l).
 * Default length 12 clears the 10-char minimum in `assertValidPassword`; being
 * random keeps it out of breach corpora (`assertPasswordAcceptable`).
 */
export function genPassword(length = 12): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < length; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}
