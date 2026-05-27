// app.jsx — root, tweaks, mounting
const { useState: useStateA, useEffect: useEffectA, useRef: useRefA, useCallback: useCallbackA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#ff3b1f",
  "cursor": "play",
  "density": "regular",
  "mode": "paper",
  "easter": true,
  "reelTakeover": false
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [openIdx, setOpenIdx] = useStateA(null);
  const [reelOn, setReelOn] = useStateA(false);
  // Bumps when project data is edited inline — forces re-renders that depend on PROJECTS.
  const [, bump] = useStateA(0);
  // When set, the next case-study render opens straight into edit mode (used for fresh creates).
  const [initialEditing, setInitialEditing] = useStateA(false);

  // Sync accent + mode to CSS vars / body classes
  useEffectA(() => {
    document.documentElement.style.setProperty("--accent", t.accent);
  }, [t.accent]);
  useEffectA(() => {
    document.body.classList.toggle("dark", t.mode === "dark");
    document.body.classList.toggle("compact", t.density === "compact");
  }, [t.mode, t.density]);

  const openProject = (p) => {
    const i = PROJECTS.findIndex((x) => x.id === p.id);
    setInitialEditing(false);
    setOpenIdx(i);
  };
  const closeProject = () => {
    setOpenIdx(null);
    setInitialEditing(false);
  };
  const nextProject = () => {
    if (openIdx === null) return;
    setOpenIdx((openIdx + 1) % PROJECTS.length);
    setInitialEditing(false);
  };

  // Save inline-edited project: replace it in PROJECTS, persist, force re-render.
  const saveProject = useCallbackA((edited) => {
    const i = PROJECTS.findIndex((p) => p.id === edited.id);
    if (i < 0) return;
    PROJECTS[i] = edited;
    if (window.saveStoredProjects) window.saveStoredProjects();
    bump((n) => n + 1);
  }, []);

  // Create a blank project, append to PROJECTS, open in case-study edit mode.
  const createProject = useCallbackA(() => {
    const id = "new-" + Date.now().toString(36);
    const indexed = PROJECTS.filter((p) => !p.featured);
    const n = String(indexed.length + 1).padStart(2, "0");
    const blank = {
      id, n,
      title: "Untitled project",
      year: String(new Date().getFullYear()),
      client: "Client",
      disc: "mv",
      discLabel: "Music Video",
      runtime: "0:00",
      ratio: "16:9",
      brief: "Tell me what this project is — a sentence or two about the brief, the format, what was made.",
      role: "Editor",
      credits: [["Director", ""], ["Editor", "Lea Cosenza"]],
      quote: { text: "A quote about the project.", source: "Source" },
      palette: Array.from({ length: 6 }, (_, i) => ({
        c1: "#1a1a1a", c2: "#0a0a0a", label: `FRAME ${String(i + 1).padStart(2, "0")}`,
      })),
      scrubs: Array.from({ length: 5 }, () => ({ c1: "#1a1a1a", c2: "#0a0a0a" })),
    };
    PROJECTS.push(blank);
    if (window.saveStoredProjects) window.saveStoredProjects();
    setInitialEditing(true);
    setOpenIdx(PROJECTS.length - 1);
    bump((n) => n + 1);
  }, []);

  // Delete the open project after confirmation.
  const deleteProject = useCallbackA((proj) => {
    if (!proj) return;
    if (!confirm(`Delete "${proj.title}"? This cannot be undone.`)) return;
    const i = PROJECTS.findIndex((p) => p.id === proj.id);
    if (i < 0) return;
    PROJECTS.splice(i, 1);
    if (window.saveStoredProjects) window.saveStoredProjects();
    setOpenIdx(null);
    setInitialEditing(false);
    bump((n) => n + 1);
  }, []);

  const triggerReel = useCallbackA(() => {
    setReelOn(true);
    setTimeout(() => setReelOn(false), 4200);
  }, []);

  const project = openIdx !== null ? PROJECTS[openIdx] : null;
  const next = openIdx !== null ? PROJECTS[(openIdx + 1) % PROJECTS.length] : null;

  // Featured project is the one marked featured:true; the standard index hides it.
  const featuredProject = PROJECTS.find((p) => p.featured);

  return (
    <React.Fragment>
      <Topbar />
      <Hero />
      <Featured project={featuredProject} onOpen={openProject} />
      <Index onOpen={openProject} density={t.density} onCreate={createProject} />
      <About />
      <Footer />

      <Cursor mode={t.cursor} />
      <EasterEggs enabled={t.easter} onTriggerReel={triggerReel} />

      <CaseStudy project={project} nextProject={next} onClose={closeProject} onNext={nextProject} onSaveProject={saveProject} onDelete={deleteProject} initialEditing={initialEditing} />

      <ReelTakeover on={reelOn} />

      <TweaksPanel>
        <TweakSection label="Surface" />
        <TweakRadio label="Mode" value={t.mode} options={["paper", "dark"]} onChange={(v) => setTweak("mode", v)} />
        <TweakRadio label="Density" value={t.density} options={["regular", "compact"]} onChange={(v) => setTweak("density", v)} />

        <TweakSection label="Accent" />
        <TweakColor label="Signal" value={t.accent}
          options={["#ff3b1f", "#1f6bff", "#00b86b", "#ffd400", "#161412"]}
          onChange={(v) => setTweak("accent", v)} />

        <TweakSection label="Cursor" />
        <TweakRadio label="Mode" value={t.cursor}
          options={["play", "minimal", "off"]}
          onChange={(v) => setTweak("cursor", v)} />

        <TweakSection label="Easter eggs" />
        <TweakToggle label="Hotkeys enabled" value={t.easter} onChange={(v) => setTweak("easter", v)} />
        <TweakButton label="Play reel takeover ▶" onClick={triggerReel} />
      </TweaksPanel>
    </React.Fragment>
  );
}

