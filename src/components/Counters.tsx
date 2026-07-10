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
          className={`counter ${active === s ? 'counter--active' : ''}`}
          onClick={() => onToggle(s)}
          aria-pressed={active === s}
        >
          <span className="counter__value">{counts[s]}</span>
          <span className="counter__label">{STATUS_LABELS[s]}</span>
        </button>
      ))}
    </div>
  );
}
