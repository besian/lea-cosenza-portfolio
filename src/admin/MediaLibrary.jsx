import { useState, useEffect, useRef } from 'react';
import { subscribeMedia, deleteMediaItem } from '../media-library';
import { uploadToLibrary } from '../storage';

export function MediaLibrary({ onToast }) {
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [pct, setPct] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => subscribeMedia(setItems), []);

  const handleUpload = async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    e.target.value = '';
    setUploading(true);
    for (const file of files) {
      setPct(0);
      try {
        await uploadToLibrary(file, setPct);
      } catch (err) {
        alert('Upload failed: ' + err.message);
      }
    }
    setPct(null);
    setUploading(false);
    onToast?.('Uploaded ' + files.length + ' file' + (files.length > 1 ? 's' : ''));
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await deleteMediaItem(item);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url).catch(() => {});
    onToast?.('URL copied');
  };

  const isVideo = (url) => url && /\.(mp4|mov|webm|ogg)(\?|$)/i.test(url.split('?')[0]);

  return (
    <>
      <div className="main-head">
        <div>
          <span className="kicker">Shared · {items.length} file{items.length !== 1 ? 's' : ''}</span>
          <h1 className="main-h">Media Library<em>.</em></h1>
        </div>
        <label className={'btn primary' + (uploading ? ' is-busy' : '')} style={{ cursor: uploading ? 'wait' : 'pointer' }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleUpload}
            disabled={uploading}
          />
          {uploading ? `Uploading ${Math.round(pct ?? 0)}%` : '↑ Upload files'}
        </label>
      </div>

      {items.length === 0 ? (
        <div className="empty">No media yet — upload files above to build your library.</div>
      ) : (
        <div className="ml-grid">
          {items.map(item => (
            <div key={item.id} className="ml-item">
              <div className="ml-thumb">
                {isVideo(item.url)
                  ? <video src={item.url} className="ml-media" muted />
                  : <img src={item.url} className="ml-media" alt={item.name} />
                }
              </div>
              <div className="ml-info">
                <span className="ml-name" title={item.name}>{item.name}</span>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button className="x-btn" onClick={() => copyUrl(item.url)} title="Copy URL">⎘</button>
                  <button className="x-btn" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }} onClick={() => handleDelete(item)} title="Delete">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
