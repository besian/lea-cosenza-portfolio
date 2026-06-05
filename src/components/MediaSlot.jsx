import { useRef, useState } from 'react';
import { Placeholder } from './Placeholder';
import { uploadMedia } from '../storage';

const isVideoUrl = (url) => url && /\.(mp4|mov|webm|ogg)(\?|$)/i.test(url.split('?')[0]);

export function MediaSlot({
  c1, c2, label, lbl2, url,
  fit = 'cover',
  editing = false, projectId,
  onUpload,
  className = '', children,
}) {
  const inputRef = useRef(null);
  const [pct, setPct] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    e.target.value = '';
    setPct(0);
    try {
      const downloadUrl = await uploadMedia(projectId, file, setPct);
      onUpload?.(downloadUrl);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setPct(null);
    }
  };

  return (
    <div className={'ms ' + className}>
      {url
        ? isVideoUrl(url)
          ? <video src={url} className="ms-fill" style={{ objectFit: fit }} autoPlay muted loop playsInline />
          : <img src={url} className="ms-fill" style={{ objectFit: fit }} alt={label || ''} />
        : <Placeholder c1={c1} c2={c2} label={label} lbl2={lbl2}>{children}</Placeholder>
      }
      {editing && onUpload && (
        <div
          className={'ms-up' + (pct !== null ? ' is-busy' : '')}
          onClick={() => pct === null && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
          {pct !== null ? `${Math.round(pct)}%` : url ? '↑ Replace' : '↑ Upload'}
        </div>
      )}
    </div>
  );
}
