/** Minimum password length, matching the create-user forms. */
export const MIN_PASSWORD_LENGTH = 6;

/** Throw a Thai error if the password fails the policy. */
export function assertValidPassword(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`);
  }
}
