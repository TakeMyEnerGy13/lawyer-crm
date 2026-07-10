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
