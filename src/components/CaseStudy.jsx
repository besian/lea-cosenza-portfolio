import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Placeholder } from './Placeholder';
import { MediaSlot } from './MediaSlot';
import { SECTION_TEMPLATES, SECTION_TYPES } from '../data';

const clone = (v) => JSON.parse(JSON.stringify(v));

function EditableText({ value, onChange, editing, as = "span", multiline = false, placeholder = "", className = "", style }) {
  if (!editing) return React.createElement(as, { className, style }, value);
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
  }
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

function EditSwatch({ c1, c2, onChange }) {
  return (
    <div className="ed-swatch">
      <label style={{ background: c1 }}><input type="color" value={c1} onChange={(e) => onChange({ c1: e.target.value })} /></label>
      <label style={{ background: c2 }}><input type="color" value={c2} onChange={(e) => onChange({ c2: e.target.value })} /></label>
    </div>
  );
}

export function CaseStudy({ project, nextProject, onClose, onNext, onSaveProject, onDelete, initialEditing, canEdit = false }) {
  const scrollerRef = useRef(null);
  const [editing, setEditing] = useState(!!initialEditing);
  const [draft, setDraft] = useState(project);
  const isDirty = editing && JSON.stringify(draft) !== JSON.stringify(project);

  useEffect(() => {
    setDraft(project);
    setEditing(!!initialEditing);
  }, [project && project.id, initialEditing]);

  useEffect(() => {
    if (!project) return;
    const onKey = (e) => {
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
        <div style={{ textAlign:"center" }}>
          <EditableText editing={editing} value={p.runtime} onChange={(v) => set({ runtime: v })} className="mono" />
          &nbsp;·&nbsp;
          <EditableText editing={editing} value={p.ratio} onChange={(v) => set({ ratio: v })} className="mono" />
          &nbsp;·&nbsp;
          <EditableText editing={editing} value={p.year} onChange={(v) => set({ year: v })} className="mono" />
        </div>
        <div className="cs-head-actions">
          {editing ? (
            <>
              <button className="cs-close ghost" onClick={discard}>Discard</button>
              <button className="cs-close solid" onClick={save} disabled={!isDirty}>Save ✓</button>
            </>
          ) : (
            <>
              {canEdit && <button className="cs-close" onClick={() => setEditing(true)} data-cursor="link">Edit ✎</button>}
              <button className="cs-close" onClick={onClose} data-cursor="link">Close ✕</button>
            </>
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
        <MediaSlot
          c1={heroFrame.c1} c2={heroFrame.c2}
          url={heroFrame.url}
          label={`${p.id.toUpperCase()} — HERO PLATE`} lbl2={p.ratio}
          editing={editing} projectId={p.id}
          onUpload={url => setPalette(0, { url })}
        />
        <div className="cs-hero-tc"><span /> {heroFrame.url ? p.title : 'Drop reel here'} · {p.runtime}</div>
        {editing && (
          <div className="cs-hero-edit">
            <EditSwatch c1={heroFrame.c1} c2={heroFrame.c2} onChange={(patch) => setPalette(0, patch)} />
            <span className="ed-hint">Hero plate — palette frame #1</span>
          </div>
        )}
      </div>

      {/* Brief */}
      <div className="cs-block">
        <div className="cs-2col">
          <div className="h">The brief</div>
          <div>
            <p><EditableText editing={editing} value={p.brief} onChange={(v) => set({ brief: v })} as="span" multiline placeholder="The brief — what, who, why, format" /></p>
            <p style={{ color:"var(--ink-2)", fontSize:"0.92em" }}>
              <span className="ital">Format —</span> {p.ratio} · {p.runtime} &nbsp;·&nbsp; <span className="ital">Role —</span> {p.role}
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      {p.sections && p.sections.map((s, si) => (
        <React.Fragment key={si}>
          {editing && <InsertSection onAdd={(kind) => addSection(si, kind)} />}
          <CSSection
            section={s}
            alt={si % 2 === 1}
            editing={editing}
            projectId={p.id}
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

      {/* Default frames mosaic (only for projects without custom sections) */}
      {!p.sections && (
        <div className="cs-block" style={{ background:"var(--paper-2)" }}>
          <div className="cs-2col">
            <div className="h">Selected frames</div>
            <div className="cs-frames">
              {p.palette.map((f, i) => {
                const spans = ["span-4","span-2","span-2","span-2","span-2","span-3"];
                return (
                  <div key={i} className={"cs-frame " + spans[i]}>
                    <MediaSlot
                      c1={f.c1} c2={f.c2} url={f.url}
                      label={f.label} lbl2={i === 0 ? "A-CAM" : i === 5 ? "MASTER" : ""}
                      editing={editing} projectId={p.id}
                      onUpload={url => setPalette(i, { url })}
                    />
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

      {/* Quote */}
      <div className="cs-block">
        <div className="cs-quote">
          "<EditableText editing={editing} value={p.quote.text} onChange={(v) => setQuote("text", v)} as="span" multiline />"
          <span className="src">— <EditableText editing={editing} value={p.quote.source} onChange={(v) => setQuote("source", v)} as="span" /></span>
        </div>
      </div>

      {/* Credits */}
      <div className="cs-block" style={{ background:"var(--paper-2)" }}>
        <div className="cs-2col">
          <div className="h">Credits</div>
          <dl className="cs-credits">
            {p.credits.map(([role, name], i) => (
              <React.Fragment key={i}>
                <dt className="role">
                  <EditableText editing={editing} value={role} onChange={(v) => setCredit(i, 0, v)} />
                </dt>
                <dd style={{ margin:0, display:"flex", alignItems:"baseline", gap:8 }}>
                  <EditableText editing={editing} value={name} onChange={(v) => setCredit(i, 1, v)} />
                  {editing && <button className="ed-x" onClick={() => removeCredit(i)}>×</button>}
                </dd>
              </React.Fragment>
            ))}
          </dl>
          {editing && <button className="ed-add" onClick={addCredit}>+ Add credit</button>}
        </div>
      </div>

      {nextProject && !editing && (
        <div className="cs-next" data-cursor="play">
          <div onClick={onNext} style={{ cursor:"none" }}>
            <div className="nxt-lbl">Next ↓ {nextProject.n} / {nextProject.discLabel}</div>
            <h3>{nextProject.title}</h3>
          </div>
          <button className="btn" onClick={onNext}>Open →</button>
        </div>
      )}

      {editing && createPortal(
        <EditModeBanner
          isDirty={isDirty}
          onSave={save}
          onDiscard={discard}
          onDelete={onDelete ? () => onDelete(project) : null}
        />,
        document.body
      )}
    </div>
  );
}

const ASPECT_OPTIONS = ['16/9','4/3','1/1','3/2','3/4','9/16'];
const FIT_OPTIONS = ['cover','contain','fill'];

function CSSection({ section: s, alt, editing, projectId, onChange, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown, onItemChange, onItemAdd, onItemRemove }) {
  const colsByKind = { films:3, identity:4, posters:4, merch:4, print:4, image:2, video:2 };
  const cols = s.cols || colsByKind[s.kind] || 4;
  const isSingleton = s.kind === "text";

  return (
    <div className={"cs-block " + (editing ? "is-edit-section " : "") + "is-kind-" + s.kind} style={{ background: alt ? "var(--paper-2)" : "var(--paper)" }}>
      {editing && (
        <div className="ed-section-bar">
          <span className="ed-section-tag">[{s.kind.toUpperCase()}]</span>
          {(s.kind === "image" || s.kind === "video") && (
            <select className="ed-mini-sel" value={s.cols || colsByKind[s.kind] || 2} onChange={e => onChange({ cols: parseInt(e.target.value) })}>
              <option value={1}>1 col</option>
              <option value={2}>2 col</option>
              <option value={3}>3 col</option>
              <option value={4}>4 col</option>
            </select>
          )}
          <button className="ed-mini" onClick={onMoveUp} disabled={!canMoveUp}>↑</button>
          <button className="ed-mini" onClick={onMoveDown} disabled={!canMoveDown}>↓</button>
          <button className="ed-mini danger" onClick={onRemove}>×</button>
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

      {!isSingleton && (s.items?.length > 0 || editing) && (
        <div className="cs-sect-grid" style={{ gridTemplateColumns:`repeat(${cols},1fr)` }}>
          {(s.items || []).map((it, i) => (
            <figure key={i} className={"cs-sect-item " + (s.kind === "films" ? "is-film " : "") + (s.kind === "posters" ? "is-poster " : "")}>
              <div
                className={"cs-sect-frame " + ((s.kind === "films" || s.kind === "video") && it.ratio === "9:16" ? "is-vert" : "")}
                style={it.aspect ? { aspectRatio: it.aspect } : undefined}
              >
                <MediaSlot
                  c1={it.c1} c2={it.c2} url={it.url}
                  label={it.lbl} lbl2={it.ratio || ""}
                  fit={it.fit || "cover"}
                  editing={editing} projectId={projectId}
                  onUpload={url => onItemChange(i, { url })}
                />
                {(s.kind === "films" || s.kind === "video") && (
                  <div className="cs-sect-rec"><span /> {it.runtime}</div>
                )}
                {editing && (
                  <div className="cs-item-edit">
                    <div className="cs-item-edit-row">
                      <EditSwatch c1={it.c1} c2={it.c2} onChange={(patch) => onItemChange(i, patch)} />
                      <button className="ed-x dark" onClick={() => onItemRemove(i)}>×</button>
                    </div>
                    {(s.kind === "image" || s.kind === "video") && (
                      <div className="cs-item-edit-row">
                        <select className="cs-item-sel" value={it.fit || "cover"} onChange={e => onItemChange(i, { fit: e.target.value })}>
                          {FIT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <select className="cs-item-sel" value={it.aspect || "16/9"} onChange={e => onItemChange(i, { aspect: e.target.value })}>
                          {ASPECT_OPTIONS.map(a => <option key={a} value={a}>{a.replace('/', ':')}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {(it.title || it.caption || editing) && (
                <figcaption className="cs-sect-cap">
                  <span className="cs-sect-cap-t">
                    <EditableText
                      editing={editing}
                      value={it.title || it.caption || ""}
                      onChange={(v) => onItemChange(i, { title: v })}
                      placeholder={s.kind === "image" ? "Caption" : "Title"}
                    />
                  </span>
                  {s.kind !== "image" && (
                    <span className="cs-sect-cap-m">
                      <EditableText editing={editing} value={it.lbl || ""} onChange={(v) => onItemChange(i, { lbl: v })} placeholder="Label" />
                      {it.runtime && !editing && ` · ${it.runtime} · ${it.ratio}`}
                    </span>
                  )}
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

function InsertSection({ onAdd }) {
  const [open, setOpen] = useState(false);
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
