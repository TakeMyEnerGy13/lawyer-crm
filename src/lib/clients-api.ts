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
