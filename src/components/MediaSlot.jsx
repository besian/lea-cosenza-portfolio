import { useRef, useState } from 'react';
import { Placeholder } from './Placeholder';
import { uploadToLibrary } from '../storage';

const isVideoUrl = (url) => url && /\.(mp4|mov|webm|ogg)(\?|$)/i.test(url.split('?')[0]);

function VideoPlaceholder({ c1, c2 }) {
  return (
    <div className="vid-ph" style={{ '--vph-c1': c1 || '#1a1a1a', '--vph-c2': c2 || '#0a0a0a' }}>
      <div className="vid-ph-play">▶</div>
    </div>
  );
}

function VideoPlayer({ src, fit, editing }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [prog, setProg] = useState(0);
  const [dur, setDur] = useState(0);
  const [vol, setVol] = useState(1);
  const [muted, setMuted] = useState(false);
  const [hover, setHover] = useState(false);

  const toggle = (e) => {
    e?.stopPropagation();
    const v = ref.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { v.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  const onTimeUpdate = () => {
    const v = ref.current;
    if (v?.duration) setProg(v.currentTime / v.duration);
  };

  const seek = (e) => {
    e.stopPropagation();
    const v = ref.current;
    if (!v?.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    v.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * v.duration;
  };

  const onVolChange = (e) => {
    e.stopPropagation();
    const n = parseFloat(e.target.value);
    setVol(n);
    if (ref.current) ref.current.volume = n;
    if (n > 0 && muted) { ref.current.muted = false; setMuted(false); }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const v = ref.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    setMuted(next);
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  return (
    <div
      className="vid-wrap"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <video
        ref={ref}
        src={src}
        className="ms-fill"
        style={{ objectFit: fit }}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={() => setDur(ref.current?.duration || 0)}
        onEnded={() => { setPlaying(false); setProg(0); }}
        playsInline
      />
      {!editing && (
        <>
          <button
            className={'vid-big-play' + (playing ? ' is-playing' : '')}
            onClick={toggle}
          >▶</button>
          <div className={'vid-bar' + (hover || !playing ? ' is-on' : '')}>
            <button className="vid-btn" onClick={toggle}>
              {playing ? '⏸' : '▶'}
            </button>
            <div className="vid-prog" onClick={seek}>
              <div className="vid-prog-fill" style={{ width: `${prog * 100}%` }} />
            </div>
            <span className="vid-time">{fmt(dur * prog)} / {fmt(dur)}</span>
            <button className="vid-mute" onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
              {muted || vol === 0 ? '○' : '●'}
            </button>
            <input
              type="range" min="0" max="1" step="0.02"
              value={muted ? 0 : vol}
              onChange={onVolChange}
              onMouseDown={e => e.stopPropagation()}
              className="vid-vol"
            />
          </div>
        </>
      )}
    </div>
  );
}

export function MediaSlot({
  c1, c2, label, lbl2, url,
  fit = 'cover',
  editing = false,
  mediaType = 'image',
  onUpload,
  className = '', children,
}) {
  const inputRef = useRef(null);
  const [pct, setPct] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setPct(0);
    try {
      const item = await uploadToLibrary(file, setPct);
      onUpload?.(item.url);
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
          ? <VideoPlayer src={url} fit={fit} editing={editing} />
          : <img src={url} className="ms-fill" style={{ objectFit: fit }} alt={label || ''} />
        : mediaType === 'video'
          ? <VideoPlaceholder c1={c1} c2={c2} />
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
