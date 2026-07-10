export function TableToolbar({ query, onQueryChange, onExport, exportDisabled }: {
  query: string;
  onQueryChange: (q: string) => void;
  onExport: () => void;
  exportDisabled: boolean;
}) {
  return (
    <div className="toolbar">
      <input
        className="toolbar__search"
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Поиск по имени или телефону"
        aria-label="Поиск клиентов"
      />
      <button className="toolbar__export" onClick={onExport} disabled={exportDisabled}>
        Скачать CSV
      </button>
    </div>
  );
}
