// portfolio.jsx — Topbar, Hero, Index, About, Footer
const { useState: useStateP, useEffect: useEffectP, useRef: useRefP, useMemo: useMemoP } = React;

// ─── Topbar ─────────────────────────────────────────────────────────────────
function Topbar() {
  const [t, setT] = useStateP(() => new Date());
  useEffectP(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(t.getUTCHours()).padStart(2, "0");
  const mm = String(t.getUTCMinutes()).padStart(2, "0");
  return (
    <div className="topbar">
      <div className="left">
        <span className="mark"><span className="dot" />LC / Studio</span>
      </div>
      <div className="center">
        <span className="num">{hh}:{mm}</span> UTC
      </div>
      <nav className="right">
        <a href="#index" data-cursor="link">Index↗</a>
        <a href="#about" data-cursor="link">About↗</a>
        <a href="#contact" data-cursor="link">Contact↗</a>
      </nav>
    </div>);

}

// ─── Hero feature — typographic "now playing" ticker ──────────────────────
// Replaces the literal video-recording frame metaphor with a centered
// rotating type panel: italic verb + huge Archivo project title + mono meta.
function ReelLoop() {
  const items = useMemoP(() => [
    { verb: "Editing",   title: "Nightshift",     meta: "Aria Volk · Music Video · 2026" },
    { verb: "Coloring",  title: "Alpine",         meta: "Trend Atelier · Brand Film · 2025" },
    { verb: "Cutting",   title: "Saltwater",      meta: "IDFA Selected · Documentary · 2025" },
    { verb: "Designing", title: "The Troubadour", meta: "Identity → Film → Merch · 2024 — 26" },
    { verb: "Drawing",   title: "Echo Chamber",   meta: "Slip Festival · Motion / VFX · 2025" },
    { verb: "Stitching", title: "Loud / Quiet",   meta: "Polarities · Album Art · 2024" },
    { verb: "Pressing",  title: "Heatwave",       meta: "Bakery · Identity · 2023" },
  ], []);
  const [i, setI] = useStateP(0);

  useEffectP(() => {
    const id = setInterval(() => setI((v) => (v + 1) % items.length), 3000);
    return () => clearInterval(id);
  }, [items.length]);

  return (
    <div className="hero-feat" aria-hidden="true">
      <div className="hf-mast">
        <span className="hf-dot" />
        <span>Now · Reel 06 / 2026</span>
        <span className="hf-rule" />
        <span className="hf-idx">{String(i + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span>
      </div>
      <div className="hf-stack">
        {items.map((it, idx) => (
          <div key={idx} className={"hf-line " + (idx === i ? "is-on" : "")}>
            <span className="hf-verb">{it.verb}<span className="hf-period">.</span></span>
            <span className="hf-title">{it.title}</span>
            <span className="hf-meta">{it.meta}</span>
          </div>
        ))}
      </div>
      <div className="hf-foot">
        <span><span className="hf-arrow">↓</span> Index below</span>
        <span>15 selected · 1 featured</span>
      </div>
    </div>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <header className="hero">
      <div className="hero-grid" />

      <div className="hero-stage">
        <div className="name-row top">
          <span className="big">Lea</span>
        </div>

        <ReelLoop />

        <div className="name-row bot">
          <span className="big">Co<span className="name-dot" />senza<span className="ital">.</span></span>
        </div>
      </div>

      <Marquee />
    </header>);

}

function Marquee() {
  // Two copies to allow seamless -50% loop
  const items = MARQUEE_TERMS;
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        <span>{items.map((it, i) => <span key={i}>{it}</span>)}</span>
        <span>{items.map((it, i) => <span key={"b" + i}>{it}</span>)}</span>
      </div>
    </div>);

}

// ─── Project Index ─────────────────────────────────────────────────────────
function Index({ onOpen, density, onCreate }) {
  const [filter, setFilter] = useStateP("all");
  const [hover, setHover] = useStateP(null); // {project, x, y, idx}
  const containerRef = useRefP(null);

  // The standard index excludes the featured project (rendered in its own spotlight)
  const indexed = useMemoP(() => PROJECTS.filter((p) => !p.featured), []);
  const filtered = useMemoP(
    () => filter === "all" ? indexed : indexed.filter((p) => p.disc === filter),
    [filter, indexed]
  );

  // Count per discipline
  const counts = useMemoP(() => {
    const c = {};
    DISCIPLINES.forEach((d) => {
      c[d.id] = d.id === "all" ? indexed.length : indexed.filter((p) => p.disc === d.id).length;
    });
    return c;
  }, [indexed]);

  return (
    <section id="index" style={{ paddingTop: 100 }}>
      <div className="sec-head">
        <span>§01 — Index</span>
        <h2>The rest of the work, <em>2022 — 26.</em></h2>
        <span>{String(filtered.length).padStart(2, "0")} works</span>
      </div>

      <div className={"idx" + (density === "compact" ? " is-compact" : "")} ref={containerRef} style={{ marginTop: 32 }}>
        {filtered.map((p, i) => {
          const idx = filtered.indexOf(p);
          return (
            <IndexRow
              key={p.id}
              project={p}
              onOpen={() => onOpen(p)}
              onHover={(x, y, rect) => {
                // Compute scrub frame index from cursor x within row
                let frac = 0;
                if (rect) {
                  frac = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
                }
                setHover({ project: p, x, y, frac });
              }}
              onLeave={() => setHover(null)} />);


        })}
      </div>

      {onCreate && (
        <button className="idx-create" onClick={onCreate} data-cursor="link">
          <span>+ Add a new case study</span>
          <span className="idx-create-hint">Opens straight into the editor</span>
        </button>
      )}

      <Scrub hover={hover} />
    </section>);

}

function IndexRow({ project, onOpen, onHover, onLeave }) {
  const ref = useRefP(null);
  return (
    <div
      ref={ref}
      className="row"
      data-cursor="play"
      onClick={onOpen}
      onMouseMove={(e) => {
        const rect = ref.current && ref.current.getBoundingClientRect();
        onHover(e.clientX, e.clientY, rect);
      }}
      onMouseLeave={onLeave}>
      
      <div className="num">{project.n}</div>
      <div className="ttl">
        <span className="ttl-wrap">
          <span>{project.title}</span>
          <span className="ttl-fx" aria-hidden="true">{project.title}</span>
        </span>
        <span className="yr">/ {project.year}</span>
        <span className="arrow" style={{ color: "var(--accent)", fontSize: ".42em" }}>↗</span>
      </div>
      <div className="cli">{project.client}</div>
      <div className="disc">{project.discLabel}</div>
    </div>);

}

function Scrub({ hover }) {
  if (!hover) return null;
  const { project, x, y, frac } = hover;
  const frames = project.scrubs || [];
  const idx = Math.min(frames.length - 1, Math.floor(frac * frames.length));
  const f = frames[idx] || { c1: "#1a1a1a", c2: "#0a0a0a" };
  // Position: offset slightly above-right of cursor, but clamp to viewport
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const left = Math.min(vw - 160, Math.max(160, x + 160));
  const top = Math.max(120, y - 60);
  // Build a fake timecode for the frame
  const tc = `${String(idx + 1).padStart(2, "0")}/${String(frames.length).padStart(2, "0")} · ${project.runtime}`;

  return (
    <div className="scrub is-on" style={{ left, top }}>
      <Placeholder c1={f.c1} c2={f.c2} label={project.title.toUpperCase()} lbl2={project.discLabel} />
      <div className="scrub-tc">{tc}</div>
      <div className="scrub-bar"><div className="fill" style={{ width: `${(idx + 1) / frames.length * 100}%` }} /></div>
    </div>);

}

// ─── About ─────────────────────────────────────────────────────────────────
function About() {
  return (
    <section id="about" style={{ paddingTop: 60 }}>
      <div className="sec-head">
        <span>§02 — About</span>
        <h2>The <em>brief</em>, briefly.</h2>
        <span>EST. 2019</span>
      </div>
      <div className="about" style={{ paddingTop: 40 }}>
        <p className="lede">
          <mark>Lea Cosenza</mark> — editor and designer between Bristol and Milan.
          Most of what I do is <em>quiet</em>. The rest is loud on purpose.
        </p>
        <dl className="meta">
          <dt>Tools</dt><dd>Avid · DaVinci Resolve · After Effects · InDesign</dd>
          <dt>Selected for</dt><dd>IDFA '25 · Slip Festival '24</dd>
          <dt>Rate</dt><dd>On request</dd>
        </dl>
      </div>
    </section>);

}

// ─── Footer ────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer id="contact">
      <div className="sec-head" style={{ border: 0, paddingBottom: 16 }}>
        <span>§03 — Contact</span>
        <h2>Say <em>hello</em>.</h2>
        <span>Replies within 24h</span>
      </div>
      <h1 className="foot-name" aria-label="Lea Cosenza">
        Lea&nbsp;
        <span className="stroke">Co</span>senza
      </h1>
      <div className="foot-grid">
        <div>
          <h4>Direct</h4>
          <a href="mailto:hello@leacosenza.studio" data-cursor="link">hello@leacosenza.studio↗</a>
          <a href="admin.html" data-cursor="link">Admin ⚙</a>
        </div>
        <div>
          <h4>Elsewhere</h4>
          <a href="#" data-cursor="link">Vimeo↗</a>
          <a href="#" data-cursor="link">Instagram↗</a>
          <a href="#" data-cursor="link">Are.na↗</a>
        </div>
      </div>
      <div className="colophon">
        <span>© 2019 — 2026 · Lea Cosenza Studio</span>
        <span>Bristol · Milan</span>
      </div>
    </footer>);

}

