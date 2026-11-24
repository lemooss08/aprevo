const loginDomain = 'login.aprevo.invalid';

export function usernameToEmail(input: string): string | null {
  const username = input.trim().toLowerCase();
  return /^[a-z0-9_.-]{3,32}$/.test(username) && /^[a-z0-9].*[a-z0-9]$/.test(username)
    && !username.includes('..')
    ? `${username}@${loginDomain}`
    : null;
}

export function accountUsername(email: string | null): string {
  return email?.split('@')[0] ?? '';
}
