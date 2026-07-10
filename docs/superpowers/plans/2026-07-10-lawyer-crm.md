# Lawyer CRM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SPA-дашборд мини-CRM юриста (таблица клиентов, добавление, смена статуса, живые счётчики) на Firestore, задеплоенный на GitHub Pages, с Telegram-уведомлением через личный n8n.

**Architecture:** Один React-экран поверх Firestore-коллекции `clients` с realtime-подпиской `onSnapshot`; вся производная логика (счётчики, фильтр) — чистые функции с unit-тестами. Уведомление — fire-and-forget fetch на n8n webhook, не блокирует UX.

**Tech Stack:** Vite + React 19 + TypeScript, firebase ^12 (Firestore web SDK), vitest, GitHub Pages via GitHub Actions.

## Global Constraints

- Репо: `C:\Users\Тёма\lawyer-crm`, ветка `main`. `firebase@^12.16.0` уже в package.json — не менять версию.
- Статусы строго: `'new' | 'in_progress' | 'closed'`, русские лейблы «Новый» / «В работе» / «Закрыт».
- UI-тексты на русском. Технические идентификаторы, комментарии — English.
- Vite `base: '/lawyer-crm/'` (имя GitHub-репо).
- Firebase config и n8n webhook URL коммитятся в код открыто (осознанный компромисс, описывается в README).
- Не пушить в GitHub без явного запроса пользователя, локальные коммиты — обязательны после каждой задачи.
- Внешние данные от пользователя: `firebaseConfig` (Task 3), n8n webhook URL (Task 5). Если их ещё нет — задача блокируется, спросить пользователя, не выдумывать значения.

---

### Task 1: Scaffold Vite + React + TS + vitest

**Files:**
- Modify: `package.json` (дополнить существующий, firebase не трогать)
- Create: `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `.gitignore`

**Interfaces:**
- Produces: рабочие команды `npm run dev`, `npm run build`, `npm test`; точка входа `src/App.tsx` (default export `App`).

- [ ] **Step 1: Дополнить package.json**

```json
{
  "name": "lawyer-crm",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "firebase": "^12.16.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^4.4.0",
    "typescript": "~5.8.0",
    "vite": "^7.0.0",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 2: Установить зависимости**

Run: `npm install`
Expected: успешная установка без ошибок peer-deps.

- [ ] **Step 3: Конфиги и каркас**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/lawyer-crm/',
});
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["vitest/globals"]
  },
  "include": ["src"]
}
```

`index.html`:
```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Кабинет юриста — клиенты</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx` (временный, заменяется в Task 4):
```tsx
export default function App() {
  return <h1>Кабинет юриста</h1>;
}
```

`src/index.css` — пока пустой файл (наполняется в Task 4).

`.gitignore`:
```
node_modules
dist
```

- [ ] **Step 4: Проверить dev и build**

Run: `npm run build`
Expected: `tsc` и `vite build` завершаются без ошибок, появляется `dist/`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: scaffold vite react ts app"
```

---

### Task 2: Типы и чистая логика (TDD)

**Files:**
- Create: `src/types.ts`, `src/lib/clients-logic.ts`
- Test: `src/lib/clients-logic.test.ts`

**Interfaces:**
- Produces:
  - `type ClientStatus = 'new' | 'in_progress' | 'closed'`
  - `interface Client { id: string; name: string; phone: string; status: ClientStatus; createdAt: Date | null }`
  - `STATUSES: ClientStatus[]` (порядок: new, in_progress, closed)
  - `STATUS_LABELS: Record<ClientStatus, string>`
  - `countByStatus(clients: Client[]): Record<ClientStatus, number>`
  - `filterByStatus(clients: Client[], filter: ClientStatus | null): Client[]`

- [ ] **Step 1: Написать типы**

`src/types.ts`:
```ts
export type ClientStatus = 'new' | 'in_progress' | 'closed';

export interface Client {
  id: string;
  name: string;
  phone: string;
  status: ClientStatus;
  createdAt: Date | null; // null while serverTimestamp is pending
}

export const STATUSES: ClientStatus[] = ['new', 'in_progress', 'closed'];

export const STATUS_LABELS: Record<ClientStatus, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  closed: 'Закрыт',
};
```

