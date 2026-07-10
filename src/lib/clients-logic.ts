import type { Client, ClientStatus } from '../types';
import { STATUSES } from '../types';

export function countByStatus(clients: Client[]): Record<ClientStatus, number> {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<ClientStatus, number>;
  for (const client of clients) counts[client.status] += 1;
  return counts;
}

export function filterByStatus(clients: Client[], filter: ClientStatus | null): Client[] {
  return filter === null ? clients : clients.filter((c) => c.status === filter);
}