// ─── Featured spotlight (multi-medium project) ────────────────────────────
function Featured({ project, onOpen }) {
  if (!project) return null;
  const p = project;
  return (
    <section id="featured" style={{ paddingTop: 110, paddingBottom: 30 }}>
      <div className="sec-head">
        <span>§00 — Selected</span>
        <h2>Featured <em>spotlight.</em></h2>
        <span>N° 00 / 15</span>
      </div>

      <div className="ft-title">
        <h3 className="ft-h">{p.title}<em>.</em></h3>
        <p className="ft-lede">Eighteen months. <em>Eight disciplines.</em> One client.</p>
      </div>

      <div className="ft-grid" data-cursor="play" onClick={() => onOpen(p)}>
        <div className="ft-cell ft-hero">
          <Placeholder c1={p.palette[0].c1} c2={p.palette[0].c2} label="A — Film · Residency" lbl2="2.39:1 · 04:12" />
          <div className="ft-hero-tc">
            <span className="rec" />REC · 04:12 · 23.976
          </div>
        </div>
        <div className="ft-cell ft-a">
          <Placeholder c1={p.palette[1].c1} c2={p.palette[1].c2} label="B — Identity · Marquee wide" />
        </div>
        <div className="ft-cell ft-b">
          <Placeholder c1={p.palette[4].c1} c2={p.palette[4].c2} label="C — Print · Poster 06/24" />
        </div>
        <div className="ft-cell ft-c">
          <Placeholder c1={p.palette[3].c1} c2={p.palette[3].c2} label="D — Merch · Drop 01" />
        </div>
        <div className="ft-cell ft-cta">
          <div className="ft-cta-inner">
            <span className="ft-cta-l">Read the case study</span>
            <span className="ft-cta-r">→</span>
          </div>
        </div>
      </div>
    </section>);

}

Object.assign(window, { Topbar, Hero, Index, About, Footer, ReelLoop, Marquee, Featured });