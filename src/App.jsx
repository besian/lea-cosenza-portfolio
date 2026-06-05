import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { subscribeProjects, saveProject as saveToFirestore } from './firestore';
import { getProjects } from './data';
import { Cursor, EasterEggs } from './components/Cursor';
import { CaseStudy } from './components/CaseStudy';
import { Topbar, Hero, Featured, Index, About, Footer } from './components/Portfolio';
import { TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle, TweakButton, useTweaks } from './components/TweaksPanel';
import './styles.css';

const TWEAK_DEFAULTS = {
  accent: "#ff3b1f",
  cursor: "play",
  density: "regular",
  mode: "paper",
  easter: true,
};

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [projects, setProjects] = useState(() => getProjects());
  const [authUser, setAuthUser] = useState(null);
  const [openIdx, setOpenIdx] = useState(null);
  const [reelOn, setReelOn] = useState(false);
  const [initialEditing, setInitialEditing] = useState(false);

  // Real-time Firestore subscription
  useEffect(() => subscribeProjects(setProjects), []);

  // Auth state (controls whether Edit button shows on case studies)
  useEffect(() => onAuthStateChanged(auth, setAuthUser), []);

  // Sync accent + mode to CSS vars / body classes
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", t.accent);
  }, [t.accent]);
  useEffect(() => {
    document.body.classList.toggle("dark", t.mode === "dark");
    document.body.classList.toggle("compact", t.density === "compact");
  }, [t.mode, t.density]);

  const openProject = (p) => {
    const i = projects.findIndex(x => x.id === p.id);
    setInitialEditing(false);
    setOpenIdx(i);
  };
  const closeProject = () => {
    setOpenIdx(null);
    setInitialEditing(false);
  };
  const nextProject = () => {
    if (openIdx === null) return;
    setOpenIdx((openIdx + 1) % projects.length);
    setInitialEditing(false);
  };

  const saveProject = useCallback(async (edited) => {
    setProjects(prev => prev.map(p => p.id === edited.id ? edited : p));
    await saveToFirestore(edited);
  }, []);

  const createProject = useCallback(() => {
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
      brief: 'Tell me what this project is — a sentence or two about the brief, the format, what was made.',
      role: 'Editor',
      credits: [['Director', ''], ['Editor', 'Lea Cosenza']],
      quote: { text: 'A quote about the project.', source: 'Source' },
      palette: Array.from({ length: 6 }, (_, i) => ({
        c1: '#1a1a1a', c2: '#0a0a0a', label: `FRAME ${String(i + 1).padStart(2, '0')}`,
      })),
      scrubs: Array.from({ length: 5 }, () => ({ c1: '#1a1a1a', c2: '#0a0a0a' })),
    };
    setProjects(prev => [...prev, blank]);
    setInitialEditing(true);
    setOpenIdx(projects.length);
  }, [projects]);

  const deleteProject = useCallback(async (proj) => {
    if (!proj) return;
    if (!confirm(`Delete "${proj.title}"? This cannot be undone.`)) return;
    const { removeProject } = await import('./firestore');
    await removeProject(proj.id);
    setProjects(prev => prev.filter(p => p.id !== proj.id));
    setOpenIdx(null);
    setInitialEditing(false);
  }, []);

  const triggerReel = useCallback(() => {
    setReelOn(true);
    setTimeout(() => setReelOn(false), 4200);
  }, []);

  const project = openIdx !== null ? projects[openIdx] : null;
  const next = openIdx !== null ? projects[(openIdx + 1) % projects.length] : null;
  const featuredProject = projects.find(p => p.featured);

  return (
    <>
      <Topbar mode={t.mode} onToggleMode={() => setTweak("mode", t.mode === "dark" ? "paper" : "dark")} />
      <Hero />
      <Featured project={featuredProject} onOpen={openProject} />
      <Index projects={projects} onOpen={openProject} density={t.density} onCreate={authUser ? createProject : null} />
      <About />
      <Footer />

      <Cursor mode={t.cursor} />
      <EasterEggs enabled={t.easter} onTriggerReel={triggerReel} />

      <CaseStudy
        project={project}
        nextProject={next}
        onClose={closeProject}
        onNext={nextProject}
        onSaveProject={saveProject}
        onDelete={authUser ? deleteProject : null}
        initialEditing={initialEditing}
        canEdit={!!authUser}
      />

      {reelOn && <ReelTakeover />}

      <TweaksPanel>
        <TweakSection label="Surface" />
        <TweakRadio label="Mode" value={t.mode} options={["paper","dark"]} onChange={v => setTweak("mode", v)} />
        <TweakRadio label="Density" value={t.density} options={["regular","compact"]} onChange={v => setTweak("density", v)} />

        <TweakSection label="Accent" />
        <TweakColor label="Signal" value={t.accent}
          options={["#ff3b1f","#1f6bff","#00b86b","#ffd400","#161412"]}
          onChange={v => setTweak("accent", v)} />

        <TweakSection label="Cursor" />
        <TweakRadio label="Mode" value={t.cursor}
          options={["play","minimal","off"]}
          onChange={v => setTweak("cursor", v)} />

        <TweakSection label="Easter eggs" />
        <TweakToggle label="Hotkeys enabled" value={t.easter} onChange={v => setTweak("easter", v)} />
        <TweakButton label="Play reel takeover ▶" onClick={triggerReel} />
      </TweaksPanel>
    </>
  );
}

