// admin.jsx — project content editor
// Reads/writes PROJECTS via the localStorage helpers in data.jsx.
const { useState, useEffect, useMemo, useRef, useCallback } = React;

// Deep clone a plain JSON structure (the project data is JSON-safe).
const clone = (v) => JSON.parse(JSON.stringify(v));

// Compare two values structurally.
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ─── Root ──────────────────────────────────────────────────────────────────
function Admin() {
  // Master state: the working set of projects (cloned at mount).
  const [projects, setProjects] = useState(() => clone(window.PROJECTS));
  const [originals] = useState(() => clone(window.PROJECTS));
  const [selectedId, setSelectedId] = useState(projects[0]?.id);
  const [savedAt, setSavedAt] = useState(null);
  const [toast, setToast] = useState("");

  // Per-project dirty status — compares against original
  const isDirty = useCallback((id) => {
    const cur = projects.find((p) => p.id === id);
    const og = originals.find((p) => p.id === id);
    return cur && og && !eq(cur, og);
  }, [projects, originals]);

  const anyDirty = useMemo(() => projects.some((_, i) => !eq(projects[i], originals[i])), [projects, originals]);

  const selected = projects.find((p) => p.id === selectedId);
  const selectedIdx = projects.findIndex((p) => p.id === selectedId);

  // Update a field on the selected project (immutably)
  const updateProject = useCallback((patch) => {
    setProjects((prev) => prev.map((p) =>
      p.id === selectedId ? { ...p, ...patch } : p
    ));
  }, [selectedId]);

  // Persist to localStorage
  const save = () => {
    const byId = {};
    projects.forEach((p) => { byId[p.id] = p; });
    window.saveStoredProjects(byId);
    // Sync originals so dirty resets
    projects.forEach((p, i) => { originals[i] = clone(p); });
    setSavedAt(Date.now());
    showToast("Saved to browser storage");
  };

  // Reset all projects to defaults (clears localStorage)
  const resetAll = () => {
    if (!confirm("Reset all projects to original defaults? Your edits will be lost.")) return;
    try { localStorage.removeItem("lc:projects"); } catch (e) {}
    // Reload to pull fresh defaults
    location.reload();
  };

  // Export the current state as JSON download
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "lea-cosenza-projects.json"; a.click();
    URL.revokeObjectURL(url);
    showToast("Exported JSON");
  };

  // Import JSON
  const fileRef = useRef(null);
  const importJson = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(r.result);
        if (!Array.isArray(parsed)) throw new Error("Expected an array");
        setProjects(parsed);
        showToast("Imported JSON — remember to Save");
      } catch (err) {
        alert("Couldn't parse that file: " + err.message);
      }
    };
    r.readAsText(file);
    e.target.value = "";
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  };

  // ⌘S / Ctrl-S shortcut
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (anyDirty) save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="topbar">
          <span className="mark"><span className="dot" />LC / Admin</span>
          <a href="Lea Cosenza.html" target="_blank" rel="noopener">View site ↗</a>
        </div>
        <div className="side-list">
          {projects.map((p) => (
            <div
              key={p.id}
              className={"side-item " + (p.id === selectedId ? "is-on " : "") + (isDirty(p.id) ? "is-dirty " : "")}
              onClick={() => setSelectedId(p.id)}
            >
              <span className="si-num">{p.n}</span>
              <span className="si-title">{p.title}{p.featured ? " ★" : ""}</span>
              <span className="si-disc">{p.discLabel}</span>
            </div>
          ))}
        </div>
        <div className="side-foot">
          <button onClick={exportJson}>↓ Export JSON</button>
          <button onClick={() => fileRef.current?.click()}>↑ Import JSON</button>
          <input ref={fileRef} type="file" accept="application/json" onChange={importJson} style={{ display: "none" }} />
          <button onClick={resetAll}>↺ Reset all to defaults</button>
        </div>
      </aside>

      <main className="main">
        {!selected ? (
          <div className="empty">Select a project on the left to edit it.</div>
        ) : (
          <ProjectForm
            project={selected}
            onChange={updateProject}
            disciplines={window.DISCIPLINES}
          />
        )}

        <div className="savebar">
          <span className={"status " + (anyDirty ? "dirty" : savedAt ? "saved" : "")}>
            <span className="ind" />
            {anyDirty ? "Unsaved changes" : savedAt ? "Saved · " + timeAgo(savedAt) : "All in sync"}
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" onClick={() => {
              if (!confirm("Discard your unsaved changes to this project?")) return;
              setProjects((prev) => prev.map((p, i) => p.id === selectedId ? clone(originals[i]) : p));
            }} disabled={!isDirty(selectedId)}>Revert this</button>
            <button className="btn primary" onClick={save} disabled={!anyDirty}>Save changes</button>
          </div>
        </div>
      </main>

      <div className={"toast " + (toast ? "is-on" : "")}>{toast}</div>
    </div>
  );
}

