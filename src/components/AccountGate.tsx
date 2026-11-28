import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { BookOpen, LockKeyhole, ArrowLeft, Mail } from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { ref, set } from 'firebase/database';
import { firebaseAuth, firebaseDatabase } from '../services/firebase';
import { isValidUsername, isValidEmail, usernameToEmail } from '../services/accountName';

const inputClass =
  'w-full rounded-xl border border-neutral-700 bg-[#1d1d1d] px-4 py-3 text-sm text-white outline-none focus:border-brand-400';

type FormMode = 'login' | 'register' | 'reset';

export function AccountGate({ children }: { children: (user: User | null) => ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [mode, setMode] = useState<FormMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (!firebaseAuth) return;
    return onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setUsername('');
        setEmail('');
        setPassword('');
        setMode('login');
        setError('');
        setResetSent(false);
      }
    });
  }, []);

  function switchMode(newMode: FormMode) {
    setMode(newMode);
    setPassword('');
    setError('');
    setResetSent(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!firebaseAuth || busy) return;

    // --- Password reset flow ---
    if (mode === 'reset') {
      const trimmedEmail = email.trim();
      if (!isValidEmail(trimmedEmail)) {
        setError('Informe um endereço de e-mail válido.');
        return;
      }
      setBusy(true);
      setError('');
      try {
        await sendPasswordResetEmail(firebaseAuth, trimmedEmail);
        setResetSent(true);
      } catch (cause) {
        const code = cause instanceof FirebaseError ? cause.code : '';
        if (code === 'auth/network-request-failed')
          setError('Confira sua conexão e tente novamente.');
        else if (code === 'auth/too-many-requests')
          setError('Muitas tentativas. Aguarde e tente novamente.');
        else setError('Não foi possível enviar o e-mail. Verifique o endereço informado.');
      } finally {
        setBusy(false);
      }
      return;
    }

    // --- Registration flow ---
    if (mode === 'register') {
      if (!isValidUsername(username)) {
        setError(
          'Nome de usuário inválido. Use de 3 a 32 caracteres (letras sem acento, números, ponto, hífen ou sublinhado). Comece e termine com letra ou número.',
        );
        return;
      }
      const trimmedEmail = email.trim();
      if (!isValidEmail(trimmedEmail)) {
        setError('Informe um endereço de e-mail válido.');
        return;
      }
      setBusy(true);
      setError('');
      try {
        const { user: newUser } = await createUserWithEmailAndPassword(
          firebaseAuth,
          trimmedEmail,
          password,
        );
        const trimmedUsername = username.trim().toLowerCase();
        // Store the username in the Firebase Auth profile
        await updateProfile(newUser, { displayName: trimmedUsername });
        // Persist username and email in Realtime Database
        if (firebaseDatabase) {
          await set(ref(firebaseDatabase, `users/${newUser.uid}/profile`), {
            username: trimmedUsername,
            email: trimmedEmail,
          });
        }
      } catch (cause) {
        const code = cause instanceof FirebaseError ? cause.code : '';
        if (code === 'auth/email-already-in-use')
          setError('Este e-mail já está cadastrado. Tente fazer login.');
        else if (code === 'auth/network-request-failed')
          setError('Confira sua conexão e tente novamente.');
        else if (code === 'auth/too-many-requests')
          setError('Muitas tentativas. Aguarde e tente novamente.');
        else if (
          code === 'auth/weak-password' ||
          code === 'auth/password-does-not-meet-requirements'
        ) {
          setError('Escolha uma senha mais forte.');
        } else {
          setError('Não foi possível criar a conta com esses dados.');
        }
      } finally {
        setBusy(false);
      }
      return;
    }

    // --- Login flow ---
    const loginInput = email.trim();
    if (!loginInput) {
      setError('Informe seu e-mail ou nome de usuário.');
      return;
    }

    // If the input contains '@' treat it as an email; otherwise try as a
    // legacy username (synthetic email) for backward compatibility.
    let loginEmail: string;
    if (loginInput.includes('@')) {
      loginEmail = loginInput;
    } else {
      loginEmail = usernameToEmail(loginInput) ?? loginInput;
    }

    setBusy(true);
    setError('');
    try {
      await signInWithEmailAndPassword(firebaseAuth, loginEmail, password);
    } catch (cause) {
      const code = cause instanceof FirebaseError ? cause.code : '';
      if (code === 'auth/network-request-failed')
        setError('Confira sua conexão e tente novamente.');
      else if (code === 'auth/too-many-requests')
        setError('Muitas tentativas. Aguarde e tente novamente.');
      else {
        setError('Não foi possível entrar. Confira seu e-mail (ou nome de usuário) e senha.');
      }
    } finally {
      setBusy(false);
    }
  }

  // Firebase not configured — run in local mode
  if (!firebaseAuth) return children(null);
  // Already authenticated
  if (user) return children(user);

  return (
    <main className="grid min-h-screen place-items-center bg-[#161616] px-4 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-[#414141] bg-[#222222] p-6 shadow-xl sm:p-8">
        {/* Logo */}
        <div className="mb-7 flex items-center gap-3 text-brand-300">
          <BookOpen aria-hidden="true" className="h-6 w-6" />
          <span className="text-lg font-black tracking-wide text-white">APREVO</span>
        </div>

        <h1 className="text-2xl font-bold text-white">
          {mode === 'register'
            ? 'Criar conta'
            : mode === 'reset'
              ? 'Redefinir senha'
              : 'Entrar no Aprevo'}
        </h1>

        {/* Loading auth state */}
        {user === undefined ? (
          <p role="status" className="mt-4 text-sm text-slate-300">
            Verificando sua sessão…
          </p>
        ) : mode === 'reset' ? (
          /* ---- Password reset ---- */
          <>
            {resetSent ? (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <Mail className="h-5 w-5 shrink-0 text-emerald-400" />
                  <p className="text-sm text-emerald-300">
                    E-mail enviado! Verifique sua caixa de entrada e siga as instruções para
                    redefinir sua senha.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="flex items-center gap-2 text-sm font-medium text-brand-300 hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao login
                </button>
              </div>
            ) : (
              <>
                <p className="mt-3 text-sm text-slate-400">
                  Informe o e-mail da sua conta para receber um link de redefinição de senha.
                </p>
                <form onSubmit={submit} className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium">
                      E-mail
                    </label>
                    <input
                      id="reset-email"
                      className={inputClass}
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {error && (
                    <p role="alert" className="text-sm text-rose-300">
                      {error}
                    </p>
                  )}
                  <button
                    disabled={busy}
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl button-primary px-4 py-3 text-sm font-bold disabled:opacity-50"
                  >
                    <Mail aria-hidden="true" className="h-4 w-4" />
                    {busy ? 'Enviando…' : 'Enviar link de redefinição'}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="mt-5 flex items-center gap-2 text-sm font-medium text-brand-300 hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao login
                </button>
              </>
            )}
          </>
        ) : (
          /* ---- Login / Register ---- */
          <>
            <form onSubmit={submit} className="mt-6 space-y-4">
              {/* Username — only during registration */}
              {mode === 'register' && (
                <div>
                  <label htmlFor="account-name" className="mb-1.5 block text-sm font-medium">
                    Nome de usuário
                  </label>
                  <input
                    id="account-name"
                    className={inputClass}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  <p className="mt-1.5 text-xs text-slate-400">
                    Use letras sem acento, números, ponto, hífen ou sublinhado.
                  </p>
                </div>
              )}

              {/* Email (register) or Email/username (login) */}
              <div>
                <label htmlFor="account-email" className="mb-1.5 block text-sm font-medium">
                  {mode === 'login' ? 'E-mail ou nome de usuário' : 'E-mail'}
                </label>
                <input
                  id="account-email"
                  className={inputClass}
                  type={mode === 'register' ? 'email' : 'text'}
                  autoComplete={mode === 'register' ? 'email' : 'username'}
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {mode === 'register' && (
                  <p className="mt-1.5 text-xs text-slate-400">
                    Usado para recuperação de senha.
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="account-password" className="mb-1.5 block text-sm font-medium">
                  Senha
                </label>
                <input
                  id="account-password"
                  className={inputClass}
                  type="password"
                  minLength={mode === 'register' ? 6 : undefined}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {mode === 'register' && (
                  <p className="mt-1.5 text-xs text-slate-400">Use pelo menos 6 caracteres.</p>
                )}
              </div>

              {error && (
                <p role="alert" className="text-sm text-rose-300">
                  {error}
                </p>
              )}

              <button
                disabled={busy}
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl button-primary px-4 py-3 text-sm font-bold disabled:opacity-50"
              >
                <LockKeyhole aria-hidden="true" className="h-4 w-4" />
                {busy ? 'Aguarde…' : mode === 'register' ? 'Criar conta' : 'Entrar'}
              </button>
            </form>

            {/* Forgot password link — login only */}
            {mode === 'login' && (
              <button
                type="button"
                disabled={busy}
                onClick={() => switchMode('reset')}
                className="mt-3 text-sm font-medium text-slate-400 transition-colors hover:text-brand-300 hover:underline"
              >
                Esqueci minha senha
              </button>
            )}

            {/* Toggle between login ↔ register */}
            <div className="mt-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => switchMode(mode === 'register' ? 'login' : 'register')}
                className="text-sm font-medium text-brand-300 hover:underline"
              >
                {mode === 'register' ? 'Já tenho conta' : 'Criar uma conta'}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
