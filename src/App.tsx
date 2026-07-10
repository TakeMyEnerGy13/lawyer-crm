import { useEffect, useMemo, useState } from 'react';
import { AddClientForm } from './components/AddClientForm';
import { AuthScreen } from './components/AuthScreen';
import { ClientsTable } from './components/ClientsTable';
import { Counters } from './components/Counters';
import { ExportMenu } from './components/ExportMenu';
import { logOut, watchAuth, type User } from './lib/auth-api';
import { addClient, deleteClient, subscribeClients, updateClientStatus } from './lib/clients-api';
import { countByStatus, filterByStatus, searchClients, sortClients } from './lib/clients-logic';
import type { Client, ClientStatus } from './types';

function Dashboard({ user }: { user: User }) {
  const [clients, setClients] = useState<Client[] | null>(null); // null = loading
  const [filter, setFilter] = useState<ClientStatus | null>(null);
  const [query, setQuery] = useState('');
  const [loadError, setLoadError] = useState(false);

  useEffect(
    () => subscribeClients(user.uid, setClients, () => setLoadError(true)),
    [user.uid],
  );

  const sorted = useMemo(() => sortClients(clients ?? [], 'newest'), [clients]);
  const counts = useMemo(() => countByStatus(sorted), [sorted]);
  const filtered = useMemo(
    () => searchClients(filterByStatus(sorted, filter), query),
    [sorted, filter, query],
  );

  function handleDelete(client: Client) {
    if (window.confirm(`Удалить клиента «${client.name}»?`)) {
      deleteClient(client.id).catch(() => window.alert('Не удалось удалить. Попробуйте ещё раз.'));
    }
  }

  return (
    <main className="page">
      <header className="page__header">
        <div>
          <h1>Кабинет юриста</h1>
          <p className="page__subtitle">Клиенты и статусы дел — обновляется в реальном времени</p>
        </div>
        <div className="account">
          <span className="account__email">{user.email}</span>
          <button className="account__logout" onClick={logOut}>Выйти</button>
        </div>
      </header>
      <AddClientForm onAdd={(input) => addClient(user.uid, input)} />
      <Counters counts={counts} active={filter} onToggle={(s) => setFilter(filter === s ? null : s)} />
      <div className="toolbar">
        <input
          className="toolbar__search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по имени, телефону или делу"
          aria-label="Поиск клиентов"
        />
        <ExportMenu clients={sorted} filtered={filtered} />
      </div>
      {loadError && <p className="empty" role="alert">Не удалось загрузить данные. Обновите страницу.</p>}
      {clients === null && !loadError && <p className="empty">Загрузка…</p>}
      {clients !== null && !loadError && (
        <ClientsTable
          clients={sorted}
          filtered={filtered}
          onStatusChange={updateClientStatus}
          onDelete={handleDelete}
        />
      )}
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = auth loading

  useEffect(() => watchAuth(setUser), []);

  if (user === undefined) return <main className="page"><p className="empty">Загрузка…</p></main>;
  if (user === null) return <AuthScreen />;
  return <Dashboard user={user} />;
}
