import { useEffect, useMemo, useState } from 'react';
import { AddClientForm } from './components/AddClientForm';
import { ClientsTable } from './components/ClientsTable';
import { Counters } from './components/Counters';
import { addClient, subscribeClients, updateClientStatus } from './lib/clients-api';
import { countByStatus, filterByStatus } from './lib/clients-logic';
import type { Client, ClientStatus } from './types';

export default function App() {
  const [clients, setClients] = useState<Client[] | null>(null); // null = loading
  const [filter, setFilter] = useState<ClientStatus | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => subscribeClients(setClients, () => setLoadError(true)), []);

  const counts = useMemo(() => countByStatus(clients ?? []), [clients]);
  const filtered = useMemo(() => filterByStatus(clients ?? [], filter), [clients, filter]);

  return (
    <main className="page">
      <header className="page__header">
        <h1>Кабинет юриста</h1>
        <p className="page__subtitle">Клиенты и статусы дел — обновляется в реальном времени</p>
      </header>
      <AddClientForm onAdd={addClient} />
      <Counters counts={counts} active={filter} onToggle={(s) => setFilter(filter === s ? null : s)} />
      {loadError && <p className="empty" role="alert">Не удалось загрузить данные. Обновите страницу.</p>}
      {clients === null && !loadError && <p className="empty">Загрузка…</p>}
      {clients !== null && !loadError && (
        <ClientsTable clients={clients} filtered={filtered} onStatusChange={updateClientStatus} />
      )}
    </main>
  );
}
