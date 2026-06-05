import { storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { addMediaItem } from './media-library';

export function uploadToLibrary(file, onProgress) {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const storagePath = `media/${name}`;
    const task = uploadBytesResumable(ref(storage, storagePath), file);
    task.on(
      'state_changed',
      s => onProgress?.((s.bytesTransferred / s.totalBytes) * 100),
      reject,
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          const item = await addMediaItem({
            url,
            storagePath,
            name: file.name,
            type: file.type,
            size: file.size,
            uploadedAt: Date.now(),
          });
          resolve(item);
        } catch (err) {
          reject(err);
        }
      },
    );
  });
}
