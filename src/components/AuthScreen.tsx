import { useState, type FormEvent } from 'react';
import { authErrorMessage, signIn, signInAsGuest, signUp } from '../lib/auth-api';

export function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGuest() {
    setBusy(true);
    setError(null);
    try {
      await signInAsGuest();
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signin') await signIn(email.trim(), password);
      else await signUp(email.trim(), password);
      // watchAuth in App switches the screen
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <form className="auth__card" onSubmit={handleSubmit}>
        <h1>Кабинет юриста</h1>
        <p className="auth__subtitle">
          {mode === 'signin'
            ? 'Войдите, чтобы открыть свою базу клиентов'
            : 'Создайте профиль — база клиентов будет только вашей'}
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Почта"
          autoComplete="email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль (от 6 символов)"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          minLength={6}
          required
        />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="auth__submit" disabled={busy}>
          {mode === 'signin' ? 'Войти' : 'Зарегистрироваться'}
        </button>
        <button type="button" className="auth__guest" onClick={handleGuest} disabled={busy}>
          Попробовать без регистрации
        </button>
        <button
          type="button"
          className="auth__switch"
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
        >
          {mode === 'signin' ? 'Нет профиля? Зарегистрироваться' : 'Уже есть профиль? Войти'}
        </button>
      </form>
    </main>
  );
}
