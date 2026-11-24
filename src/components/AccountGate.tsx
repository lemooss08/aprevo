import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { BookOpen, LockKeyhole } from 'lucide-react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, type User } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { firebaseAuth } from '../services/firebase';
import { usernameToEmail } from '../services/accountName';

const inputClass = 'w-full rounded-xl border border-slate-700 bg-[#0e1017] px-4 py-3 text-sm text-white outline-none focus:border-brand-400';

export function AccountGate({ children }: { children: (user: User | null) => ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [register, setRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!firebaseAuth) return;
    return onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setUsername('');
        setPassword('');
        setRegister(false);
        setError('');
      }
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!firebaseAuth || busy) return;
    const email = usernameToEmail(username);
    if (!email) {
      setError('Use de 3 a 32 caracteres. Comece e termine com letra ou número e evite pontos consecutivos.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (register) await createUserWithEmailAndPassword(firebaseAuth, email, password);
      else await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (cause) {
      const code = cause instanceof FirebaseError ? cause.code : '';
      if (code === 'auth/network-request-failed') setError('Confira sua conexão e tente novamente.');
      else if (code === 'auth/too-many-requests') setError('Muitas tentativas. Aguarde e tente novamente.');
      else if (code === 'auth/weak-password' || code === 'auth/password-does-not-meet-requirements') {
        setError('Escolha uma senha mais forte.');
      } else {
        setError(register ? 'Não foi possível criar a conta com esses dados.' : 'Não foi possível entrar. Confira seu usuário e senha.');
      }
    } finally {
      setBusy(false);
    }
  }

  if (!firebaseAuth) return children(null);
  if (user) return children(user);

  return (
    <main className="grid min-h-screen place-items-center bg-[#090a0f] px-4 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-[#282f42] bg-[#11131a] p-6 shadow-xl sm:p-8">
        <div className="mb-7 flex items-center gap-3 text-brand-300">
          <BookOpen aria-hidden="true" className="h-6 w-6" />
          <span className="text-lg font-black tracking-wide text-white">APREVO</span>
        </div>
        <h1 className="text-2xl font-bold text-white">{register ? 'Criar conta' : 'Entrar no Aprevo'}</h1>
        {user === undefined ? (
          <p role="status" className="mt-4 text-sm text-slate-300">Verificando sua sessão…</p>
        ) : (
          <>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="account-name" className="mb-1.5 block text-sm font-medium">Nome de usuário</label>
                <input id="account-name" className={inputClass} autoComplete="username" autoCapitalize="none"
                  spellCheck={false} value={username} onChange={(event) => setUsername(event.target.value)} required />
                {register && <p className="mt-1.5 text-xs text-slate-400">Use letras sem acento, números, ponto, hífen ou sublinhado.</p>}
              </div>
              <div>
                <label htmlFor="account-password" className="mb-1.5 block text-sm font-medium">Senha</label>
                <input id="account-password" className={inputClass} type="password" minLength={register ? 6 : undefined}
                  autoComplete={register ? 'new-password' : 'current-password'} value={password}
                  onChange={(event) => setPassword(event.target.value)} required />
                {register && <p className="mt-1.5 text-xs text-slate-400">Use pelo menos 6 caracteres. A conta sem e-mail não tem recuperação de senha.</p>}
              </div>
              {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
              <button disabled={busy} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold hover:bg-brand-500 disabled:opacity-50">
                <LockKeyhole aria-hidden="true" className="h-4 w-4" />
                {busy ? 'Aguarde…' : register ? 'Criar conta' : 'Entrar'}
              </button>
            </form>
            <button type="button" disabled={busy} onClick={() => { setRegister(!register); setPassword(''); setError(''); }}
              className="mt-5 text-sm font-medium text-brand-300 hover:underline">
              {register ? 'Já tenho conta' : 'Criar uma conta'}
            </button>
          </>
        )}
      </section>
    </main>
  );
}
