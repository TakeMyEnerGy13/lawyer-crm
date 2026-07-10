import { useState, type FormEvent } from 'react';
import type { ClientStatus } from '../types';
import { STATUSES, STATUS_LABELS } from '../types';

export function AddClientForm({ onAdd }: {
  onAdd: (input: { name: string; phone: string; status: ClientStatus; caseNote: string }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [caseNote, setCaseNote] = useState('');
  const [status, setStatus] = useState<ClientStatus>('new');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onAdd({ name: name.trim(), phone: phone.trim(), status, caseNote: caseNote.trim() });
      setName(''); setPhone(''); setCaseNote(''); setStatus('new');
    } catch {
      setError('Не удалось сохранить клиента. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя клиента *" required />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" />
      <input value={caseNote} onChange={(e) => setCaseNote(e.target.value)} placeholder="Суть дела" />
      <select value={status} onChange={(e) => setStatus(e.target.value as ClientStatus)} aria-label="Статус нового клиента">
        {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>
      <button type="submit" disabled={busy || !name.trim()}>Добавить клиента</button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}
