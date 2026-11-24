import { expect, it } from 'vitest';
import { usernameToEmail } from './accountName';

const enabled = process.env.APREVO_TEST_FIREBASE === '1';

it.skipIf(!enabled)('persists data for the authenticated owner and blocks other users', async () => {
  const auth = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:';
  async function authenticate(action: 'signUp' | 'signInWithPassword', username: string) {
    const response = await fetch(`${auth}${action}?key=fake-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usernameToEmail(username),
        password: 'TestPassword#2026',
        returnSecureToken: true,
      }),
    });
    expect(response.ok, await response.clone().text()).toBe(true);
    return await response.json() as { localId: string; idToken: string };
  }

  const name = `aluna-${Date.now()}`;
  const owner = await authenticate('signUp', name);
  const other = await authenticate('signUp', `outra-${Date.now()}`);
  const secondLogin = await authenticate('signInWithPassword', name.toUpperCase());
  expect(secondLogin.localId).toBe(owner.localId);

  const url = `http://127.0.0.1:9000/users/${owner.localId}/studyData.json?ns=demo-aprevo-default-rtdb`;
  const payload = JSON.stringify({ subjects: [], sessions: [], settings: { userName: 'Aluna' } });
  const write = (token: string, value: unknown) => fetch(`${url}&auth=${token}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
  expect((await write(owner.idToken, payload)).ok).toBe(true);
  const secondDevice = await fetch(`${url}&auth=${secondLogin.idToken}`);
  expect(await secondDevice.json()).toBe(payload);
  expect((await fetch(url)).ok).toBe(false);
  expect((await fetch(`${url}&auth=${other.idToken}`)).ok).toBe(false);
  expect((await write(other.idToken, 'tampered')).ok).toBe(false);
  expect((await write(owner.idToken, { invalid: true })).ok).toBe(false);
});
