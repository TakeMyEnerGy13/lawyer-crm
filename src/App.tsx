import { useEffect, useMemo, useState } from 'react';
import { AddClientForm } from './components/AddClientForm';
import { ClientsTable } from './components/ClientsTable';
import { Counters } from './components/Counters';
import { TableToolbar } from './components/TableToolbar';
import { addClient, deleteClient, subscribeClients, updateClientStatus } from './lib/clients-api';
import { countByStatus, filterByStatus, searchClients, toCsv } from './lib/clients-logic';
import type { Client, ClientStatus } from './types';

function downloadCsv(clients: Client[]) {
  const blob = new Blob([toCsv(clients)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [clients, setClients] = useState<Client[] | null>(null); // null = loading
  const [filter, setFilter] = useState<ClientStatus | null>(null);
  const [query, setQuery] = useState('');
  const [loadError, setLoadError] = useState(false);

  useEffect(() => subscribeClients(setClients, () => setLoadError(true)), []);

  const counts = useMemo(() => countByStatus(clients ?? []), [clients]);
  const filtered = useMemo(
    () => searchClients(filterByStatus(clients ?? [], filter), query),
    [clients, filter, query],
  );

  function handleDelete(client: Client) {
    if (window.confirm(`Удалить клиента «${client.name}»?`)) {
      deleteClient(client.id).catch(() => window.alert('Не удалось удалить. Попробуйте ещё раз.'));
    }
  }

  return (
    <main className="page">
      <header className="page__header">
        <h1>Кабинет юриста</h1>
        <p className="page__subtitle">Клиенты и статусы дел — обновляется в реальном времени</p>
      </header>
      <AddClientForm onAdd={addClient} />
      <Counters counts={counts} active={filter} onToggle={(s) => setFilter(filter === s ? null : s)} />
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        onExport={() => downloadCsv(filtered)}
        exportDisabled={filtered.length === 0}
      />
      {loadError && <p className="empty" role="alert">Не удалось загрузить данные. Обновите страницу.</p>}
      {clients === null && !loadError && <p className="empty">Загрузка…</p>}
      {clients !== null && !loadError && (
        <ClientsTable
          clients={clients}
          filtered={filtered}
          onStatusChange={updateClientStatus}
          onDelete={handleDelete}
        />
      )}
    </main>
  );
}