- [ ] **Step 2: Написать падающие тесты**

`src/lib/clients-logic.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { Client } from '../types';
import { countByStatus, filterByStatus } from './clients-logic';

const c = (id: string, status: Client['status']): Client => ({
  id, name: `n${id}`, phone: '', status, createdAt: null,
});

describe('countByStatus', () => {
  it('counts every status, zero for missing', () => {
    expect(countByStatus([c('1', 'new'), c('2', 'new'), c('3', 'closed')]))
      .toEqual({ new: 2, in_progress: 0, closed: 1 });
  });

  it('returns all zeros for empty list', () => {
    expect(countByStatus([])).toEqual({ new: 0, in_progress: 0, closed: 0 });
  });
});

describe('filterByStatus', () => {
  const list = [c('1', 'new'), c('2', 'in_progress')];

  it('returns same list when filter is null', () => {
    expect(filterByStatus(list, null)).toEqual(list);
  });

  it('keeps only matching status', () => {
    expect(filterByStatus(list, 'new')).toEqual([list[0]]);
  });
});
```

- [ ] **Step 3: Убедиться, что тесты падают**

Run: `npm test`
Expected: FAIL — `clients-logic` not found.

- [ ] **Step 4: Реализация**

`src/lib/clients-logic.ts`:
```ts
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
```

- [ ] **Step 5: Тесты зелёные**

Run: `npm test`
Expected: 4 passed.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: client types and pure counters/filter logic"
```

---

### Task 3: Firestore-слой

**Files:**
- Create: `src/lib/firebase.ts`, `src/lib/clients-api.ts`

**Interfaces:**
- Consumes: `Client`, `ClientStatus` из `src/types.ts`; `firebaseConfig` — от пользователя (блокер, если не получен).
- Produces:
  - `subscribeClients(onChange: (clients: Client[]) => void, onError: (e: Error) => void): () => void`
  - `addClient(input: { name: string; phone: string; status: ClientStatus }): Promise<void>`
  - `updateClientStatus(id: string, status: ClientStatus): Promise<void>`

- [ ] **Step 1: Инициализация Firebase**

`src/lib/firebase.ts` (значения — реальный config от пользователя; Firebase web config публичен by design):
```ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Public web config — safe to commit (see README, "Security tradeoffs")
const firebaseConfig = {
  /* PASTE_USER_CONFIG_HERE — apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId */
};

export const db = getFirestore(initializeApp(firebaseConfig));
```

- [ ] **Step 2: API-обёртка**

`src/lib/clients-api.ts`:
```ts
import {
  addDoc, collection, doc, onSnapshot, orderBy, query,
  serverTimestamp, updateDoc, type Timestamp,
} from 'firebase/firestore';
import type { Client, ClientStatus } from '../types';
import { db } from './firebase';

const clientsCol = collection(db, 'clients');

export function subscribeClients(
  onChange: (clients: Client[]) => void,
  onError: (e: Error) => void,
): () => void {
  const q = query(clientsCol, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name as string,
        phone: data.phone as string,
        status: data.status as ClientStatus,
        createdAt: (data.createdAt as Timestamp | null)?.toDate() ?? null,
      };
    }));
  }, onError);
}

export async function addClient(input: { name: string; phone: string; status: ClientStatus }): Promise<void> {
  await addDoc(clientsCol, { ...input, createdAt: serverTimestamp() });
}

export async function updateClientStatus(id: string, status: ClientStatus): Promise<void> {
  await updateDoc(doc(clientsCol, id), { status });
}
```

- [ ] **Step 3: Проверка типов**

Run: `npm run build`
Expected: без ошибок TypeScript.

- [ ] **Step 4: Смоук с живой базой** (выполняется вместе с Task 4 в браузере; если config ещё не получен — остановиться и запросить у пользователя)

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: firestore layer (subscribe/add/update)"
```

---

### Task 4: UI дашборда

Перед вёрсткой применить скилл `design-engineering` (направление: аккуратный рабочий дашборд, без арт-дирекции; UI на русском).

