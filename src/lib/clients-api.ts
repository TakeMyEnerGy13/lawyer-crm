import {
  addDoc, collection, deleteDoc, doc, onSnapshot, query,
  serverTimestamp, updateDoc, where, type Timestamp,
} from 'firebase/firestore';
import type { Client, ClientStatus } from '../types';
import { db } from './firebase';

const clientsCol = collection(db, 'clients');

// No server-side orderBy: where + orderBy would need a composite index,
// sorting happens client-side (sortClients).
export function subscribeClients(
  uid: string,
  onChange: (clients: Client[]) => void,
  onError: (e: Error) => void,
): () => void {
  const q = query(clientsCol, where('ownerId', '==', uid));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name as string,
        phone: data.phone as string,
        status: data.status as ClientStatus,
        caseNote: (data.caseNote as string | undefined) || undefined,
        createdAt: (data.createdAt as Timestamp | null)?.toDate() ?? null,
      };
    }));
  }, onError);
}

export async function addClient(uid: string, input: {
  name: string; phone: string; status: ClientStatus; caseNote: string;
}): Promise<void> {
  await addDoc(clientsCol, { ...input, ownerId: uid, createdAt: serverTimestamp() });
}

export async function updateClientStatus(id: string, status: ClientStatus): Promise<void> {
  await updateDoc(doc(clientsCol, id), { status });
}

export async function updateClient(id: string, input: {
  name: string; phone: string; caseNote: string;
}): Promise<void> {
  await updateDoc(doc(clientsCol, id), input);
}

export async function deleteClient(id: string): Promise<void> {
  await deleteDoc(doc(clientsCol, id));
}
