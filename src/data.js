// data.js — project + filter data

export const DISCIPLINES = [
  { id:"all",  label:"All Work" },
  { id:"mv",   label:"Music Video" },
  { id:"com",  label:"Commercial" },
  { id:"doc",  label:"Documentary" },
  { id:"mg",   label:"Motion / VFX" },
  { id:"sf",   label:"Short-Form" },
  { id:"grade",label:"Color" },
  { id:"id",   label:"Identity" },
  { id:"art",  label:"Album Art" },
];

export const MARQUEE_TERMS = [
  "Editing", "Color", "Motion",
  "Identity", "Print", "Available Q3 — 2026",
];

// Each project: id, n, title, year, client, disc(ipline id), discLabel,
// runtime, ratio (format), brief, role, credits[], quote{text,source},
// palette[ {c1,c2,label} ] (six placeholder frames for the modal grid),
// scrubs[ 5 placeholder frames the hover scrub cycles through ]
export const DEFAULT_PROJECTS = [
  {
    id:"troubadour",
    n:"00", title:"The Troubadour", year:"2024 — 26",
    client:"The Troubadour", disc:"all", discLabel:"Selected · Multi-medium",
    runtime:"18 mo", ratio:"Identity → Film → Merch",
    featured:true,
    brief:"A multi-medium body of work made across eighteen months — a touring identity for a live music room, plus everything it touches. Three short films, a poster series, a wordmark and type system, monthly programme spreads, two run-of-merch drops, projection visuals, and the bar/menu/ticket print. One client, one tone of voice, eight separate disciplines stitched together.",
    role:"Lead Editor / Designer / Color",
    credits:[
      ["Client","The Troubadour"],
      ["Lead design + edit","Lea Cosenza"],
      ["Print production","Risø Bristol"],
      ["Film direction","Roan Pierce, Maya Idris"],
      ["DP (films)","Lior Tan, Niels Korva"],
      ["Garment","Common Run, Berlin"],
      ["Audio mix","Felix Park"],
      ["Photography","Soo Park, Lea Cosenza"],
    ],
    quote:{ text:"Lea built the whole world. The film, the poster, the t-shirt and the wallpaper in the bathroom — and you can tell they all came from the same hand.", source:"The Troubadour, owner" },
    palette:[
      {c1:"#1a1a1a",c2:"#0a0a0a",label:"01 — KEY ART"},
      {c1:"#ff3b1f",c2:"#7a1208",label:"02 — SIGNAL"},
      {c1:"#ece7dd",c2:"#bcb6a8",label:"03 — PAPER"},
      {c1:"#3a2818",c2:"#1a1208",label:"04 — VENUE"},
      {c1:"#ffd400",c2:"#7a6800",label:"05 — POSTER"},
      {c1:"#161412",c2:"#ff3b1f",label:"06 — TKT"},
    ],
    scrubs:[
      {c1:"#1a1a1a",c2:"#0a0a0a"},{c1:"#ff3b1f",c2:"#7a1208"},
      {c1:"#ece7dd",c2:"#bcb6a8"},{c1:"#3a2818",c2:"#1a1208"},
      {c1:"#ffd400",c2:"#7a6800"},
    ],
    sections:[
      {
        kind:"films",
        h:"The films — Three short cuts",
        copy:"Three short films — a 4-minute residency portrait, a 90-second open-mic loop, and a 30-second seasonal trailer cut twelve different ways for socials.",
        items:[
          {title:"Residency", runtime:"4:12", ratio:"2.39:1", c1:"#3a2818", c2:"#1a1208", lbl:"FILM 01 — A.CAM"},
          {title:"Open Mic", runtime:"1:30", ratio:"16:9", c1:"#ff3b1f", c2:"#7a1208", lbl:"FILM 02 — LOOP"},
          {title:"Season Trailer", runtime:"0:30", ratio:"9:16", c1:"#1a1a1a", c2:"#0a0a0a", lbl:"FILM 03 — SOCIAL"},
        ],
      },
      {
        kind:"identity",
        h:"Identity — A wordmark with three voices",
        copy:"A wordmark drawn three ways — a tight version for ticket stubs, a wide version for the marquee, and a hand-set serif for the printed monthly programme. Each one shipped with rules for when to use which.",
        items:[
          {title:"Wordmark / tight", c1:"#161412", c2:"#0a0908", lbl:"MARK A — TICKET"},
          {title:"Wordmark / wide", c1:"#ece7dd", c2:"#bcb6a8", lbl:"MARK B — MARQUEE"},
          {title:"Serif lockup", c1:"#3a2818", c2:"#1a1208", lbl:"MARK C — PROGRAMME"},
          {title:"Stamp mark", c1:"#ff3b1f", c2:"#161412", lbl:"MARK D — STAMP"},
        ],
      },
      {
        kind:"posters",
        h:"Posters — Eighteen months, one grid",
        copy:"A single 700×1000 risograph poster grid, redrawn every month for eighteen months. Same composition logic, different colourway, different headliner. Pinned in the venue, fly-posted across town.",
        items:[
          {c1:"#ff3b1f", c2:"#161412", lbl:"05 / 2024 — JUN"},
          {c1:"#ffd400", c2:"#161412", lbl:"06 / 2024 — JUL"},
          {c1:"#1f6bff", c2:"#ece7dd", lbl:"07 / 2024 — AUG"},
          {c1:"#00b86b", c2:"#161412", lbl:"08 / 2024 — SEP"},
          {c1:"#ece7dd", c2:"#ff3b1f", lbl:"09 / 2024 — OCT"},
          {c1:"#161412", c2:"#ffd400", lbl:"10 / 2024 — NOV"},
          {c1:"#7a1aff", c2:"#ece7dd", lbl:"11 / 2024 — DEC"},
          {c1:"#3a2818", c2:"#ffd400", lbl:"12 / 2024 — JAN"},
        ],
      },
      {
        kind:"merch",
        h:"Merch — Two drops, one wardrobe",
        copy:"Two run-of-merch drops — a winter capsule (heavyweight tee, beanie, tote, enamel pin) and a summer capsule (light tee, cap, tote, sticker pack). Print direct-to-garment, screen-print where it earned it. Sold in venue and online.",
        items:[
          {title:"Heavy tee — Winter", c1:"#161412", c2:"#0a0908", lbl:"DROP 01 / TEE"},
          {title:"Beanie", c1:"#3a2818", c2:"#1a1208", lbl:"DROP 01 / BEAN"},
          {title:"Tote — natural", c1:"#ece7dd", c2:"#bcb6a8", lbl:"DROP 01 / TOTE"},
          {title:"Enamel pin", c1:"#ff3b1f", c2:"#7a1208", lbl:"DROP 01 / PIN"},
          {title:"Light tee — Summer", c1:"#ece7dd", c2:"#bcb6a8", lbl:"DROP 02 / TEE"},
          {title:"Cap", c1:"#ffd400", c2:"#7a6800", lbl:"DROP 02 / CAP"},
          {title:"Tote — yellow", c1:"#ffd400", c2:"#ff3b1f", lbl:"DROP 02 / TOTE"},
          {title:"Stickers", c1:"#1f6bff", c2:"#ece7dd", lbl:"DROP 02 / PACK"},
        ],
      },
      {
        kind:"print",
        h:"Print — Programme, ticket, menu, signage",
        copy:"A monthly 16-page risograph programme, perforated tickets, a bar menu, sandwich-board signage, and an A0 night-of-show poster grid. Set in a single type system across every surface.",
        items:[
          {title:"Programme spread", c1:"#ece7dd", c2:"#3a2818", lbl:"PRINT / PROG"},
          {title:"Ticket stub", c1:"#161412", c2:"#ff3b1f", lbl:"PRINT / TKT"},
          {title:"Bar menu", c1:"#3a2818", c2:"#ece7dd", lbl:"PRINT / BAR"},
          {title:"Signage", c1:"#ff3b1f", c2:"#161412", lbl:"PRINT / SIGN"},
        ],
      },
    ],
    stats:[
      ["Films delivered","03"],
      ["Posters drawn","18"],
      ["Merch SKUs","16"],
      ["Programme issues","18"],
      ["Print runs","42"],
      ["Months","18"],
    ],
  },
  {
    id:"nightshift",
    n:"01", title:"Nightshift", year:"2026",
    client:"Aria Volk", disc:"mv", discLabel:"Music Video",
    runtime:"3:42", ratio:"2.39:1",
    brief:"A neon-drenched circadian flip about working when the world is asleep. Shot on three city blocks across one 9-hour overnight, cut against the song's pulse so each lyric arrives on a frame change.",
    role:"Editor / Colorist",
    credits:[
      ["Director","Maya Idris"],["DP","Lior Tan"],
      ["Editor","Lea Cosenza"],["Color","Lea Cosenza"],
      ["Sound","Felix Park"],["Production","Half Beat"],
    ],
    quote:{ text:"Lea cut the whole video to a metronome in her head — every cut landed two frames before you knew you wanted one.", source:"Maya Idris, director" },
    palette:[
      {c1:"#1a1f3a",c2:"#0a0e25",label:"01:14:08 — INT taxi"},
      {c1:"#ff3b1f",c2:"#7a1208",label:"01:21:00 — neon"},
      {c1:"#2a3550",c2:"#0f1424",label:"01:33:12 — bridge"},
      {c1:"#ffb13b",c2:"#5a3a08",label:"01:48:02 — diner"},
      {c1:"#0f1b2a",c2:"#02060d",label:"02:04:18 — alley"},
      {c1:"#2a1f3a",c2:"#0e0820",label:"02:19:06 — exit"},
    ],
    scrubs:[
      {c1:"#1a1f3a",c2:"#070b1f"},{c1:"#ff3b1f",c2:"#6a1208"},
      {c1:"#2a3550",c2:"#0f1424"},{c1:"#0f1b2a",c2:"#02060d"},
      {c1:"#ffb13b",c2:"#5a3a08"},
    ],
  },
  {
    id:"saltwater",
    n:"02", title:"Saltwater", year:"2025",
    client:"Self-released", disc:"doc", discLabel:"Documentary",
    runtime:"22:08", ratio:"1.85:1",
    brief:"A 22-minute documentary short about a single mother running the last surviving lido on the Calabrian coast, edited from 47 hours of vérité footage shot across two summers.",
    role:"Editor",
    credits:[["Director","Aoife Ryan"],["DP","Aoife Ryan"],["Editor","Lea Cosenza"],["Sound design","Felix Park"],["Festival","IDFA '25 — Selected"]],
    quote:{text:"The edit found the film. Forty-seven hours of material, and only Lea could see the shape inside it.",source:"Aoife Ryan, director"},
    palette:[
      {c1:"#7aa6c2",c2:"#3a627a",label:"03:14:00 — lido"},
      {c1:"#e8c98a",c2:"#9a7c3a",label:"06:02:00 — kitchen"},
      {c1:"#cfd9d4",c2:"#7a8a82",label:"09:30:00 — pier"},
      {c1:"#1f2a30",c2:"#08111a",label:"12:48:00 — night"},
      {c1:"#a9c5d4",c2:"#5a7382",label:"16:20:00 — swim"},
      {c1:"#d8b27a",c2:"#806240",label:"21:14:00 — close"},
    ],
    scrubs:[
      {c1:"#7aa6c2",c2:"#3a627a"},{c1:"#e8c98a",c2:"#9a7c3a"},
      {c1:"#cfd9d4",c2:"#7a8a82"},{c1:"#a9c5d4",c2:"#5a7382"},
      {c1:"#d8b27a",c2:"#806240"},
    ],
  },
  {
    id:"loudquiet",
    n:"03", title:"Loud / Quiet", year:"2024",
    client:"Polarities Records", disc:"art", discLabel:"Album Art",
    runtime:"—", ratio:"1:1",
    brief:"A four-cover series for a split LP — two artists, two halves, one continuous gradient that only completes when both sleeves sit side by side.",
    role:"Art Director / Designer",
    credits:[["Label","Polarities Records"],["Design","Lea Cosenza"],["Photo","Soo Park"]],
    quote:{text:"Lea understands that a record sleeve has to work at 3 cm and 30 cm.",source:"Polarities Records"},
    palette:[
      {c1:"#ece7dd",c2:"#bcb6a8",label:"SIDE A"},
      {c1:"#161412",c2:"#0a0908",label:"SIDE B"},
      {c1:"#ff3b1f",c2:"#7a1208",label:"INSERT"},
      {c1:"#ece7dd",c2:"#161412",label:"GATE"},
      {c1:"#9c9486",c2:"#4a4438",label:"INNER"},
      {c1:"#161412",c2:"#ff3b1f",label:"LABEL"},
    ],
    scrubs:[
      {c1:"#ece7dd",c2:"#bcb6a8"},{c1:"#161412",c2:"#0a0908"},
      {c1:"#ff3b1f",c2:"#7a1208"},{c1:"#9c9486",c2:"#4a4438"},
      {c1:"#161412",c2:"#ff3b1f"},
    ],
  },
  {
    id:"heatwave",
    n:"04", title:"Heatwave", year:"2023",
    client:"Heatwave Bakery", disc:"id", discLabel:"Identity",
    runtime:"—", ratio:"—",
    brief:"Identity for an evening-only sourdough bakery in Bristol. Wordmark, signage, paper bags, animated lockup for IG. Drawn around the shape of a slash in their original logo sketch.",
    role:"Designer",
    credits:[["Client","Heatwave"],["Design","Lea Cosenza"]],
    quote:{text:"She redrew the thing five times until the slash sat right.",source:"Heatwave, client"},
    palette:[
      {c1:"#ff3b1f",c2:"#7a1208",label:"PRIMARY"},
      {c1:"#ece7dd",c2:"#bcb6a8",label:"PAPER"},
      {c1:"#161412",c2:"#0a0908",label:"INK"},
      {c1:"#ff3b1f",c2:"#161412",label:"MARK"},
      {c1:"#ece7dd",c2:"#ff3b1f",label:"BAG"},
      {c1:"#161412",c2:"#ece7dd",label:"SIGN"},
    ],
    scrubs:[
      {c1:"#ff3b1f",c2:"#7a1208"},{c1:"#ece7dd",c2:"#bcb6a8"},
      {c1:"#161412",c2:"#0a0908"},{c1:"#ff3b1f",c2:"#161412"},
      {c1:"#ece7dd",c2:"#ff3b1f"},
    ],
  },
];

