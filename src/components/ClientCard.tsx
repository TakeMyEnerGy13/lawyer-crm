import { useEffect, useState, type FormEvent } from 'react';
import type { Client, ClientStatus } from '../types';
import { STATUSES, STATUS_LABELS } from '../types';

const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

export function ClientCard({ client, onSave, onDelete, onClose }: {
  client: Client;
  onSave: (input: { name: string; phone: string; caseNote: string; status: ClientStatus }) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [caseNote, setCaseNote] = useState(client.caseNote ?? '');
  const [status, setStatus] = useState<ClientStatus>(client.status);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), phone: phone.trim(), caseNote: caseNote.trim(), status });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="modal" role="dialog" aria-modal="true" aria-label={`Карточка клиента ${client.name}`} onSubmit={handleSubmit}>
        <div className="modal__head">
          <h2>Карточка клиента</h2>
          <button type="button" className="row-action" onClick={onClose} aria-label="Закрыть" title="Закрыть (Esc)">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3.5 3.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <label className="modal__field">
          Имя
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </label>
        <label className="modal__field">
          Телефон
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className="modal__field">
          Суть дела
          <textarea
            value={caseNote}
            onChange={(e) => setCaseNote(e.target.value)}
            rows={4}
            placeholder="Например: развод, раздел имущества; иск подан 3 июля"
          />
        </label>
        <label className="modal__field">
          Статус дела
          <select value={status} onChange={(e) => setStatus(e.target.value as ClientStatus)}>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </label>
        {client.createdAt && (
          <p className="modal__meta">Добавлен {dateFmt.format(client.createdAt)}</p>
        )}
        <div className="modal__actions">
          <button type="button" className="modal__delete" onClick={onDelete}>Удалить</button>
          <button type="submit" className="modal__save" disabled={!name.trim()}>Сохранить</button>
        </div>
      </form>
    </div>
  );
}
