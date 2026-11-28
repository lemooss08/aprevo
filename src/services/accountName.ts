const loginDomain = 'login.aprevo.invalid';

/** Convert a username to the legacy synthetic email used by older accounts. */
export function usernameToEmail(input: string): string | null {
  const username = input.trim().toLowerCase();
  return /^[a-z0-9_.-]{3,32}$/.test(username) && /^[a-z0-9].*[a-z0-9]$/.test(username)
    && !username.includes('..')
    ? `${username}@${loginDomain}`
    : null;
}

/** Extract the display portion from a Firebase Auth email. */
export function accountUsername(email: string | null): string {
  return email?.split('@')[0] ?? '';
}

/** Validate a username for new registrations. */
export function isValidUsername(input: string): boolean {
  const username = input.trim().toLowerCase();
  return /^[a-z0-9_.-]{3,32}$/.test(username)
    && /^[a-z0-9].*[a-z0-9]$/.test(username)
    && !username.includes('..');
}

/** Basic client-side email format check. */
export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}