// ─── Section templates ───────────────────────────────────────────────────────
export const SECTION_TEMPLATES = {
  text:     { kind:"text",     h:"A heading",       copy:"Write a paragraph here. A plain prose block — no media.", items:[] },
  image:    { kind:"image",    h:"Images",          copy:"Optional caption or context.", items:[{ c1:"#3a2818", c2:"#1a1208", lbl:"IMAGE", title:"", url:"" }] },
  video:    { kind:"video",    h:"Videos",          copy:"Optional context for these clips.", items:[{ c1:"#1a1a1a", c2:"#0a0a0a", lbl:"VIDEO", title:"New clip", runtime:"1:00", ratio:"16:9", url:"" }] },
  films:    { kind:"films",    h:"Films",           copy:"Short description of this set of films.", items:[{ title:"New film", runtime:"1:00", ratio:"16:9", c1:"#1a1a1a", c2:"#0a0a0a", lbl:"FILM 01 — A.CAM", url:"" }] },
  identity: { kind:"identity", h:"Identity",        copy:"Wordmarks, lockups, stamps.", items:[{ title:"Wordmark", c1:"#161412", c2:"#0a0908", lbl:"MARK A", url:"" }] },
  posters:  { kind:"posters",  h:"Posters",         copy:"Series, monthly grid, etc.", items:[{ c1:"#ff3b1f", c2:"#161412", lbl:"POSTER 01", url:"" }] },
  merch:    { kind:"merch",    h:"Merch",           copy:"Run-of-merch drops.", items:[{ title:"New item", c1:"#161412", c2:"#0a0908", lbl:"DROP / ITEM", url:"" }] },
  print:    { kind:"print",    h:"Print",           copy:"Programmes, tickets, menus, signage.", items:[{ title:"New piece", c1:"#ece7dd", c2:"#3a2818", lbl:"PRINT", url:"" }] },
};
export const SECTION_TYPES = Object.keys(SECTION_TEMPLATES);

const LS_KEY = "lc:projects";

export function loadStoredProjects() {
  try {
    const raw = typeof localStorage !== "undefined" && localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

export function saveStoredProjects(projects) {
  let arr = projects;
  if (!Array.isArray(arr)) arr = Object.values(arr);
  try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch (e) {}
}

export function getProjects() {
  const defaults = DEFAULT_PROJECTS.map(p => ({...p}));
  const stored = loadStoredProjects();
  if (!stored) return defaults;
  if (Array.isArray(stored)) return stored;
  // Old format — merge per-id overrides
  const result = [...defaults];
  Object.entries(stored).forEach(([id, ov]) => {
    const idx = result.findIndex((p) => p.id === id);
    if (idx >= 0) Object.assign(result[idx], ov);
    else result.push(ov);
  });
  return result;
}
