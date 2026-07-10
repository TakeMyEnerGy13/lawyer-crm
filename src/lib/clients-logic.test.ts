import { describe, expect, it } from 'vitest';
import type { Client } from '../types';
import { countByStatus, filterByStatus, searchClients, toCsv } from './clients-logic';

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

describe('searchClients', () => {
  const list: Client[] = [
    { id: '1', name: 'Иванов Пётр', phone: '+7 900 123-45-67', status: 'new', createdAt: null },
    { id: '2', name: 'Сидорова Анна', phone: '', status: 'new', caseNote: 'Спор по аренде', createdAt: null },
  ];

  it('matches case note', () => {
    expect(searchClients(list, 'аренде')).toEqual([list[1]]);
  });

  it('returns same list for empty query', () => {
    expect(searchClients(list, '')).toEqual(list);
    expect(searchClients(list, '   ')).toEqual(list);
  });

  it('matches name case-insensitively', () => {
    expect(searchClients(list, 'иванов')).toEqual([list[0]]);
  });

  it('matches phone ignoring formatting', () => {
    expect(searchClients(list, '9001234567')).toEqual([list[0]]);
    expect(searchClients(list, '123-45')).toEqual([list[0]]);
  });

  it('returns empty when nothing matches', () => {
    expect(searchClients(list, 'петров')).toEqual([]);
  });
});

describe('toCsv', () => {
  it('builds semicolon CSV with BOM header and escapes quotes', () => {
    const clients: Client[] = [{
      id: '1', name: 'ООО "Ромашка"', phone: '+7 900 000-00-00',
      status: 'in_progress', caseNote: 'спор; аренда',
      createdAt: new Date(2026, 6, 10, 16, 42),
    }];
    const csv = toCsv(clients);
    expect(csv.startsWith('﻿')).toBe(true);
    const lines = csv.slice(1).split('\r\n');
    expect(lines[0]).toBe('Клиент;Телефон;Статус дела;Суть дела;Добавлен');
    expect(lines[1]).toBe('"ООО ""Ромашка""";+7 900 000-00-00;В работе;"спор; аренда";10.07.2026 16:42');
  });

  it('handles missing note and pending date', () => {
    const csv = toCsv([{ id: '1', name: 'А', phone: '', status: 'new', createdAt: null }]);
    expect(csv.slice(1).split('\r\n')[1]).toBe('А;;Новый;;');
  });
});