**Files:**
- Modify: `src/App.tsx`, `src/index.css`
- Create: `src/components/StatusBadge.tsx`, `src/components/Counters.tsx`, `src/components/ClientsTable.tsx`, `src/components/AddClientForm.tsx`

**Interfaces:**
- Consumes: всё из Task 2 и Task 3, `notifyNewClient` появится в Task 5 (здесь ещё НЕ подключать).
- Produces: компоненты с пропсами, перечисленными в коде ниже.

- [ ] **Step 1: StatusBadge — бейдж со сменой статуса**

`src/components/StatusBadge.tsx`:
```tsx
import type { ClientStatus } from '../types';
import { STATUSES, STATUS_LABELS } from '../types';

export function StatusBadge({ status, onChange }: {
  status: ClientStatus;
  onChange: (next: ClientStatus) => void;
}) {
  return (
    <select
      className={`badge badge--${status}`}
      value={status}
      onChange={(e) => onChange(e.target.value as ClientStatus)}
      aria-label="Статус дела"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
      ))}
    </select>
  );
}
```

- [ ] **Step 2: Counters — карточки-счётчики с фильтром**

`src/components/Counters.tsx`:
```tsx
import type { ClientStatus } from '../types';
import { STATUSES, STATUS_LABELS } from '../types';

export function Counters({ counts, active, onToggle }: {
  counts: Record<ClientStatus, number>;
  active: ClientStatus | null;
  onToggle: (s: ClientStatus) => void;
}) {
  return (
    <div className="counters">
      {STATUSES.map((s) => (
        <button
          key={s}
          className={`counter counter--${s} ${active === s ? 'counter--active' : ''}`}
          onClick={() => onToggle(s)}
        >
          <span className="counter__value">{counts[s]}</span>
          <span className="counter__label">{STATUS_LABELS[s]}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: ClientsTable**

`src/components/ClientsTable.tsx`:
```tsx
import type { Client, ClientStatus } from '../types';
import { StatusBadge } from './StatusBadge';

