# CampusCompass — Tech Stack Document

**Companion to:** `doc/PROJECT.md`
**Scope:** every technology used in the prototype, why it was chosen, and how the pieces fit together.

---

## 1. Tech stack at a glance

| Layer            | Technology                         | Role                                                 |
|------------------|-------------------------------------|------------------------------------------------------|
| Structure        | **HTML5**                          | Semantic markup for three kiosk views                |
| Presentation     | **CSS3** (variables, Grid, Flex)    | Poster-matched theme, touch targets, animations      |
| Behaviour        | **Vanilla JavaScript (ES2015+)**    | State, events, routing, rendering                    |
| Graphics         | **SVG** (inline, scripted)          | 2D top-down map, route polyline, markers             |
| Algorithm        | **Dijkstra's shortest-path**        | Walking-route computation                            |
| Data modelling   | **Plain JS objects / arrays**       | Building graph (`LAYOUT`, `ROOM_SLOTS`, nodes, edges)|
| Tooling          | **None** (zero build step)          | Files served as-is; no bundler, transpiler, framework|
| Hosting (target) | **GitHub Pages** (or any static host) | Free-tier, matches poster's stated deployment       |

No frameworks. No dependencies. No `package.json`. The entire stack is what a modern browser ships with.

Refactor note:
As of the latest structure cleanup, runtime JavaScript is no longer centered in one large `app.js`. The app is now split into a thin boot file plus focused modules for shared state, demo flow, map rendering, and design-mode editing.

---

## 2. Why this stack (and why *not* a framework)

| Concern                 | Choice                    | Rationale                                                                                      |
|-------------------------|---------------------------|------------------------------------------------------------------------------------------------|
| Kiosk responsiveness    | Vanilla JS                | < 10 KB of JS; no hydration pause; first paint is the final paint.                             |
| Deployment              | Static files              | GitHub Pages / S3 / Netlify all work identically; no server to break.                          |
| Long-term maintenance   | No dependencies           | No `npm audit`, no package deprecation, no breaking major upgrades every 18 months.            |
| Offline capability      | Pure client-side          | Drop a Service Worker in later and the whole app works without a network.                      |
| Team skill ramp-up      | Browser primitives only   | Any web-literate reader can contribute without learning React/Vue/Svelte first.                |
| Map rendering           | Inline SVG                | No tile server, no Mapbox key, infinite zoom, CSS-styleable, scriptable from JS.               |
| Algorithm               | Dijkstra by hand          | Graph is small (< 200 nodes); no need for a library; clear teaching-quality implementation.    |

A framework (React, Vue, Svelte) would add roughly 40–100 KB of runtime, a build step, and a dependency tree, for a three-view app that has no reactive data cascade worth modelling. That cost wasn't justified.

---

## 3. Layer-by-layer detail

### 3.1 HTML5 (structure)
- **Semantic elements**: `<header>`, `<main>`, `<section>`, `<footer>` — descriptive, accessible, linkable.
- **View sections**: `<section class="view" id="view-entrance">`, `view-input`, `view-route` — toggled by a `.hidden` class; avoids real page loads.
- **`data-*` attributes**: `data-entrance="N"`, `data-k="1"` — tie markup to behaviour without inline event handlers.
- **`inputmode="none"`**: suppresses the mobile OS keyboard so the on-screen keypad is the only route to input (standard kiosk pattern).
- **Viewport meta**: `width=1080` locks layout to kiosk-class displays.

