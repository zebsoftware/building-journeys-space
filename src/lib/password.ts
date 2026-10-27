/** Password rules for The Founder signup and password reset. */
export const PASSWORD_RULES = [
  { label: "At least 12 characters", test: (password: string) => password.length >= 12 },
  { label: "An uppercase letter", test: (password: string) => /[A-Z]/.test(password) },
  { label: "A lowercase letter", test: (password: string) => /[a-z]/.test(password) },
  { label: "A number", test: (password: string) => /[0-9]/.test(password) },
  { label: "A special character", test: (password: string) => /[^A-Za-z0-9]/.test(password) },
];

export function isStrongPassword(password: string): boolean {
  return PASSWORD_RULES.every(({ test }) => test(password));
}
