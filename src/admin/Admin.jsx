import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { fetchProjects, saveProject, saveAllProjects, removeProject } from '../firestore';
import { uploadMedia } from '../storage';
import { DEFAULT_PROJECTS, DISCIPLINES, SECTION_TEMPLATES, SECTION_TYPES } from '../data';
import { Login } from './Login';
import './admin.css';

const clone = (v) => JSON.parse(JSON.stringify(v));
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function timeAgo(t) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return s + 's ago';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  return new Date(t).toLocaleTimeString();
}

// ─── Root ─────────────────────────────────────────────────────────────────
export default function Admin() {
  const [authUser, setAuthUser] = useState(undefined); // undefined=loading
  const [projects, setProjects] = useState([]);
  const [originals, setOriginals] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const fileRef = useRef(null);

  // Auth listener
  useEffect(() => onAuthStateChanged(auth, setAuthUser), []);

  // Load from Firestore on login
  useEffect(() => {
    if (!authUser) return;
    setLoading(true);
    fetchProjects().then((ps) => {
      const data = ps.length ? ps : DEFAULT_PROJECTS;
      setProjects(clone(data));
      setOriginals(clone(data));
      setSelectedId(data[0]?.id ?? null);
      setLoading(false);
    });
  }, [authUser?.uid]);

  const isDirty = useCallback((id) => {
    const cur = projects.find(p => p.id === id);
    const og = originals.find(p => p.id === id);
    if (cur && !og) return true; // new project
    return !!(cur && og && !eq(cur, og));
  }, [projects, originals]);

  const anyDirty = useMemo(() => projects.some(p => isDirty(p.id)), [projects, isDirty]);
  const selected = projects.find(p => p.id === selectedId) ?? null;

  const updateProject = useCallback((patch) => {
    setProjects(prev => prev.map(p => p.id === selectedId ? { ...p, ...patch } : p));
  }, [selectedId]);

  const save = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const dirty = projects.filter(p => isDirty(p.id));
      await Promise.all(dirty.map(p => saveProject(p)));
      setOriginals(clone(projects));
      setSavedAt(Date.now());
      showToast('Saved ✓');
    } catch (err) {
      showToast('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [projects, isDirty, saving]);

  const revertSelected = () => {
    if (!confirm('Discard changes to this project?')) return;
    const og = originals.find(p => p.id === selectedId);
    if (og) setProjects(prev => prev.map(p => p.id === selectedId ? clone(og) : p));
  };

  const addProject = useCallback(() => {
    const id = 'new-' + Date.now().toString(36);
    const indexed = projects.filter(p => !p.featured);
    const n = String(indexed.length + 1).padStart(2, '0');
    const blank = {
      id, n,
      title: 'Untitled project',
      year: String(new Date().getFullYear()),
      client: 'Client',
      disc: 'mv',
      discLabel: 'Music Video',
      runtime: '0:00',
      ratio: '16:9',
      brief: '',
      role: 'Editor',
      credits: [['Director', ''], ['Editor', 'Lea Cosenza']],
      quote: { text: '', source: '' },
      palette: Array.from({ length: 6 }, (_, i) => ({
        c1: '#1a1a1a', c2: '#0a0a0a', label: `FRAME ${String(i + 1).padStart(2, '0')}`,
      })),
      scrubs: Array.from({ length: 5 }, () => ({ c1: '#1a1a1a', c2: '#0a0a0a' })),
    };
    setProjects(prev => [...prev, blank]);
    setSelectedId(id);
    showToast('New project — remember to Save');
  }, [projects]);

  const deleteProject = useCallback(async () => {
    if (!selected) return;
    if (!confirm(`Delete "${selected.title}"? This cannot be undone.`)) return;
    try {
      await removeProject(selectedId);
    } catch { /* doc might not be in Firestore yet if unsaved */ }
    const remaining = projects.filter(p => p.id !== selectedId);
    setProjects(remaining);
    setOriginals(prev => prev.filter(p => p.id !== selectedId));
    setSelectedId(remaining[0]?.id ?? null);
    showToast('Project deleted');
  }, [selected, selectedId, projects]);

  const resetAll = useCallback(async () => {
    if (!confirm('Reset all projects to defaults? All edits and uploads will be lost.')) return;
    try {
      await saveAllProjects(DEFAULT_PROJECTS);
      setProjects(clone(DEFAULT_PROJECTS));
      setOriginals(clone(DEFAULT_PROJECTS));
      setSelectedId(DEFAULT_PROJECTS[0]?.id ?? null);
      showToast('Reset to defaults');
    } catch (err) {
      showToast('Reset failed: ' + err.message);
    }
  }, []);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'lea-cosenza-projects.json'; a.click();
    URL.revokeObjectURL(url);
    showToast('Exported JSON');
  };

  const importJson = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(r.result);
        if (!Array.isArray(parsed)) throw new Error('Expected an array');
        setProjects(parsed);
        setOriginals(clone(parsed));
        showToast('Imported — remember to Save');
      } catch (err) {
        alert("Couldn't parse that file: " + err.message);
      }
    };
    r.readAsText(file);
    e.target.value = '';
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  // ⌘S / Ctrl-S
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (anyDirty) save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [anyDirty, save]);

  // ─── Auth / loading gates ──────────────────────────────────────────────
  if (authUser === undefined) {
    return <div className="login-wrap"><div className="empty">Loading…</div></div>;
  }
  if (!authUser) return <Login />;
  if (loading) {
    return <div className="login-wrap"><div className="empty">Fetching projects…</div></div>;
  }

  return (
    <div className="app">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="topbar">
          <span className="mark"><span className="dot" />LC / Admin</span>
          <a href="/" target="_blank" rel="noopener">View site ↗</a>
        </div>

        <div className="side-list">
          {projects.map(p => (
            <div
              key={p.id}
              className={'side-item' + (p.id === selectedId ? ' is-on' : '') + (isDirty(p.id) ? ' is-dirty' : '')}
              onClick={() => setSelectedId(p.id)}
            >
              <span className="si-num">{p.n}</span>
              <span className="si-title">{p.title}{p.featured ? ' ★' : ''}</span>
              <span className="si-disc">{p.discLabel}</span>
            </div>
          ))}
          <div className="side-add" onClick={addProject}>
            <span>+ New project</span>
          </div>
        </div>

        <div className="side-foot">
          <button onClick={exportJson}>↓ Export JSON</button>
          <button onClick={() => fileRef.current?.click()}>↑ Import JSON</button>
          <input ref={fileRef} type="file" accept="application/json" onChange={importJson} style={{ display: 'none' }} />
          <button onClick={resetAll}>↺ Reset all to defaults</button>
          <button onClick={() => signOut(auth)}>⏻ Sign out</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main">
        {!selected ? (
          <div className="empty">Select a project on the left to edit it.</div>
        ) : (
          <ProjectForm
            key={selected.id}
            project={selected}
            onChange={updateProject}
          />
        )}

        <div className="savebar">
          <span className={'status' + (anyDirty ? ' dirty' : savedAt ? ' saved' : '')}>
            <span className="ind" />
            {saving ? 'Saving…' : anyDirty ? 'Unsaved changes' : savedAt ? 'Saved · ' + timeAgo(savedAt) : 'All in sync'}
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            {selected && (
              <button className="btn danger" onClick={deleteProject} disabled={saving}>Delete</button>
            )}
            <button className="btn" onClick={revertSelected} disabled={!isDirty(selectedId) || saving}>
              Revert
            </button>
            <button className="btn primary" onClick={save} disabled={!anyDirty || saving}>
              Save ⌘S
            </button>
          </div>
        </div>
      </main>

      <div className={'toast' + (toast ? ' is-on' : '')}>{toast}</div>
    </div>
  );
}

