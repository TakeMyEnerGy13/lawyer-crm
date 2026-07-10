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
