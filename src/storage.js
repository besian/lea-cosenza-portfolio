import { storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export function uploadMedia(projectId, file, onProgress) {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const task = uploadBytesResumable(ref(storage, `projects/${projectId}/${name}`), file);
    task.on(
      'state_changed',
      s => onProgress?.((s.bytesTransferred / s.totalBytes) * 100),
      reject,
      () => getDownloadURL(task.snapshot.ref).then(resolve).catch(reject),
    );
  });
}
