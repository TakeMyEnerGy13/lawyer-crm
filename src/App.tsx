import { useEffect, useMemo, useState } from 'react';
import { AddClientForm } from './components/AddClientForm';
import { AuthScreen } from './components/AuthScreen';
import { ClientCard } from './components/ClientCard';
import { ClientsTable } from './components/ClientsTable';
import { Counters } from './components/Counters';
import { ExportMenu } from './components/ExportMenu';
import { logOut, watchAuth, type User } from './lib/auth-api';
import { addClient, deleteClient, subscribeClients, updateClient, updateClientStatus } from './lib/clients-api';
import { countByStatus, filterByStatus, searchClients, sortClients } from './lib/clients-logic';
import { notifyNewClient } from './lib/notify';
import type { Client, ClientStatus } from './types';

function Dashboard({ user }: { user: User }) {
  const [clients, setClients] = useState<Client[] | null>(null); // null = loading
  const [filter, setFilter] = useState<ClientStatus | null>(null);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
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

  const selected = useMemo(() => sorted.filter((c) => selectedIds.has(c.id)), [sorted, selectedIds]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(visible: Client[]) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = visible.every((c) => next.has(c.id));
      for (const c of visible) {
        if (allSelected) next.delete(c.id);
        else next.add(c.id);
      }
      return next;
    });
  }

  // Live client for the open card: realtime updates keep flowing into the modal.
  const openClient = useMemo(
    () => (openId === null ? null : sorted.find((c) => c.id === openId) ?? null),
    [sorted, openId],
  );

  function handleSaveCard(input: { name: string; phone: string; caseNote: string; status: ClientStatus }) {
    if (openId === null) return;
    updateClient(openId, input).catch(() => window.alert('Не удалось сохранить изменения. Попробуйте ещё раз.'));
    setOpenId(null);
  }

  function handleDelete(client: Client) {
    if (window.confirm(`Удалить клиента «${client.name}»?`)) {
      deleteClient(client.id).catch(() => window.alert('Не удалось удалить. Попробуйте ещё раз.'));
      setOpenId((prev) => (prev === client.id ? null : prev));
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
      <AddClientForm
        onAdd={async (input) => {
          await addClient(user.uid, input);
          notifyNewClient(input);
        }}
      />
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
        <ExportMenu clients={sorted} filtered={filtered} selected={selected} />
      </div>
      {loadError && <p className="empty" role="alert">Не удалось загрузить данные. Обновите страницу.</p>}
      {clients === null && !loadError && <p className="empty">Загрузка…</p>}
      {clients !== null && !loadError && (
        <ClientsTable
          clients={sorted}
          filtered={filtered}
          selectedIds={selectedIds}
          onStatusChange={updateClientStatus}
          onDelete={handleDelete}
          onOpen={(c) => setOpenId(c.id)}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />
      )}
      {openClient && (
        <ClientCard
          client={openClient}
          onSave={handleSaveCard}
          onDelete={() => handleDelete(openClient)}
          onClose={() => setOpenId(null)}
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
