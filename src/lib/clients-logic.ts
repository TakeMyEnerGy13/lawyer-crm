import type { Client, ClientStatus } from '../types';
import { STATUSES, STATUS_LABELS } from '../types';

export function countByStatus(clients: Client[]): Record<ClientStatus, number> {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<ClientStatus, number>;
  for (const client of clients) counts[client.status] += 1;
  return counts;
}

export function filterByStatus(clients: Client[], filter: ClientStatus | null): Client[] {
  return filter === null ? clients : clients.filter((c) => c.status === filter);
}

const digitsOnly = (s: string) => s.replace(/\D/g, '');

export function searchClients(clients: Client[], query: string): Client[] {
  const q = query.trim().toLowerCase();
  if (!q) return clients;
  const qDigits = digitsOnly(q);
  return clients.filter((c) => {
    if (c.name.toLowerCase().includes(q)) return true;
    if (c.phone.toLowerCase().includes(q)) return true;
    if (c.caseNote?.toLowerCase().includes(q)) return true;
    return qDigits.length > 0 && digitsOnly(c.phone).includes(qDigits);
  });
}

const csvDateFmt = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

// Excel (RU locale) expects semicolons and needs a BOM to read UTF-8 Cyrillic.
export function toCsv(clients: Client[]): string {
  const escape = (v: string) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const rows = [
    ['Клиент', 'Телефон', 'Статус дела', 'Суть дела', 'Добавлен'],
    ...clients.map((c) => [
      c.name, c.phone, STATUS_LABELS[c.status], c.caseNote ?? '',
      c.createdAt ? csvDateFmt.format(c.createdAt).replace(',', '') : '',
    ]),
  ];
  return '﻿' + rows.map((r) => r.map(escape).join(';')).join('\r\n');
}
