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