function timeAgo(t) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return s + "s ago";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  return new Date(t).toLocaleTimeString();
}

// ─── Project form ─────────────────────────────────────────────────────────
function ProjectForm({ project, onChange, disciplines }) {
  const p = project;
  // Helper to patch nested arrays
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
  const addCredit = () => onChange({ credits: [...p.credits, ["", ""]] });
  const removeCredit = (i) => onChange({ credits: p.credits.filter((_, j) => j !== i) });

  // Sections (Troubadour only)
  const patchSection = (si, key, val) => {
    const next = clone(p.sections);
    next[si] = { ...next[si], [key]: val };
    onChange({ sections: next });
  };
  const patchSectionItem = (si, ii, key, val) => {
    const next = clone(p.sections);
    next[si].items[ii] = { ...next[si].items[ii], [key]: val };
    onChange({ sections: next });
  };
  const addSectionItem = (si) => {
    const next = clone(p.sections);
    const sampleItem = next[si].items[0] || { c1: "#1a1a1a", c2: "#0a0a0a", lbl: "" };
    const newItem = {};
    Object.keys(sampleItem).forEach((k) => { newItem[k] = ""; });
    newItem.c1 = sampleItem.c1; newItem.c2 = sampleItem.c2;
    next[si].items.push(newItem);
    onChange({ sections: next });
  };
  const removeSectionItem = (si, ii) => {
    const next = clone(p.sections);
    next[si].items.splice(ii, 1);
    onChange({ sections: next });
  };

  return (
    <React.Fragment>
      <div className="main-head">
        <div>
          <span className="kicker mono">N° {p.n} · {p.discLabel} · {p.year}{p.featured ? " · ★ Featured" : ""}</span>
          <h1 className="main-h">{p.title || "Untitled"}<em>.</em></h1>
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
            <input type="text" value={p.title} onChange={(e) => onChange({ title: e.target.value })} />
          </Field>
          <Field label="Discipline label">
            <input type="text" value={p.discLabel} onChange={(e) => onChange({ discLabel: e.target.value })} />
          </Field>
        </div>
        <div style={{ height: 12 }} />
        <div className="grid-3">
          <Field label="N°" mono>
            <input type="text" value={p.n} onChange={(e) => onChange({ n: e.target.value })} />
          </Field>
          <Field label="Year" mono>
            <input type="text" value={p.year} onChange={(e) => onChange({ year: e.target.value })} />
          </Field>
          <Field label="Discipline (filter)">
            <select value={p.disc} onChange={(e) => onChange({ disc: e.target.value })}>
              {disciplines.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ height: 12 }} />
        <div className="grid-3">
          <Field label="Client">
            <input type="text" value={p.client} onChange={(e) => onChange({ client: e.target.value })} />
          </Field>
          <Field label="Runtime" mono>
            <input type="text" value={p.runtime} onChange={(e) => onChange({ runtime: e.target.value })} />
          </Field>
          <Field label="Aspect ratio" mono>
            <input type="text" value={p.ratio} onChange={(e) => onChange({ ratio: e.target.value })} />
          </Field>
        </div>
      </div>

      {/* ── Brief & role ── */}
      <div className="card">
        <div className="card-head">
          <h2 className="card-h">The brief</h2>
          <span className="card-hint">Paragraph in the case study body</span>
        </div>
        <Field label="Role">
          <input type="text" value={p.role} onChange={(e) => onChange({ role: e.target.value })} />
        </Field>
        <div style={{ height: 12 }} />
        <Field label="Brief">
          <textarea value={p.brief} onChange={(e) => onChange({ brief: e.target.value })} rows="5" />
        </Field>
      </div>

      {/* ── Quote ── */}
      <div className="card">
        <div className="card-head">
          <h2 className="card-h">Pull quote</h2>
          <span className="card-hint">Shown in italic serif</span>
        </div>
        <Field label="Quote text">
          <textarea value={p.quote.text} onChange={(e) => onChange({ quote: { ...p.quote, text: e.target.value } })} rows="3" />
        </Field>
        <div style={{ height: 12 }} />
        <Field label="Source">
          <input type="text" value={p.quote.source} onChange={(e) => onChange({ quote: { ...p.quote, source: e.target.value } })} />
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
            <input className="mono-input" style={inputMono} type="text" value={c[0]} placeholder="Role" onChange={(e) => patchCredit(i, 0, e.target.value)} />
            <input style={inputBase} type="text" value={c[1]} placeholder="Name" onChange={(e) => patchCredit(i, 1, e.target.value)} />
            <button className="x-btn" onClick={() => removeCredit(i)} aria-label="Remove">✕</button>
          </div>
        ))}
        <button className="add-btn" onClick={addCredit}>+ Add credit</button>
      </div>

      {/* ── Palette frames ── */}
      <div className="card">
        <div className="card-head">
          <h2 className="card-h">Frame swatches</h2>
          <span className="card-hint">6 placeholders for the case study frames grid · used as scrub previews on the index</span>
        </div>
        {p.palette.map((f, i) => (
          <div key={i} className="pal-row">
            <label className="pal-swatch" style={{ background: f.c1 }}>
              <input type="color" value={f.c1} onChange={(e) => patchPalette(i, "c1", e.target.value)} />
            </label>
            <label className="pal-swatch" style={{ background: f.c2 }}>
              <input type="color" value={f.c2} onChange={(e) => patchPalette(i, "c2", e.target.value)} />
            </label>
            <input style={inputMono} type="text" value={f.label} placeholder="Label e.g. 01:14:08 — INT taxi" onChange={(e) => patchPalette(i, "label", e.target.value)} />
            <div className="pal-preview" style={{ "--p1": f.c1, "--p2": f.c2, width: 80 }} />
          </div>
        ))}
      </div>

      {/* ── Sections (featured only) ── */}
      {p.sections && p.sections.map((s, si) => (
        <div key={si} className="card">
          <div className="card-head">
            <h2 className="card-h">[{s.kind.toUpperCase()}] {s.h}</h2>
            <span className="card-hint">{s.items.length} items</span>
          </div>
          <Field label="Section heading">
            <input type="text" value={s.h} onChange={(e) => patchSection(si, "h", e.target.value)} />
          </Field>
          <div style={{ height: 12 }} />
          <Field label="Section copy">
            <textarea value={s.copy} onChange={(e) => patchSection(si, "copy", e.target.value)} rows="3" />
          </Field>
          <div style={{ marginTop: 18 }}>
            {s.items.map((it, ii) => (
              <div key={ii} className="sect-items">
                <label className="pal-swatch" style={{ background: it.c1 }}>
                  <input type="color" value={it.c1} onChange={(e) => patchSectionItem(si, ii, "c1", e.target.value)} />
                </label>
                <label className="pal-swatch" style={{ background: it.c2 }}>
                  <input type="color" value={it.c2} onChange={(e) => patchSectionItem(si, ii, "c2", e.target.value)} />
                </label>
                <input style={inputBase} type="text" value={it.title || ""} placeholder={"Title (optional)"} onChange={(e) => patchSectionItem(si, ii, "title", e.target.value)} />
                <input style={inputMono} type="text" value={it.lbl || ""} placeholder="Label / code" onChange={(e) => patchSectionItem(si, ii, "lbl", e.target.value)} />
                <button className="x-btn" onClick={() => removeSectionItem(si, ii)}>✕</button>
              </div>
            ))}
            <button className="add-btn" onClick={() => addSectionItem(si)}>+ Add item</button>
          </div>
        </div>
      ))}
    </React.Fragment>
  );
}

// ─── Tiny helpers ──────────────────────────────────────────────────────────
function Field({ label, mono, children }) {
  return (
    <div className={"field " + (mono ? "mono" : "")}>
      <label>{label}</label>
      {children}
    </div>
  );
}

const inputBase = {
  width: "100%", font: "inherit", fontFamily: "Archivo, sans-serif",
  fontWeight: 500, fontSize: 14, color: "var(--ink)", background: "var(--paper)",
  border: "1px solid var(--rule)", padding: "9px 12px", borderRadius: 6, outline: "none",
};
const inputMono = { ...inputBase, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 };

// ─── Mount ────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById("root")).render(<Admin />);
