// case-study.jsx — full-screen case study with Shopify-style inline editor
const { useState: useStateCS, useEffect: useEffectCS, useRef: useRefCS } = React;

const clone = (v) => JSON.parse(JSON.stringify(v));

// ─── Section templates (used when inserting a new section) ───────────────
const SECTION_TEMPLATES = {
  text:     { kind: "text",     h: "A heading",       copy: "Write a paragraph here. This is a plain prose block — no media. Useful for the brief, a director's note, or behind-the-scenes detail.",
    items: [] },
  image:    { kind: "image",    h: "Image",           copy: "Optional caption or context for this image.",
    items: [{ c1: "#3a2818", c2: "#1a1208", lbl: "IMAGE — DROP A 16:9 PLATE HERE", caption: "Caption — describe the shot" }] },
  video:    { kind: "video",    h: "Video",           copy: "Optional context for this clip.",
    items: [{ c1: "#1a1a1a", c2: "#0a0a0a", lbl: "VIDEO — DROP REEL HERE", title: "New clip", runtime: "1:00", ratio: "16:9", caption: "" }] },
  films:    { kind: "films",    h: "Films",    copy: "Short description of this set of films.",
    items: [{ title: "New film", runtime: "1:00", ratio: "16:9", c1: "#1a1a1a", c2: "#0a0a0a", lbl: "FILM 01 — A.CAM" }] },
  identity: { kind: "identity", h: "Identity", copy: "Wordmarks, lockups, stamps.",
    items: [{ title: "Wordmark", c1: "#161412", c2: "#0a0908", lbl: "MARK A" }] },
  posters:  { kind: "posters",  h: "Posters",  copy: "Series, monthly grid, etc.",
    items: [{ c1: "#ff3b1f", c2: "#161412", lbl: "POSTER 01" }] },
  merch:    { kind: "merch",    h: "Merch",    copy: "Run-of-merch drops.",
    items: [{ title: "New item", c1: "#161412", c2: "#0a0908", lbl: "DROP / ITEM" }] },
  print:    { kind: "print",    h: "Print",    copy: "Programmes, tickets, menus, signage.",
    items: [{ title: "New piece", c1: "#ece7dd", c2: "#3a2818", lbl: "PRINT" }] },
};
const SECTION_TYPES = Object.keys(SECTION_TEMPLATES);

// ─── Placeholder + editable swatch ────────────────────────────────────────
function Placeholder({ c1, c2, label, lbl2, children, className = "" }) {
  return (
    <div className={"ph " + className} style={{ "--c1": c1, "--c2": c2 }}>
      {label && <span className="lbl">{label}</span>}
      {lbl2 && <span className="lbl2">{lbl2}</span>}
      {children}
    </div>
  );
}

