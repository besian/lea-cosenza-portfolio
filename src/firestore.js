import { db } from './firebase';
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, getDocs, writeBatch,
} from 'firebase/firestore';
import { DEFAULT_PROJECTS } from './data';

const COL = 'projects';

// Firestore doesn't allow nested arrays. Credits and stats are [[a,b],...].
// Serialize to [{r,n},...] on write, deserialize on read.
function toFirestore(p) {
  const out = { ...p };
  if (Array.isArray(out.credits)) {
    out.credits = out.credits.map(([r, n]) => ({ r: r ?? '', n: n ?? '' }));
  }
  if (Array.isArray(out.stats)) {
    out.stats = out.stats.map(([r, n]) => ({ r: r ?? '', n: n ?? '' }));
  }
  return out;
}

function fromFirestore(data) {
  const p = { ...data };
  if (Array.isArray(p.credits) && p.credits.length && 'r' in (p.credits[0] ?? {})) {
    p.credits = p.credits.map(({ r, n }) => [r, n]);
  }
  if (Array.isArray(p.stats) && p.stats.length && 'r' in (p.stats[0] ?? {})) {
    p.stats = p.stats.map(({ r, n }) => [r, n]);
  }
  return p;
}

function sorted(docs) {
  return docs.sort((a, b) => (a._order ?? 0) - (b._order ?? 0));
}

export function subscribeProjects(callback) {
  return onSnapshot(
    collection(db, COL),
    (snap) => {
      if (snap.empty) { callback(DEFAULT_PROJECTS); return; }
      callback(sorted(snap.docs.map(d => fromFirestore(d.data()))));
    },
    () => callback(DEFAULT_PROJECTS),
  );
}

export async function fetchProjects() {
  try {
    const snap = await getDocs(collection(db, COL));
    if (snap.empty) return DEFAULT_PROJECTS;
    return sorted(snap.docs.map(d => fromFirestore(d.data())));
  } catch {
    return DEFAULT_PROJECTS;
  }
}

export async function saveProject(project) {
  await setDoc(doc(db, COL, project.id), {
    ...toFirestore(project),
    _order: parseInt(project.n, 10) || 0,
  });
}

export async function saveAllProjects(projects) {
  const batch = writeBatch(db);
  projects.forEach((p, i) => {
    batch.set(doc(db, COL, p.id), { ...toFirestore(p), _order: i });
  });
  await batch.commit();
}

export async function removeProject(id) {
  await deleteDoc(doc(db, COL, id));
}