### 3.2 CSS3 (presentation)
- **Custom Properties** (`--navy`, `--orange`, `--ink`, ...) centralise the palette matching the poster.
- **CSS Grid**: entrance tiles (`repeat(3, 1fr)`) and the numeric keypad.
- **Flexbox**: top bar, search row, route header, stats row — one-dimensional alignment.
- **States & transitions**: `:hover`, `:active { transform: scale(0.98); }`, `transition: transform .1s` — tactile feedback on a touchscreen.
- **Shake animation** on invalid input — uses the Web Animations API (`element.animate([...], {duration: 240})`).
- **Accessibility-aware choices**: large tap targets (≥ 44 px, most ≥ 70 px), navy-on-white body text (~14.4 : 1 contrast ratio, exceeding WCAG AA), explicit focus states on form controls.
- **SVG-aware CSS**: rules like `.path { stroke: var(--orange); }` let SVG shapes pick up the same palette, keeping the kiosk visually coherent.

### 3.3 Vanilla JavaScript (behaviour)
The runtime is now split by responsibility instead of being kept in one monolithic file:

**`data.js` — declarative building model**
- Stores editable map constants and room / corridor / entrance datasets

**`data-processing.js` — data helpers**
- `buildGraph()` derives the adjacency-list graph from the declarative data
- Provides floor lookup, room lookup, and coordinate helper functions

**`scripts/state.js` — shared runtime state**
- Holds the single source of truth for current entrance, destination, floor, route, map instances, and editor state

**`scripts/demo-controller.js` — user-facing app flow**
- App startup
- Mode switching
- Input handling and suggestions
- Route calculation with `dijkstra(graph, startId, endId)`
- Route summary and step narrative rendering

**`scripts/map-renderer.js` — basemap + canvas overlay rendering**
- Google Maps / Leaflet initialization
- Projection and coordinate conversion
- Drawing rooms, corridors, links, paths, and markers

**`scripts/editor-controller.js` — design-mode editing tools**
- Room and corridor selection
- Drag / resize interactions
- Link editing
- Data export and persistence back to `data.js`

**`app.js` — thin boot file**
- Triggers initialization only

ES2015+ features used throughout: `const`/`let`, arrow functions, template literals, destructuring, `Set`, object shorthand.

### 3.4 SVG (graphics)
- **Scripted** via `document.createElementNS("http://www.w3.org/2000/svg", ...)` through an `el()` helper.
- **`viewBox="0 0 1000 520"`** + `preserveAspectRatio="xMidYMid meet"` gives resolution-independent scaling.
- **Primitives used**: `<rect>` (wings, rooms, stair markers), `<line>` (corridors, wing seams), `<circle>` (you-are-here pulse, destination dot, entrance badges), `<text>` (labels), `<path>` with `M`/`L` commands (the orange route polyline).
- **Styled via CSS** (`.path`, `.room-rect.dest`, `.node-you-ring`) so appearance stays in the stylesheet, not inline attributes.
- **Layering by draw order** — corridors first, rooms next, path after, markers last.

### 3.5 Algorithm: Dijkstra's shortest path
- **Graph** = `{ nodes: id → node, edges: id → [{to, w}, ...] }` — adjacency list, bidirectional.
- **Node kinds**: `entrance`, `corridor`, `stair`, `junction`, `room`.
- **Edge weights**: Euclidean distance for same-floor edges; manual constants for stairs (45 units per floor) and entrance approaches.
- **Complexity**: `O((V + E) log V)` with a proper binary heap; the current sort-on-insert queue is `O((V + E) · V log V)` in the worst case, which is fine for < 200 nodes — path computation completes well under 1 ms in Chrome DevTools.
- **Path reconstruction** via a `prev[]` map walked backwards from the destination.

### 3.6 Deployment
- **Target**: GitHub Pages, as declared on the poster.
- **Process**: push to the `gh-pages` branch (or enable Pages on `main`) — no pipeline needed.
- **Alternatives that require zero change**: Netlify drop, Vercel, AWS S3 + CloudFront, a USB stick plugged into a kiosk PC running a local web server.

---

## 4. How the layers combine — a request walk-through

Trace what happens when a user at the *Main* entrance enters `EB204`:

