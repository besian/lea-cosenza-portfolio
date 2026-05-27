// cursor.jsx — custom cursor + easter-egg overlay
const { useState, useEffect, useRef } = React;

function Cursor({ mode = "dot", easter = true }) {
  const ref = useRef(null);
  const [variant, setVariant] = useState("dot"); // dot | link | play | press | hidden
  const [pressed, setPressed] = useState(false);

  // Position via direct DOM writes to avoid React re-renders every mousemove
  useEffect(() => {
    if (mode === "off") return;
    const el = ref.current;
    if (!el) return;
    let raf = 0, tx = 0, ty = 0, x = 0, y = 0;
    const onMove = (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const tick = () => {
      raf = 0;
      // tiny ease for the dot
      x += (tx - x) * 0.6;
      y += (ty - y) * 0.6;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)${pressed ? " scale(.55)" : ""}`;
    };
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("mousemove", onMove); if (raf) cancelAnimationFrame(raf); };
  }, [mode, pressed]);

  // Hover detection — set variant based on what the cursor is over
  useEffect(() => {
    if (mode === "off") return;
    const onOver = (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest("[data-cursor='play']")) setVariant("play");
      else if (t.closest("a, button, [data-cursor='link'], .twk-panel *")) setVariant("link");
      else setVariant("dot");
    };
    const onLeave = () => setVariant("hidden");
    const onEnter = () => setVariant("dot");
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
    };
  }, [mode]);

  // Toggle body class for fallback
  useEffect(() => {
    document.body.classList.toggle("no-cursor-custom", mode === "off");
  }, [mode]);

  if (mode === "off") return null;

  // When mode === "play", projects show PLAY ▶ — otherwise dot grows to a circle on links
  const displayVariant = mode === "minimal" && variant === "play" ? "link" : variant;

  const cls = ["cursor"];
  if (displayVariant === "link") cls.push("is-link");
  else if (displayVariant === "play") cls.push("is-play");
  else if (displayVariant === "hidden") cls.push("is-hidden");
  if (pressed) cls.push("is-press");

  return (
    <div ref={ref} className={cls.join(" ")} aria-hidden="true">
      {displayVariant === "play" && <span>Play&nbsp;▶</span>}
    </div>
  );
}

// ─── Easter eggs ────────────────────────────────────────────────────────────
function EasterEggs({ enabled, onTriggerReel }) {
  const [flash, setFlash] = useState(false);
  const [kona, setKona] = useState(false);
  const buf = useRef("");
  const seq = useRef([]);

  useEffect(() => {
    if (!enabled) return;
    const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];

    const onKey = (e) => {
      // Ignore typing into inputs
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;

      // P → film flash cut
      if (e.key.toLowerCase() === "p" && !e.metaKey && !e.ctrlKey) {
        setFlash(true);
        setTimeout(() => setFlash(false), 110);
      }

      // Buffer letters for "REEL"
      const k = e.key.toLowerCase();
      if (/^[a-z]$/.test(k)) {
        buf.current = (buf.current + k).slice(-4);
        if (buf.current === "reel") {
          buf.current = "";
          onTriggerReel && onTriggerReel();
        }
      }

      // Konami sequence
      seq.current = [...seq.current, e.key].slice(-KONAMI.length);
      if (seq.current.length === KONAMI.length && seq.current.every((v, i) => v === KONAMI[i])) {
        seq.current = [];
        setKona(true);
        setTimeout(() => setKona(false), 2600);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, onTriggerReel]);

  return (
    <React.Fragment>
      <div className={"flash" + (flash ? " is-on" : "")} />
      <div className={"konami" + (kona ? " is-on" : "")}>
        <div className="ttl">Cut. Print.</div>
        <div className="sub">▲▲▼▼◀▶◀▶BA — Color grade unlocked</div>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { Cursor, EasterEggs });
