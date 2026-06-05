import { db } from './firebase';
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, getDocs, writeBatch,
} from 'firebase/firestore';
import { DEFAULT_PROJECTS } from './data';

const COL = 'projects';

function sorted(docs) {
  return docs.sort((a, b) => (a._order ?? 0) - (b._order ?? 0));
}

export function subscribeProjects(callback) {
  return onSnapshot(
    collection(db, COL),
    (snap) => {
      if (snap.empty) { callback(DEFAULT_PROJECTS); return; }
      callback(sorted(snap.docs.map(d => d.data())));
    },
    () => callback(DEFAULT_PROJECTS),
  );
}

export async function fetchProjects() {
  try {
    const snap = await getDocs(collection(db, COL));
    if (snap.empty) return DEFAULT_PROJECTS;
    return sorted(snap.docs.map(d => d.data()));
  } catch {
    return DEFAULT_PROJECTS;
  }
}

export async function saveProject(project) {
  await setDoc(doc(db, COL, project.id), {
    ...project,
    _order: parseInt(project.n, 10) || 0,
  });
}

export async function saveAllProjects(projects) {
  const batch = writeBatch(db);
  projects.forEach((p, i) => {
    batch.set(doc(db, COL, p.id), { ...p, _order: i });
  });
  await batch.commit();
}

export async function removeProject(id) {
  await deleteDoc(doc(db, COL, id));
}
