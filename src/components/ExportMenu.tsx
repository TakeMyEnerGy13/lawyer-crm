import { useEffect, useRef, useState } from 'react';
import type { Client } from '../types';
import { filterAddedSince, sortClients, toCsv, type SortMode } from '../lib/clients-logic';

type Scope = 'selected' | 'filtered' | 'all' | 'since';

const LAST_EXPORT_KEY = 'lawyer-crm:last-csv-export';

function readLastExport(): number | null {
  const raw = localStorage.getItem(LAST_EXPORT_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

function download(clients: Client[]) {
  const blob = new Blob([toCsv(clients)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportMenu({ clients, filtered, selected }: {
  clients: Client[];   // full base
  filtered: Client[];  // current view (search + status filter)
  selected: Client[];  // checked rows
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<Scope>('filtered');
  const [sort, setSort] = useState<SortMode>('newest');
  const [lastExport, setLastExport] = useState<number | null>(readLastExport);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const sinceList = filterAddedSince(clients, lastExport);
  const scopes: { value: Scope; label: string; list: Client[]; hint?: string }[] = [
    {
      value: 'selected',
      label: 'Выбранные галочками',
      list: selected,
      hint: selected.length === 0 ? 'никто не выбран' : undefined,
    },
    { value: 'filtered', label: 'Текущая выборка', list: filtered },
    { value: 'all', label: 'Вся база', list: clients },
    {
      value: 'since',
      label: 'Новые с последнего экспорта',
      list: sinceList,
      hint: lastExport === null ? 'экспорта ещё не было' : undefined,
    },
  ];

  function handleDownload() {
    const picked = scopes.find((s) => s.value === scope)!;
    download(sortClients(picked.list, sort));
    const now = Date.now();
    localStorage.setItem(LAST_EXPORT_KEY, String(now));
    setLastExport(now);
    setOpen(false);
  }

  const pickedCount = scopes.find((s) => s.value === scope)!.list.length;

  return (
    <div className="export" ref={rootRef}>
      <button
        className="toolbar__export"
        onClick={() => {
          if (!open && selected.length > 0) setScope('selected');
          setOpen(!open);
        }}
        aria-expanded={open}
      >
        Экспорт CSV{selected.length > 0 ? ` · ${selected.length}` : ''}
      </button>
      {open && (
        <div className="export__menu" role="dialog" aria-label="Параметры экспорта">
          <fieldset className="export__group">
            <legend>Что выгрузить</legend>
            {scopes.map((s) => (
              <label key={s.value} className="export__option">
                <input
                  type="radio"
                  name="export-scope"
                  checked={scope === s.value}
                  onChange={() => setScope(s.value)}
                />
                <span>{s.label}</span>
                <span className="export__count">{s.hint ?? s.list.length}</span>
              </label>
            ))}
          </fieldset>
          <label className="export__sort">
            Сортировка
            <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
              <option value="name">По имени (А–Я)</option>
            </select>
          </label>
          <button className="export__go" onClick={handleDownload} disabled={pickedCount === 0}>
            Скачать{pickedCount > 0 ? ` (${pickedCount})` : ''}
          </button>
        </div>
      )}
    </div>
  );
}
