import type { Client, ClientStatus } from '../types';
import { StatusBadge } from './StatusBadge';

const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});

export function ClientsTable({ clients, filtered, onStatusChange, onDelete }: {
  clients: Client[];
  filtered: Client[];
  onStatusChange: (id: string, next: ClientStatus) => void;
  onDelete: (client: Client) => void;
}) {
  if (clients.length === 0) {
    return <p className="empty">Клиентов пока нет — добавьте первого через форму выше.</p>;
  }
  if (filtered.length === 0) {
    return <p className="empty">Никого не нашлось — измените запрос или фильтр.</p>;
  }
  return (
    <table className="clients">
      <thead>
        <tr>
          <th>Клиент</th><th>Телефон</th><th>Суть дела</th><th>Статус дела</th><th>Добавлен</th>
          <th><span className="visually-hidden">Действия</span></th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((c) => (
          <tr key={c.id}>
            <td>{c.name}</td>
            <td>{c.phone || '—'}</td>
            <td className="clients__note">{c.caseNote || '—'}</td>
            <td><StatusBadge status={c.status} onChange={(next) => onStatusChange(c.id, next)} /></td>
            <td>{c.createdAt ? dateFmt.format(c.createdAt) : '…'}</td>
            <td>
              <button className="row-delete" onClick={() => onDelete(c)} aria-label={`Удалить клиента ${c.name}`} title="Удалить">
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