// ─── Upload button ─────────────────────────────────────────────────────────
function UploadBtn({ projectId, onUpload }) {
  const ref = useRef(null);
  const [pct, setPct] = useState(null);

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setPct(0);
    try {
      const url = await uploadMedia(projectId, file, setPct);
      onUpload(url);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setPct(null);
    }
  };

  return (
    <div
      className={'up-btn' + (pct !== null ? ' is-busy' : '')}
      onClick={() => pct === null && ref.current?.click()}
      title="Upload image or video"
    >
      <input ref={ref} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handle} />
      {pct !== null ? `${Math.round(pct)}%` : '↑'}
    </div>
  );
}

// ─── Project form ─────────────────────────────────────────────────────────
function ProjectForm({ project, onChange }) {
  const p = project;

  const patchPalette = (i, key, val) => {
    const next = clone(p.palette);
    next[i] = { ...next[i], [key]: val };
    onChange({ palette: next });
  };

  const patchCredit = (i, idx, val) => {
    const next = clone(p.credits);
    next[i] = [...next[i]];
    next[i][idx] = val;
    onChange({ credits: next });
  };
  const addCredit = () => onChange({ credits: [...p.credits, ['', '']] });
  const removeCredit = (i) => onChange({ credits: p.credits.filter((_, j) => j !== i) });

  const sections = p.sections || [];

  const patchSection = (si, key, val) => {
    const next = clone(sections);
    next[si] = { ...next[si], [key]: val };
    onChange({ sections: next });
  };
  const addSection = (kind) => {
    const tpl = clone(SECTION_TEMPLATES[kind]);
    onChange({ sections: [...sections, tpl] });
  };
  const removeSection = (si) => {
    if (!confirm('Remove this section?')) return;
    const next = clone(sections);
    next.splice(si, 1);
    onChange({ sections: next });
  };
  const moveSection = (si, dir) => {
    const next = clone(sections);
    const j = si + dir;
    if (j < 0 || j >= next.length) return;
    [next[si], next[j]] = [next[j], next[si]];
    onChange({ sections: next });
  };
  const patchSectionItem = (si, ii, key, val) => {
    const next = clone(sections);
    next[si].items[ii] = { ...next[si].items[ii], [key]: val };
    onChange({ sections: next });
  };
  const addSectionItem = (si) => {
    const next = clone(sections);
    const tpl = SECTION_TEMPLATES[next[si].kind] || SECTION_TEMPLATES.identity;
    next[si].items.push(clone(tpl.items[0]));
    onChange({ sections: next });
  };
  const removeSectionItem = (si, ii) => {
    const next = clone(sections);
    next[si].items.splice(ii, 1);
    onChange({ sections: next });
  };

  return (
    <>
      <div className="main-head">
        <div>
          <span className="kicker">N° {p.n} · {p.discLabel} · {p.year}{p.featured ? ' · ★ Featured' : ''}</span>
          <h1 className="main-h">{p.title || 'Untitled'}<em>.</em></h1>
        </div>
      </div>

      {/* ── Basic ── */}
      <div className="card">
        <div className="card-head">
          <h2 className="card-h">Basic</h2>
          <span className="card-hint">Title bar of the case study</span>
        </div>
        <div className="grid-2">
          <Field label="Title">
            <input type="text" value={p.title} onChange={e => onChange({ title: e.target.value })} />
          </Field>
          <Field label="Discipline label">
            <input type="text" value={p.discLabel} onChange={e => onChange({ discLabel: e.target.value })} />
          </Field>
        </div>
        <div style={{ height: 12 }} />
        <div className="grid-3">
          <Field label="N°" mono>
            <input type="text" value={p.n} onChange={e => onChange({ n: e.target.value })} />
          </Field>
          <Field label="Year" mono>
            <input type="text" value={p.year} onChange={e => onChange({ year: e.target.value })} />
          </Field>
          <Field label="Discipline">
            <select value={p.disc} onChange={e => onChange({ disc: e.target.value })}>
              {DISCIPLINES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ height: 12 }} />
        <div className="grid-3">
          <Field label="Client">
            <input type="text" value={p.client} onChange={e => onChange({ client: e.target.value })} />
          </Field>
          <Field label="Runtime" mono>
            <input type="text" value={p.runtime} onChange={e => onChange({ runtime: e.target.value })} />
          </Field>
          <Field label="Aspect ratio" mono>
            <input type="text" value={p.ratio} onChange={e => onChange({ ratio: e.target.value })} />
          </Field>
        </div>
      </div>

      {/* ── Brief & role ── */}
      <div className="card">
        <div className="card-head">
          <h2 className="card-h">Brief</h2>
          <span className="card-hint">Shown in the case study body</span>
        </div>
        <Field label="Role">
          <input type="text" value={p.role} onChange={e => onChange({ role: e.target.value })} />
        </Field>
        <div style={{ height: 12 }} />
        <Field label="Brief">
          <textarea value={p.brief} onChange={e => onChange({ brief: e.target.value })} rows={5} />
        </Field>
      </div>

      {/* ── Quote ── */}
      <div className="card">
        <div className="card-head">
          <h2 className="card-h">Pull quote</h2>
          <span className="card-hint">Shown in italic serif</span>
        </div>
        <Field label="Quote">
          <textarea value={p.quote?.text ?? ''} onChange={e => onChange({ quote: { ...p.quote, text: e.target.value } })} rows={3} />
        </Field>
        <div style={{ height: 12 }} />
        <Field label="Source">
          <input type="text" value={p.quote?.source ?? ''} onChange={e => onChange({ quote: { ...p.quote, source: e.target.value } })} />
        </Field>
      </div>

      {/* ── Credits ── */}
      <div className="card">
        <div className="card-head">
          <h2 className="card-h">Credits</h2>
          <span className="card-hint">{p.credits.length} rows</span>
        </div>
        {p.credits.map((c, i) => (
          <div key={i} className="credit-row">
            <input type="text" value={c[0]} placeholder="Role" onChange={e => patchCredit(i, 0, e.target.value)} />
            <input type="text" value={c[1]} placeholder="Name" onChange={e => patchCredit(i, 1, e.target.value)} />
            <button className="x-btn" onClick={() => removeCredit(i)}>✕</button>
          </div>
        ))}
        <button className="add-btn" onClick={addCredit}>+ Add credit</button>
      </div>

      {/* ── Palette frames ── */}
      <div className="card">
        <div className="card-head">
          <h2 className="card-h">Frame media</h2>
          <span className="card-hint">Upload photos / video stills · drives the case study grid</span>
        </div>
        {p.palette.map((f, i) => (
          <div key={i} className="pal-row">
            <label className="pal-swatch" style={{ background: f.c1 }}>
              <input type="color" value={f.c1} onChange={e => patchPalette(i, 'c1', e.target.value)} />
            </label>
            <label className="pal-swatch" style={{ background: f.c2 }}>
              <input type="color" value={f.c2} onChange={e => patchPalette(i, 'c2', e.target.value)} />
            </label>
            <div className="pal-media">
              {f.url && (
                /\.(mp4|mov|webm)(\?|$)/i.test(f.url.split('?')[0])
                  ? <video src={f.url} className="pal-thumb" muted />
                  : <img src={f.url} className="pal-thumb" alt="" />
              )}
              <UploadBtn projectId={p.id} onUpload={url => patchPalette(i, 'url', url)} />
            </div>
            <input
              className="pal-label"
              type="text"
              value={f.label ?? ''}
              placeholder="Label e.g. 01:14 — INT taxi"
              onChange={e => patchPalette(i, 'label', e.target.value)}
            />
            <div className="pal-preview" style={{ '--p1': f.c1, '--p2': f.c2 }} />
          </div>
        ))}
      </div>

      {/* ── Sections ── */}
      {sections.map((s, si) => (
        <div key={si} className="card">
          <div className="card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h2 className="card-h">[{s.kind.toUpperCase()}]</h2>
              <button className="x-btn" onClick={() => moveSection(si, -1)} disabled={si === 0} title="Move up">↑</button>
              <button className="x-btn" onClick={() => moveSection(si, 1)} disabled={si === sections.length - 1} title="Move down">↓</button>
              <button className="x-btn" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }} onClick={() => removeSection(si)} title="Remove section">✕</button>
            </div>
            <span className="card-hint">{s.items?.length ?? 0} items</span>
          </div>

          <Field label="Section heading">
            <input type="text" value={s.h} onChange={e => patchSection(si, 'h', e.target.value)} />
          </Field>
          <div style={{ height: 12 }} />
          <Field label="Section copy">
            <textarea value={s.copy} onChange={e => patchSection(si, 'copy', e.target.value)} rows={3} />
          </Field>

          {(s.kind === 'image' || s.kind === 'video') && (
            <div style={{ marginTop: 12 }}>
              <Field label="Columns">
                <select value={s.cols || 2} onChange={e => patchSection(si, 'cols', parseInt(e.target.value))}>
                  <option value={1}>1 — Full width</option>
                  <option value={2}>2 — Half</option>
                  <option value={3}>3 — Thirds</option>
                  <option value={4}>4 — Quarters</option>
                </select>
              </Field>
            </div>
          )}

          {s.kind !== 'text' && (
            <div style={{ marginTop: 18 }}>
              <div className={'sect-items-head' + (s.kind === 'video' ? ' is-video-head' : '') + ((s.kind === 'image' || s.kind === 'video') ? ' has-display' : '')}>
                <span>C1</span><span>C2</span><span>Media</span>
                <span>{s.kind === 'image' ? 'Caption' : 'Title'}</span>
                {s.kind === 'video' && <><span>Runtime</span><span>Ratio</span></>}
                {s.kind !== 'image' && s.kind !== 'video' && <span>Label</span>}
                {(s.kind === 'image' || s.kind === 'video') && <><span>Fit</span><span>Aspect</span></>}
                <span />
              </div>
              {(s.items || []).map((it, ii) => (
                <div key={ii} className={'sect-item-row' + (s.kind === 'video' ? ' is-video-row' : '') + ((s.kind === 'image' || s.kind === 'video') ? ' has-display' : '')}>
                  <label className="pal-swatch" style={{ background: it.c1 }}>
                    <input type="color" value={it.c1 || '#1a1a1a'} onChange={e => patchSectionItem(si, ii, 'c1', e.target.value)} />
                  </label>
                  <label className="pal-swatch" style={{ background: it.c2 }}>
                    <input type="color" value={it.c2 || '#0a0a0a'} onChange={e => patchSectionItem(si, ii, 'c2', e.target.value)} />
                  </label>
                  <div className="pal-media">
                    {it.url && (
                      /\.(mp4|mov|webm)(\?|$)/i.test(it.url.split('?')[0])
                        ? <video src={it.url} className="pal-thumb" muted />
                        : <img src={it.url} className="pal-thumb" alt="" />
                    )}
                    <UploadBtn projectId={p.id} onUpload={url => patchSectionItem(si, ii, 'url', url)} />
                  </div>
                  <input
                    type="text"
                    value={s.kind === 'image' ? (it.title ?? it.caption ?? '') : (it.title ?? '')}
                    placeholder={s.kind === 'image' ? 'Caption' : 'Title'}
                    onChange={e => patchSectionItem(si, ii, 'title', e.target.value)}
                  />
                  {s.kind === 'video' && (
                    <>
                      <input type="text" value={it.runtime ?? ''} placeholder="1:00" onChange={e => patchSectionItem(si, ii, 'runtime', e.target.value)} />
                      <input type="text" value={it.ratio ?? ''} placeholder="16:9" onChange={e => patchSectionItem(si, ii, 'ratio', e.target.value)} />
                    </>
                  )}
                  {s.kind !== 'image' && s.kind !== 'video' && (
                    <input type="text" value={it.lbl ?? ''} placeholder="Label" onChange={e => patchSectionItem(si, ii, 'lbl', e.target.value)} />
                  )}
                  {(s.kind === 'image' || s.kind === 'video') && (
                    <>
                      <select value={it.fit || 'cover'} onChange={e => patchSectionItem(si, ii, 'fit', e.target.value)}>
                        <option value="cover">Cover</option>
                        <option value="contain">Contain</option>
                        <option value="fill">Fill</option>
                      </select>
                      <select value={it.aspect || '16/9'} onChange={e => patchSectionItem(si, ii, 'aspect', e.target.value)}>
                        <option value="16/9">16:9</option>
                        <option value="4/3">4:3</option>
                        <option value="1/1">1:1</option>
                        <option value="3/2">3:2</option>
                        <option value="3/4">3:4</option>
                        <option value="9/16">9:16</option>
                      </select>
                    </>
                  )}
                  <button className="x-btn" onClick={() => removeSectionItem(si, ii)}>✕</button>
                </div>
              ))}
              <button className="add-btn" onClick={() => addSectionItem(si)}>+ Add item</button>
            </div>
          )}
        </div>
      ))}

      {/* ── Add section ── */}
      <SectionPicker onAdd={addSection} />
    </>
  );
}

function SectionPicker({ onAdd }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="section-picker">
      {!open ? (
        <button className="add-btn section-picker-trigger" onClick={() => setOpen(true)}>
          + Add section
        </button>
      ) : (
        <div className="section-picker-menu">
          <span className="card-hint">Choose type</span>
          <div className="section-picker-btns">
            {SECTION_TYPES.map(t => (
              <button key={t} className="btn" onClick={() => { onAdd(t); setOpen(false); }}>
                {t.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="btn" style={{ marginTop: 8 }} onClick={() => setOpen(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

function Field({ label, mono, children }) {
  return (
    <div className={'field' + (mono ? ' mono' : '')}>
      <label>{label}</label>
      {children}
    </div>
  );
}
