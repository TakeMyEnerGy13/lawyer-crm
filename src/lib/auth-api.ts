import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

export type { User };

export function watchAuth(onChange: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, onChange);
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signUp(email: string, password: string): Promise<void> {
  await createUserWithEmailAndPassword(auth, email, password);
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

const ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Неверная почта или пароль.',
  'auth/invalid-email': 'Некорректный адрес почты.',
  'auth/email-already-in-use': 'Эта почта уже зарегистрирована — попробуйте войти.',
  'auth/weak-password': 'Пароль слишком короткий — нужно от 6 символов.',
  'auth/too-many-requests': 'Слишком много попыток. Подождите пару минут.',
};

export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  return ERROR_MESSAGES[code] ?? 'Не получилось. Проверьте данные и попробуйте ещё раз.';
}
