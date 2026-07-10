import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Public web config — safe to commit (see README, "Security tradeoffs")
const firebaseConfig = {
  apiKey: 'AIzaSyA2z3dgasxo003vESfpzFX3d5WbDhAk11E',
  authDomain: 'testo-5739e.firebaseapp.com',
  projectId: 'testo-5739e',
  storageBucket: 'testo-5739e.firebasestorage.app',
  messagingSenderId: '221455833463',
  appId: '1:221455833463:web:30e2dcf5f1abbff943e972',
};

export const db = getFirestore(initializeApp(firebaseConfig));
