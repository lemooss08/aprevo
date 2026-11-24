import { describe, expect, it } from 'vitest';
import { accountUsername, usernameToEmail } from './accountName';

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