// ─── Reel takeover (easter egg) ─────────────────────────────────────────────
function ReelTakeover({ on }) {
  const [tc, setTc] = useStateA("00:00:00:00");
  useEffectA(() => {
    if (!on) return;
    let f = 0;
    const id = setInterval(() => {
      f = (f + 1);
      const fr = f % 24;
      const s = Math.floor(f / 24) % 60;
      const m = Math.floor(f / (24 * 60)) % 60;
      const pad = (n) => String(n).padStart(2, "0");
      setTc(`00:${pad(m)}:${pad(s)}:${pad(fr)}`);
    }, 42);
    return () => clearInterval(id);
  }, [on]);

  const seq = [
    { c1: "#ff3b1f", c2: "#7a1208" },
    { c1: "#1a1f3a", c2: "#070b1f" },
    { c1: "#e3dccd", c2: "#9c9486" },
    { c1: "#5a3a7a", c2: "#241a3a" },
    { c1: "#2a4a6a", c2: "#0e1e2e" },
    { c1: "#c4a880", c2: "#6e5c42" },
  ];
  const [i, setI] = useStateA(0);
  useEffectA(() => {
    if (!on) return;
    setI(0);
    const id = setInterval(() => setI((v) => (v + 1) % seq.length), 700);
    return () => clearInterval(id);
  }, [on]);

  if (!on) return null;
  const f = seq[i];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9995, background: "#000",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "rtFadeIn .25s ease",
    }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <Placeholder c1={f.c1} c2={f.c2} />
      </div>
      <div style={{
        position: "absolute", top: 18, left: 18, right: 18,
        display: "flex", justifyContent: "space-between",
        fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#fff",
        mixBlendMode: "difference", letterSpacing: ".08em", textTransform: "uppercase",
      }}>
        <span><span style={{ display: "inline-block", width: 8, height: 8, background: "#ff3b1f", borderRadius: "50%", marginRight: 8, verticalAlign: "middle" }} />REC · 23.976 · A.CAM</span>
        <span>REEL — Selects 2026</span>
        <span>{tc}</span>
      </div>
      <div style={{
        position: "absolute", left: 32, bottom: 60, right: 32,
        fontFamily: "Archivo, sans-serif", fontWeight: 900,
        fontSize: "clamp(40px, 8vw, 140px)", lineHeight: 0.86,
        letterSpacing: "-0.04em", textTransform: "uppercase",
        color: "#fff", mixBlendMode: "difference",
      }}>
        Cut №{String(i + 1).padStart(2, "0")} <span style={{ fontFamily: "Instrument Serif, serif", fontStyle: "italic", fontWeight: 400, color: "#ff3b1f" }}>/</span> {["Nightshift", "Alpine", "Saltwater", "Midnight Set", "Static", "Threadbare"][i]}
      </div>
      <div style={{
        position: "absolute", left: 32, bottom: 24,
        fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#fff",
        mixBlendMode: "difference", letterSpacing: ".06em", textTransform: "uppercase",
      }}>
        Press anything to dismiss · auto-out in 4s
      </div>
      <style>{`@keyframes rtFadeIn{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
