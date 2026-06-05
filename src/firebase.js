import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDuUo9YvVYUiP3_U8vZHU8_A11TvJ1PIQc",
  authDomain: "lea-portf.firebaseapp.com",
  projectId: "lea-portf",
  storageBucket: "lea-portf.firebasestorage.app",
  messagingSenderId: "1000952472615",
  appId: "1:1000952472615:web:b4b30030b6843f4ffc1a02",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