const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function ClientsTable({ clients, filtered, onStatusChange }: {
  clients: Client[];          // full list (to distinguish empty base vs empty filter)
  filtered: Client[];         // list after filter
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
```

- [ ] **Step 4: AddClientForm**

`src/components/AddClientForm.tsx`:
```tsx
import { useState, type FormEvent } from 'react';
import type { ClientStatus } from '../types';
import { STATUSES, STATUS_LABELS } from '../types';

export function AddClientForm({ onAdd }: {
  onAdd: (input: { name: string; phone: string; status: ClientStatus }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<ClientStatus>('new');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onAdd({ name: name.trim(), phone: phone.trim(), status });
      setName(''); setPhone(''); setStatus('new');
    } catch {
      setError('Не удалось сохранить клиента. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя клиента *" required />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" />
      <select value={status} onChange={(e) => setStatus(e.target.value as ClientStatus)}>
        {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>
      <button type="submit" disabled={busy || !name.trim()}>Добавить клиента</button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}
```

- [ ] **Step 5: App — сборка экрана**

`src/App.tsx`:
```tsx
import { useEffect, useMemo, useState } from 'react';
import { AddClientForm } from './components/AddClientForm';
import { ClientsTable } from './components/ClientsTable';
import { Counters } from './components/Counters';
import { addClient, subscribeClients, updateClientStatus } from './lib/clients-api';
import { countByStatus, filterByStatus } from './lib/clients-logic';
import type { ClientStatus } from './types';
import type { Client } from './types';

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
```

- [ ] **Step 6: Стили** — `src/index.css` пишется по скиллу design-engineering на этапе исполнения: нейтральный светлый дашборд, системный/inter-подобный шрифт, статусные цвета (new — синий, in_progress — янтарный, closed — зелёный/серый), карточки-счётчики, таблица со строками hover, форма в одну строку на десктопе. Обязательные классы: `.page`, `.counters`, `.counter--active`, `.badge--new/--in_progress/--closed`, `.clients`, `.add-form`, `.empty`, `.form-error`.

- [ ] **Step 7: Смоук в браузере**

Run: `npm run dev`, открыть `http://localhost:5173/lawyer-crm/` (скилл gstack).
Expected: добавление клиента появляется в таблице без перезагрузки; смена статуса меняет бейдж и счётчики; клик по счётчику фильтрует; консоль без ошибок.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: dashboard UI (counters, table, add form, realtime)"
```

---

### Task 5: Telegram-уведомление через личный n8n

**Files:**
- Create: `src/lib/notify.ts`
- Modify: `src/App.tsx` (обернуть onAdd)

**Interfaces:**
- Consumes: n8n webhook URL — от пользователя (блокер, если не получен); workflow настраивается на личном n8n пользователя: Webhook (POST, Respond Immediately) → Telegram sendMessage `🆕 Новый клиент: {{name}}, {{phone}}`.
- Produces: `notifyNewClient(input: { name: string; phone: string }): void` — fire-and-forget, никогда не бросает.

- [ ] **Step 1: notify.ts**

`src/lib/notify.ts`:
```ts
// Personal n8n webhook → Telegram. Fire-and-forget: a dead webhook must not break the UX.
const WEBHOOK_URL = 'PASTE_N8N_WEBHOOK_URL_HERE';

export function notifyNewClient(input: { name: string; phone: string }): void {
  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).catch((e) => console.warn('notify failed', e));
}
```

- [ ] **Step 2: Подключить в App**

В `src/App.tsx` заменить `<AddClientForm onAdd={addClient} />` на:
```tsx
<AddClientForm
  onAdd={async (input) => {
    await addClient(input);
    notifyNewClient(input);
  }}
/>
```
и добавить импорт `import { notifyNewClient } from './lib/notify';`.

- [ ] **Step 3: Настроить workflow на личном n8n пользователя** (вместе с пользователем: webhook URL, Telegram credentials с его токеном, его chat_id). Проверить: добавление клиента в локальном dev → сообщение в TG пришло.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: telegram notification via n8n webhook on client add"
```

---

### Task 6: Деплой на GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: готовый build из предыдущих задач. Требуется: пользователь подтверждает создание GitHub-репо `lawyer-crm` и push (память: не пушить без явного запроса — здесь пуш входит в согласованный план, но спросить перед первым push).

- [ ] **Step 1: Workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Создать репо и запушить**

```bash
gh repo create lawyer-crm --public --source . --push
```
Затем в настройках репо включить Pages: Source = GitHub Actions (через `gh api` или вручную).

- [ ] **Step 3: Дождаться Actions и проверить живую ссылку**

Run: `gh run watch` → открыть `https://<user>.github.io/lawyer-crm/` (gstack-смоук: рендер, добавление клиента, консоль).
Expected: полный сценарий ТЗ работает на живой ссылке.

- [ ] **Step 4: Commit** (workflow уже в push)

---

### Task 7: README и лог сдачи

**Files:**
- Create: `README.md`

- [ ] **Step 1: README** — структура (содержимое пишется по факту, с реальными ссылками и временем):
  - Что это + живая ссылка + скриншот.
  - Стек и почему (React+Firebase из списка ТЗ; GitHub Pages; личный n8n для TG).
  - Как работает уведомление (схема: фронт → n8n webhook → Telegram).
  - Security tradeoffs: открытые Firestore rules, публичный firebase config, webhook URL в бандле — почему это ок для тестового.
  - Краткий лог: что делал сам / что делал AI, время начала и окончания (из данных пользователя).

- [ ] **Step 2: Commit**

```bash
git add README.md && git commit -m "docs: README with submission log"
```

---

### Task 8: Расширение сверх ТЗ (по запросу пользователя)

Фичи: поиск по имени/телефону, удаление клиента с confirm, поле «суть дела» (`caseNote`), экспорт CSV.
Логика (searchClients, toCsv) — TDD в `clients-logic`; `deleteClient` в API; UI: поле поиска и кнопка CSV в тулбаре над таблицей, колонка «Суть дела», кнопка удаления в строке (inline SVG). CSV с BOM и `;` для Excel. Смоук через gstack, затем деплой.