```
1.  index.html loads.
    └── <script src="data.js"> defines LAYOUT, ROOM_SLOTS, buildGraph, allRoomCodes.
    └── <script src="app.js">  attaches DOMContentLoaded handler.

2.  DOMContentLoaded fires.
    └── state.graph = buildGraph();         (data.js assembles ~200 nodes + edges)
    └── wireEntranceView() attaches click handlers to the three entrance tiles.
    └── #view-entrance is already visible; others carry the .hidden class.

3.  User taps the "Main" tile.
    └── state.entrance = "H"; state.entranceNodeId = "H-ENTRY".
    └── show("view-input") swaps visibility classes.
    └── #entrance-label text updated to "Main Entrance".

4.  User types or taps "EB204".
    └── renderSuggestions("EB2") filters allRoomCodes(), renders chip buttons.
    └── User taps "Go" / presses Enter → tryRoute().

5.  tryRoute validates input against allRoomCodes().
    └── Valid → state.dest = "EB204"; computeAndShowRoute().
    └── Invalid → shake animation, inline message.

6.  computeAndShowRoute:
    └── result = dijkstra(state.graph, "H-ENTRY", "ROOM-EB204").
        • Explores the adjacency list starting at "H-ENTRY"
        • Finds optimal: Main entry → H-stair → H-left → JCT-NH → N-CR → N-stair →
                          F2 N-stair → F2 door → EB204
    └── Stats populated: distance, walk-time, floor.
    └── renderMap(path, destNode): SVG built procedurally (wings, rooms, path, markers).
    └── renderSteps(path): iterates the node list, emits prose when floor or wing changes.
    └── show("view-route").

7.  User walks the real building following the highlighted orange path and the
    numbered steps. Taps "New search" → return to step 3 with entrance preserved,
    or "Start over" → return to step 2 with everything cleared.
```

**Nothing leaves the browser.** No API calls. No cookies. No accounts.

---

## 5. File map

```
web_code/
├── index.html                    ← HTML shell and script loading order
├── styles.css                    ← Design tokens, layout, and component styles
├── data.js                       ← Editable navigation data
├── data-processing.js            ← Graph and lookup helpers
├── app.js                        ← Thin boot file
├── scripts/
│   ├── state.js                  ← Shared runtime state
│   ├── demo-controller.js        ← Demo flow and routing logic
│   ├── map-renderer.js           ← Map provider setup and canvas rendering
│   └── editor-controller.js      ← Design-mode editing logic
└── doc/
    ├── PROJECT.md                ← Requirements, interaction, goals, risks, specification
    └── TECH_STACK.md             ← This document
```

Read order for a new contributor: `PROJECT.md` → `TECH_STACK.md` → `app.js` → `scripts/demo-controller.js` → `data-processing.js` → `scripts/map-renderer.js` → `scripts/editor-controller.js` → `data.js`.

---

## 6. Dependency tree

```
(none)
```

This is the point — nothing to upgrade, nothing to break, nothing to audit.

---

## 7. Natural extension points (and the tech each would introduce)

| Extension                                       | New tech to add                           | Effort |
|-------------------------------------------------|-------------------------------------------|--------|
| Real floor-plan underlay                        | Inkscape → SVG import; same CSS           | Low    |
| Offline kiosk mode                              | Service Worker + Cache API                | Low    |
| QR hand-off to phone                            | A QR-code library (e.g. `qrcode-svg`)     | Low    |
| Multi-language UI                               | Simple i18n dictionary in JS              | Low    |
| Type-safe building data                         | TypeScript + `tsc`                        | Medium |
| Unit tests for Dijkstra                         | Vitest or Jest                            | Medium |
| Automated accessibility audit in CI             | `axe-core` + GitHub Actions               | Medium |
| Lecture-schedule integration                    | `fetch` to timetable API                  | Medium |
| Indoor positioning                              | BLE beacons, WebBluetooth API             | High   |
| Analytics (privacy-preserving)                  | Plausible / umami (self-hosted)           | Medium |

Each is **additive** — the current stack absorbs them without being rewritten.

---

*End of document.*
