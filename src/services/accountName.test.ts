import { describe, expect, it } from 'vitest';
import { accountUsername, usernameToEmail, isValidUsername, isValidEmail } from './accountName';

describe('account username', () => {
  it('normalizes case and surrounding whitespace for login and registration', () => {
    const login = usernameToEmail('  Aluna_01  ');
    expect(login).toBe(usernameToEmail('aluna_01'));
    expect(accountUsername(login)).toBe('aluna_01');
  });

  it.each(['ab', 'a'.repeat(33), 'joão', 'user@host.com', 'a..b', '.abc', 'abc-'])(
    'rejects invalid username %s',
    (username) => expect(usernameToEmail(username)).toBeNull()
  );
});

describe('isValidUsername', () => {
  it('accepts valid usernames', () => {
    expect(isValidUsername('aluna_01')).toBe(true);
    expect(isValidUsername('arthur.legal')).toBe(true);
    expect(isValidUsername('abc')).toBe(true);
    expect(isValidUsername('a1b')).toBe(true);
  });

  it('rejects invalid usernames', () => {
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('a'.repeat(33))).toBe(false);
    expect(isValidUsername('joão')).toBe(false);
    expect(isValidUsername('a..b')).toBe(false);
    expect(isValidUsername('.abc')).toBe(false);
    expect(isValidUsername('abc-')).toBe(false);
  });

  it('normalizes whitespace and case', () => {
    expect(isValidUsername('  Aluna_01  ')).toBe(true);
  });
});

describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('a.b@c.d')).toBe(true);
    expect(isValidEmail(' test@host.co ')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(isValidEmail('noatsign')).toBe(false);
    expect(isValidEmail('@missing.local')).toBe(false);
    expect(isValidEmail('missing@')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});
