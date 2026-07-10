import { useState, type KeyboardEvent } from 'react';
import type { Client, ClientStatus } from '../types';
import { StatusBadge } from './StatusBadge';

const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});

function EditRow({ client, onSave, onCancel }: {
  client: Client;
  onSave: (input: { name: string; phone: string; caseNote: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [caseNote, setCaseNote] = useState(client.caseNote ?? '');
  const canSave = name.trim().length > 0;

  function save() {
    if (canSave) onSave({ name: name.trim(), phone: phone.trim(), caseNote: caseNote.trim() });
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') onCancel();
  }

  return (
    <tr className="clients__edit-row">
      <td></td>
      <td>
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={onKeyDown} aria-label="Имя клиента" autoFocus />
      </td>
      <td>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={onKeyDown} aria-label="Телефон" />
      </td>
      <td>
        <input value={caseNote} onChange={(e) => setCaseNote(e.target.value)} onKeyDown={onKeyDown} aria-label="Суть дела" />
      </td>
      <td colSpan={2} className="clients__edit-actions">
        <button className="row-action row-action--save" onClick={save} disabled={!canSave} aria-label="Сохранить" title="Сохранить (Enter)">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button className="row-action" onClick={onCancel} aria-label="Отменить" title="Отменить (Esc)">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3.5 3.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

export function ClientsTable({
  clients, filtered, selectedIds,
  onStatusChange, onDelete, onEdit, onToggleSelect, onToggleSelectAll,
}: {
  clients: Client[];
  filtered: Client[];
  selectedIds: Set<string>;
  onStatusChange: (id: string, next: ClientStatus) => void;
  onDelete: (client: Client) => void;
  onEdit: (id: string, input: { name: string; phone: string; caseNote: string }) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (visible: Client[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (clients.length === 0) {
    return <p className="empty">Клиентов пока нет — добавьте первого через форму выше.</p>;
  }
  if (filtered.length === 0) {
    return <p className="empty">Никого не нашлось — измените запрос или фильтр.</p>;
  }

  const allVisibleSelected = filtered.every((c) => selectedIds.has(c.id));

  return (
    <table className="clients">
      <thead>
        <tr>
          <th className="clients__check">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={() => onToggleSelectAll(filtered)}
              aria-label="Выбрать всех видимых"
            />
          </th>
          <th>Клиент</th><th>Телефон</th><th>Суть дела</th><th>Статус дела</th><th>Добавлен</th>
          <th><span className="visually-hidden">Действия</span></th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((c) => (
          editingId === c.id ? (
            <EditRow
              key={c.id}
              client={c}
              onSave={(input) => { onEdit(c.id, input); setEditingId(null); }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <tr key={c.id} className={selectedIds.has(c.id) ? 'clients__row--selected' : ''}>
              <td className="clients__check">
                <input
                  type="checkbox"
                  checked={selectedIds.has(c.id)}
                  onChange={() => onToggleSelect(c.id)}
                  aria-label={`Выбрать ${c.name}`}
                />
              </td>
              <td>
                <button className="clients__name" onClick={() => setEditingId(c.id)} title="Изменить данные клиента">
                  {c.name}
                </button>
              </td>
              <td>{c.phone || '—'}</td>
              <td className="clients__note">{c.caseNote || '—'}</td>
              <td><StatusBadge status={c.status} onChange={(next) => onStatusChange(c.id, next)} /></td>
              <td>{c.createdAt ? dateFmt.format(c.createdAt) : '…'}</td>
              <td className="clients__actions">
                <button className="row-action" onClick={() => setEditingId(c.id)} aria-label={`Изменить клиента ${c.name}`} title="Изменить">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M9.8 2.2l2 2L5 11l-2.6.6L3 9l6.8-6.8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                  </svg>
                </button>
                <button className="row-action row-action--danger" onClick={() => onDelete(c)} aria-label={`Удалить клиента ${c.name}`} title="Удалить">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M3.5 3.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </td>
            </tr>
          )
        ))}
      </tbody>
    </table>
  );
}
