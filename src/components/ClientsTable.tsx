import type { Client, ClientStatus } from '../types';
import { StatusBadge } from './StatusBadge';

const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});

export function ClientsTable({ clients, filtered, onStatusChange }: {
  clients: Client[];
  filtered: Client[];
  onStatusChange: (id: string, next: ClientStatus) => void;
}) {
  if (clients.length === 0) {
    return <p className="empty">Клиентов пока нет — добавьте первого через форму выше.</p>;
  }
  if (filtered.length === 0) {
    return <p className="empty">В этом статусе клиентов нет.</p>;
  }
  return (
    <table className="clients">
      <thead>
        <tr><th>Клиент</th><th>Телефон</th><th>Статус дела</th><th>Добавлен</th></tr>
      </thead>
      <tbody>
        {filtered.map((c) => (
          <tr key={c.id}>
            <td>{c.name}</td>
            <td>{c.phone || '—'}</td>
            <td><StatusBadge status={c.status} onChange={(next) => onStatusChange(c.id, next)} /></td>
            <td>{c.createdAt ? dateFmt.format(c.createdAt) : '…'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