// ─── Reel takeover ───────────────────────────────────────────────────────────
function ReelTakeover() {
  const [tc, setTc] = useState("00:00:00:00");
  useEffect(() => {
    let f = 0;
    const id = setInterval(() => {
      f++;
      const fr = f % 24;
      const s = Math.floor(f / 24) % 60;
      const m = Math.floor(f / (24 * 60)) % 60;
      const pad = n => String(n).padStart(2, '0');
      setTc(`00:${pad(m)}:${pad(s)}:${pad(fr)}`);
    }, 42);
    return () => clearInterval(id);
  }, []);

  const seq = [
    { c1:"#ff3b1f", c2:"#7a1208" },
    { c1:"#1a1f3a", c2:"#070b1f" },
    { c1:"#e3dccd", c2:"#9c9486" },
    { c1:"#5a3a7a", c2:"#241a3a" },
    { c1:"#2a4a6a", c2:"#0e1e2e" },
    { c1:"#c4a880", c2:"#6e5c42" },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    const id = setInterval(() => setI(v => (v + 1) % seq.length), 700);
    return () => clearInterval(id);
  }, []);

  const f = seq[i];
  const titles = ["Nightshift","Alpine","Saltwater","Midnight Set","Static","Threadbare"];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9995, background:"#000", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ position:"absolute", inset:0 }}>
        <div className="ph" style={{ "--c1":f.c1, "--c2":f.c2, position:"absolute", inset:0 }} />
      </div>
      <div style={{ position:"absolute", top:18, left:18, right:18, display:"flex", justifyContent:"space-between", fontFamily:"JetBrains Mono, monospace", fontSize:12, color:"#fff", mixBlendMode:"difference", letterSpacing:".08em", textTransform:"uppercase" }}>
        <span><span style={{ display:"inline-block", width:8, height:8, background:"#ff3b1f", borderRadius:"50%", marginRight:8, verticalAlign:"middle" }} />REC · 23.976 · A.CAM</span>
        <span>REEL — Selects 2026</span>
        <span>{tc}</span>
      </div>
      <div style={{ position:"absolute", left:32, bottom:60, right:32, fontFamily:"Archivo, sans-serif", fontWeight:900, fontSize:"clamp(40px, 8vw, 140px)", lineHeight:0.86, letterSpacing:"-0.04em", textTransform:"uppercase", color:"#fff", mixBlendMode:"difference" }}>
        Cut №{String(i + 1).padStart(2, '0')} <span style={{ fontFamily:"Instrument Serif, serif", fontStyle:"italic", fontWeight:400, color:"#ff3b1f" }}>/</span> {titles[i]}
      </div>
      <div style={{ position:"absolute", left:32, bottom:24, fontFamily:"JetBrains Mono, monospace", fontSize:11, color:"#fff", mixBlendMode:"difference", letterSpacing:".06em", textTransform:"uppercase" }}>
        Press anything to dismiss · auto-out in 4s
      </div>
    </div>
  );
}
