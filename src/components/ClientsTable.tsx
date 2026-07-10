import type { MouseEvent } from 'react';
import type { Client, ClientStatus } from '../types';
import { StatusBadge } from './StatusBadge';

const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});

export function ClientsTable({
  clients, filtered, selectedIds,
  onStatusChange, onDelete, onOpen, onToggleSelect, onToggleSelectAll,
}: {
  clients: Client[];
  filtered: Client[];
  selectedIds: Set<string>;
  onStatusChange: (id: string, next: ClientStatus) => void;
  onDelete: (client: Client) => void;
  onOpen: (client: Client) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (visible: Client[]) => void;
}) {
  if (clients.length === 0) {
    return <p className="empty">Клиентов пока нет — добавьте первого через форму выше.</p>;
  }
  if (filtered.length === 0) {
    return <p className="empty">Никого не нашлось — измените запрос или фильтр.</p>;
  }

  const allVisibleSelected = filtered.every((c) => selectedIds.has(c.id));

  // Row click opens the client card unless an interactive control was hit.
  function rowClick(e: MouseEvent, client: Client) {
    if ((e.target as HTMLElement).closest('button, select, input, a')) return;
    onOpen(client);
  }

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
          <tr
            key={c.id}
            className={`clients__row ${selectedIds.has(c.id) ? 'clients__row--selected' : ''}`}
            onClick={(e) => rowClick(e, c)}
            title="Открыть карточку клиента"
          >
            <td className="clients__check">
              <input
                type="checkbox"
                checked={selectedIds.has(c.id)}
                onChange={() => onToggleSelect(c.id)}
                aria-label={`Выбрать ${c.name}`}
              />
            </td>
            <td className="clients__name">{c.name}</td>
            <td className="clients__phone">{c.phone || '—'}</td>
            <td className="clients__note">{c.caseNote || '—'}</td>
            <td><StatusBadge status={c.status} onChange={(next) => onStatusChange(c.id, next)} /></td>
            <td className="clients__date">{c.createdAt ? dateFmt.format(c.createdAt) : '…'}</td>
            <td className="clients__actions">
              <button className="row-action" onClick={() => onOpen(c)} aria-label={`Открыть карточку ${c.name}`} title="Открыть карточку">
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
        ))}
      </tbody>
    </table>
  );
}