// EditableText — contentEditable wrapper that fires onChange on blur.
// Only mutates the DOM on initial mount per editing-session so live typing
// is not overwritten by parent re-renders.
function EditableText({ value, onChange, editing, as = "span", multiline = false, placeholder = "", className = "", style }) {
  if (!editing) return React.createElement(as, { className, style }, value);
  return React.createElement(as, {
    contentEditable: true,
    suppressContentEditableWarning: true,
    className: (className || "") + " ed-on",
    style,
    "data-placeholder": placeholder,
    dangerouslySetInnerHTML: { __html: escapeHtml(value || "") },
    onBlur: (e) => {
      const t = e.currentTarget.innerText.trim();
      if (t !== value) onChange(t);
    },
    onKeyDown: (e) => {
      if (!multiline && e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
      if (e.key === "Escape") e.currentTarget.blur();
    },
  });
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// Inline swatch — color picker pair shown when editing
function EditSwatch({ c1, c2, onChange }) {
  return (
    <div className="ed-swatch">
      <label style={{ background: c1 }}><input type="color" value={c1} onChange={(e) => onChange({ c1: e.target.value })} /></label>
      <label style={{ background: c2 }}><input type="color" value={c2} onChange={(e) => onChange({ c2: e.target.value })} /></label>
    </div>
  );
}

// ─── Case study (with inline editor) ──────────────────────────────────────
function CaseStudy({ project, nextProject, onClose, onNext, onSaveProject, onDelete, initialEditing }) {
  const scrollerRef = useRefCS(null);
  const [editing, setEditing] = useStateCS(!!initialEditing);
  const [draft, setDraft] = useStateCS(project);
  const isDirty = editing && JSON.stringify(draft) !== JSON.stringify(project);

  // Reset draft + editing when the project changes
  useEffectCS(() => {
    setDraft(project);
    setEditing(!!initialEditing);
  }, [project && project.id, initialEditing]);

  // Esc to close, arrows to nav. When editing, Esc exits edit mode first.
  useEffectCS(() => {
    if (!project) return;
    const onKey = (e) => {
      // Don't hijack keys while user is typing in an editable
      if (e.target.isContentEditable) return;
      if (e.key === "Escape") {
        if (editing) setEditing(false);
        else onClose();
      }
      if (e.key === "ArrowRight" && !editing) onNext();
    };
    window.addEventListener("keydown", onKey);
    if (scrollerRef.current && !editing) scrollerRef.current.scrollTo({ top: 0, behavior: "instant" });
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [project, onClose, onNext, editing]);

  if (!project) return <div className="cs" aria-hidden="true" ref={scrollerRef} />;

  const p = editing ? draft : project;

  // Patch helpers (act on draft)
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setQuote = (k, v) => setDraft((d) => ({ ...d, quote: { ...d.quote, [k]: v } }));
  const setPalette = (i, patch) => setDraft((d) => {
    const palette = [...d.palette];
    palette[i] = { ...palette[i], ...patch };
    return { ...d, palette };
  });
  const setCredit = (i, idx, v) => setDraft((d) => {
    const credits = d.credits.map((c, j) => j === i ? [...c] : c);
    credits[i][idx] = v;
    return { ...d, credits };
  });
  const addCredit = () => setDraft((d) => ({ ...d, credits: [...d.credits, ["", ""]] }));
  const removeCredit = (i) => setDraft((d) => ({ ...d, credits: d.credits.filter((_, j) => j !== i) }));

  // Sections
  const setSection = (si, patch) => setDraft((d) => {
    const sections = [...(d.sections || [])];
    sections[si] = { ...sections[si], ...patch };
    return { ...d, sections };
  });
  const addSection = (atIdx, kind) => setDraft((d) => {
    const sections = [...(d.sections || [])];
    sections.splice(atIdx, 0, clone(SECTION_TEMPLATES[kind]));
    return { ...d, sections };
  });
  const removeSection = (si) => {
    if (!confirm("Remove this section?")) return;
    setDraft((d) => {
      const sections = [...(d.sections || [])];
      sections.splice(si, 1);
      return { ...d, sections };
    });
  };
  const moveSection = (si, dir) => setDraft((d) => {
    const sections = [...(d.sections || [])];
    const j = si + dir;
    if (j < 0 || j >= sections.length) return d;
    [sections[si], sections[j]] = [sections[j], sections[si]];
    return { ...d, sections };
  });
  const setSectionItem = (si, ii, patch) => setDraft((d) => {
    const sections = [...(d.sections || [])];
    const items = [...sections[si].items];
    items[ii] = { ...items[ii], ...patch };
    sections[si] = { ...sections[si], items };
    return { ...d, sections };
  });
  const addSectionItem = (si) => setDraft((d) => {
    const sections = [...(d.sections || [])];
    const items = [...sections[si].items];
    const tpl = SECTION_TEMPLATES[sections[si].kind] || SECTION_TEMPLATES.identity;
    items.push(clone(tpl.items[0]));
    sections[si] = { ...sections[si], items };
    return { ...d, sections };
  });
  const removeSectionItem = (si, ii) => setDraft((d) => {
    const sections = [...(d.sections || [])];
    const items = sections[si].items.filter((_, j) => j !== ii);
    sections[si] = { ...sections[si], items };
    return { ...d, sections };
  });

  const save = () => {
    onSaveProject && onSaveProject(draft);
    setEditing(false);
  };
  const discard = () => {
    if (isDirty && !confirm("Discard your edits?")) return;
    setDraft(project);
    setEditing(false);
  };

  const heroFrame = (p.palette && p.palette[0]) || { c1: "#1a1a1a", c2: "#0a0a0a" };

  return (
    <div className={"cs is-open " + (editing ? "is-editing" : "")} ref={scrollerRef}>
      <div className="cs-head">
        <div>{p.n} / <EditableText editing={editing} value={p.discLabel} onChange={(v) => set({ discLabel: v })} /></div>
        <div style={{ textAlign: "center" }}>
          <EditableText editing={editing} value={p.runtime} onChange={(v) => set({ runtime: v })} className="mono" /> &nbsp;·&nbsp;
          <EditableText editing={editing} value={p.ratio} onChange={(v) => set({ ratio: v })} className="mono" /> &nbsp;·&nbsp;
          <EditableText editing={editing} value={p.year} onChange={(v) => set({ year: v })} className="mono" />
        </div>
        <div className="cs-head-actions">
          {editing ? (
            <React.Fragment>
              <button className="cs-close ghost" onClick={discard}>Discard</button>
              <button className="cs-close solid" onClick={save} disabled={!isDirty}>Save ✓</button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <button className="cs-close" onClick={() => setEditing(true)} data-cursor="link">Edit ✎</button>
              <button className="cs-close" onClick={onClose} data-cursor="link">Close ✕</button>
            </React.Fragment>
          )}
        </div>
      </div>

      <div className="cs-title">
        <div className="kicker">
          <span>Client / <EditableText editing={editing} value={p.client} onChange={(v) => set({ client: v })} /></span>
          <span>Role / <EditableText editing={editing} value={p.role} onChange={(v) => set({ role: v })} /></span>
          <span>Year / {p.year}</span>
        </div>
        <h1><EditableText editing={editing} value={p.title} onChange={(v) => set({ title: v })} as="span" /><em>.</em></h1>
      </div>

      <div className="cs-hero">
        <Placeholder c1={heroFrame.c1} c2={heroFrame.c2} label={`${p.id.toUpperCase()} — HERO PLATE`} lbl2={p.ratio} />
        <div className="cs-hero-tc"><span /> Drop reel here · {p.runtime}</div>
        {editing && (
          <div className="cs-hero-edit">
            <EditSwatch c1={heroFrame.c1} c2={heroFrame.c2} onChange={(patch) => setPalette(0, patch)} />
            <span className="ed-hint">Hero plate uses palette frame #1</span>
          </div>
        )}
      </div>

      {/* ── Brief ── */}
      <div className="cs-block">
        <div className="cs-2col">
          <div className="h">The brief</div>
          <div>
            <p><EditableText editing={editing} value={p.brief} onChange={(v) => set({ brief: v })} as="span" multiline placeholder="The brief — what, who, why, format" /></p>
            <p style={{ color: "var(--ink-2)", fontSize: "0.92em" }}>
              <span className="ital">Format —</span> {p.ratio} · {p.runtime} &nbsp;·&nbsp; <span className="ital">Role —</span> {p.role}
            </p>
          </div>
        </div>
      </div>

      {/* ── Sections (multi-medium) ── */}
      {p.sections && p.sections.map((s, si) => (
        <React.Fragment key={si}>
          {editing && <InsertSection onAdd={(kind) => addSection(si, kind)} />}
          <CSSection
            section={s}
            alt={si % 2 === 1}
            editing={editing}
            onChange={(patch) => setSection(si, patch)}
            onRemove={() => removeSection(si)}
            onMoveUp={() => moveSection(si, -1)}
            onMoveDown={() => moveSection(si, +1)}
            canMoveUp={si > 0}
            canMoveDown={si < p.sections.length - 1}
            onItemChange={(ii, patch) => setSectionItem(si, ii, patch)}
            onItemAdd={() => addSectionItem(si)}
            onItemRemove={(ii) => removeSectionItem(si, ii)}
          />
        </React.Fragment>
      ))}
      {editing && <InsertSection onAdd={(kind) => addSection((p.sections || []).length, kind)} />}

      {/* ── Default frames mosaic (only for projects without custom sections) ── */}
      {!p.sections && (
        <div className="cs-block" style={{ background: "var(--paper-2)" }}>
          <div className="cs-2col">
            <div className="h">Selected frames</div>
            <div className="cs-frames">
              {p.palette.map((f, i) => {
                const spans = ["span-4", "span-2", "span-2", "span-2", "span-2", "span-3"];
                return (
                  <div key={i} className={"cs-frame " + spans[i]}>
                    <Placeholder c1={f.c1} c2={f.c2} label={f.label} lbl2={i === 0 ? "A-CAM" : i === 5 ? "MASTER" : ""} />
                    {editing && (
                      <div className="cs-frame-edit">
                        <EditSwatch c1={f.c1} c2={f.c2} onChange={(patch) => setPalette(i, patch)} />
                        <EditableText editing={editing} value={f.label} onChange={(v) => setPalette(i, { label: v })} as="span" className="ed-frame-lbl mono" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Quote ── */}
      <div className="cs-block">
        <div className="cs-quote">
          "<EditableText editing={editing} value={p.quote.text} onChange={(v) => setQuote("text", v)} as="span" multiline />"
          <span className="src">— <EditableText editing={editing} value={p.quote.source} onChange={(v) => setQuote("source", v)} as="span" /></span>
        </div>
      </div>

      {/* ── Credits ── */}
      <div className="cs-block" style={{ background: "var(--paper-2)" }}>
        <div className="cs-2col">
          <div className="h">Credits</div>
          <dl className="cs-credits">
            {p.credits.map(([role, name], i) => (
              <React.Fragment key={i}>
                <dt className="role">
                  <EditableText editing={editing} value={role} onChange={(v) => setCredit(i, 0, v)} />
                </dt>
                <dd style={{ margin: 0, display: "flex", alignItems: "baseline", gap: 8 }}>
                  <EditableText editing={editing} value={name} onChange={(v) => setCredit(i, 1, v)} />
                  {editing && <button className="ed-x" onClick={() => removeCredit(i)} title="Remove credit">×</button>}
                </dd>
              </React.Fragment>
            ))}
          </dl>
          {editing && <button className="ed-add" onClick={addCredit}>+ Add credit</button>}
        </div>
      </div>

      {nextProject && !editing && (
        <div className="cs-next" data-cursor="play">
          <div onClick={onNext} style={{ cursor: "none" }}>
            <div className="nxt-lbl">Next ↓ {nextProject.n} / {nextProject.discLabel}</div>
            <h3>{nextProject.title}</h3>
          </div>
          <button className="btn" onClick={onNext}>Open →</button>
        </div>
      )}

      {editing && <EditModeBanner isDirty={isDirty} onSave={save} onDiscard={discard} onDelete={onDelete ? () => onDelete(project) : null} />}
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────
function CSSection({ section: s, alt, editing, onChange, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown, onItemChange, onItemAdd, onItemRemove }) {
  const colsByKind = { films: 3, identity: 4, posters: 4, merch: 4, print: 4 };
  const cols = colsByKind[s.kind] || 4;
  const isSingleton = s.kind === "text" || s.kind === "image" || s.kind === "video";

  return (
    <div className={"cs-block " + (editing ? "is-edit-section " : "") + "is-kind-" + s.kind} style={{ background: alt ? "var(--paper-2)" : "var(--paper)" }}>
      {editing && (
        <div className="ed-section-bar">
          <span className="ed-section-tag">[{s.kind.toUpperCase()}]</span>
          <button className="ed-mini" onClick={onMoveUp} disabled={!canMoveUp} title="Move up">↑</button>
          <button className="ed-mini" onClick={onMoveDown} disabled={!canMoveDown} title="Move down">↓</button>
          <button className="ed-mini danger" onClick={onRemove} title="Remove section">×</button>
        </div>
      )}

      <div className="cs-sect-head">
        <span className="cs-sect-kind">[{s.kind.toUpperCase()}]</span>
        <h3 className="cs-sect-h">
          <EditableText editing={editing} value={s.h} onChange={(v) => onChange({ h: v })} />
        </h3>
        <p className="cs-sect-copy">
          <EditableText editing={editing} value={s.copy} onChange={(v) => onChange({ copy: v })} as="span" multiline />
        </p>
      </div>

      {/* TEXT — prose only, no items */}
      {s.kind === "text" && null}

      {/* IMAGE — single full-bleed plate */}
      {s.kind === "image" && s.items[0] && (
        <SingletonMedia
          kind="image"
          item={s.items[0]}
          editing={editing}
          onChange={(patch) => onItemChange(0, patch)}
        />
      )}

      {/* VIDEO — single full-bleed plate with REC chrome */}
      {s.kind === "video" && s.items[0] && (
        <SingletonMedia
          kind="video"
          item={s.items[0]}
          editing={editing}
          onChange={(patch) => onItemChange(0, patch)}
        />
      )}

      {/* GRID — films / identity / posters / merch / print */}
      {!isSingleton && (
        <div className="cs-sect-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {s.items.map((it, i) => (
            <figure key={i} className={"cs-sect-item " + (s.kind === "films" ? "is-film " : "") + (s.kind === "posters" ? "is-poster " : "")}>
              <div className={"cs-sect-frame " + (s.kind === "films" && it.ratio === "9:16" ? "is-vert" : "")}>
                <Placeholder c1={it.c1} c2={it.c2} label={it.lbl} lbl2={it.ratio || ""} />
                {s.kind === "films" && (
                  <div className="cs-sect-rec"><span /> {it.runtime}</div>
                )}
                {editing && (
                  <div className="cs-item-edit">
                    <EditSwatch c1={it.c1} c2={it.c2} onChange={(patch) => onItemChange(i, patch)} />
                    <button className="ed-x dark" onClick={() => onItemRemove(i)} title="Remove item">×</button>
                  </div>
                )}
              </div>
              {(it.title || editing) && (
                <figcaption className="cs-sect-cap">
                  <span className="cs-sect-cap-t">
                    <EditableText editing={editing} value={it.title || ""} onChange={(v) => onItemChange(i, { title: v })} placeholder="Title" />
                  </span>
                  <span className="cs-sect-cap-m">
                    <EditableText editing={editing} value={it.lbl || ""} onChange={(v) => onItemChange(i, { lbl: v })} placeholder="Label" />
                    {it.runtime && !editing && ` · ${it.runtime} · ${it.ratio}`}
                  </span>
                </figcaption>
              )}
            </figure>
          ))}
          {editing && (
            <button className="cs-sect-add" onClick={onItemAdd}>+ Add item</button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Singleton media (image / video) — one big full-bleed plate ──────────
function SingletonMedia({ kind, item: it, editing, onChange }) {
  return (
    <div className={"cs-singleton is-" + kind}>
      <div className="cs-singleton-frame">
        <Placeholder c1={it.c1} c2={it.c2} label={it.lbl} lbl2={kind === "video" ? it.ratio : ""} />
        {kind === "video" && (
          <div className="cs-singleton-tc"><span /> REC · {it.runtime || "0:00"} · {it.ratio || "16:9"}</div>
        )}
        {editing && (
          <div className="cs-singleton-edit">
            <EditSwatch c1={it.c1} c2={it.c2} onChange={onChange} />
            <span className="ed-hint">{kind === "image" ? "Drop an image into the project, then point it here" : "Drop a video file, then point it here"}</span>
          </div>
        )}
      </div>
      <div className="cs-singleton-meta">
        <div className="cs-singleton-cap">
          <EditableText editing={editing} value={it.caption || ""} onChange={(v) => onChange({ caption: v })} placeholder={kind === "image" ? "Caption" : "Caption — what's happening in this cut"} multiline />
        </div>
        {kind === "video" && (
          <div className="cs-singleton-vmeta">
            <span><span className="vk">Title</span><EditableText editing={editing} value={it.title || ""} onChange={(v) => onChange({ title: v })} placeholder="Clip title" /></span>
            <span><span className="vk">Runtime</span><EditableText editing={editing} value={it.runtime || ""} onChange={(v) => onChange({ runtime: v })} placeholder="0:00" /></span>
            <span><span className="vk">Ratio</span><EditableText editing={editing} value={it.ratio || ""} onChange={(v) => onChange({ ratio: v })} placeholder="16:9" /></span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Insert-section divider ──────────────────────────────────────────────
function InsertSection({ onAdd }) {
  const [open, setOpen] = useStateCS(false);
  return (
    <div className={"ed-insert " + (open ? "is-open" : "")}>
      {!open ? (
        <button className="ed-insert-btn" onClick={() => setOpen(true)}>+ Add section</button>
      ) : (
        <div className="ed-insert-picker">
          <span className="ed-insert-lbl">Insert</span>
          {SECTION_TYPES.map((t) => (
            <button key={t} onClick={() => { onAdd(t); setOpen(false); }}>
              {t.toUpperCase()}
            </button>
          ))}
          <button className="ed-insert-x" onClick={() => setOpen(false)}>cancel</button>
        </div>
      )}
    </div>
  );
}

// ─── Sticky edit-mode banner ─────────────────────────────────────────────
function EditModeBanner({ isDirty, onSave, onDiscard, onDelete }) {
  return (
    <div className="ed-banner">
      <span className="ed-banner-l">
        <span className="ed-banner-dot" />
        {isDirty ? "Editing · unsaved changes" : "Editing · all caught up"}
      </span>
      <span className="ed-banner-r">
        <span className="ed-banner-hint">Click anything to edit · Esc exits</span>
        {onDelete && <button className="cs-close ghost danger" onClick={onDelete}>Delete project</button>}
        <button className="cs-close ghost" onClick={onDiscard}>Discard</button>
        <button className="cs-close solid" onClick={onSave} disabled={!isDirty}>Save ✓</button>
      </span>
    </div>
  );
}

Object.assign(window, { CaseStudy, Placeholder, CSSection });
