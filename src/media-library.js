import { db, storage } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';

const COL = 'media';

export function subscribeMedia(callback) {
  return onSnapshot(
    collection(db, COL),
    snap => callback(snap.docs.map(d => d.data()).sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0))),
    () => callback([]),
  );
}

export async function fetchMedia() {
  try {
    const snap = await getDocs(collection(db, COL));
    return snap.docs.map(d => d.data()).sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
  } catch { return []; }
}

export async function addMediaItem(item) {
  const docRef = doc(collection(db, COL));
  const full = { ...item, id: docRef.id };
  await setDoc(docRef, full);
  return full;
}

export async function deleteMediaItem(item) {
  await deleteDoc(doc(db, COL, item.id));
  if (item.storagePath) {
    try { await deleteObject(ref(storage, item.storagePath)); } catch {}
  }
}
