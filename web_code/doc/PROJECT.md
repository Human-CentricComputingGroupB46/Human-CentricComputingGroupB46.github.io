# CampusCompass — Project Document

**Module:** CPT208 Human-Centric Computing
**Group:** D-2
**Team:** Ziyi Jia (2362573), Tianchen Niu (2361034), Pingsong Deng (2362453), Zichen Fan (2360805)
**Artefact:** Web-based point-of-entry navigation kiosk for the EB building
**Document version:** 1.0 · 2026-04-14

---

## 0. Executive summary

CampusCompass is a static, browser-based navigation kiosk prototype designed to be mounted at each entrance of the EB building. It solves a concrete human-centric problem identified on the project poster: EB room codes (e.g. *EB204*) reveal only the floor number and hide the horizontal location (North Wing, Central Hallway, South Wing). New students and visitors entering through the wrong door can lose two to three times the necessary transit time.

The prototype accepts a room code at the entrance, computes the shortest walking path through a graph-model of the building using **Dijkstra's algorithm**, and renders a 2D top-down map with step-by-step directions including cross-wing and cross-floor guidance.

---

## 1. Requirements

Requirements are split into **functional** (what the system must do) and **non-functional** (qualities the system must exhibit). Each is given a stable ID for traceability.

### 1.1 Functional requirements

| ID    | Requirement                                                                                                        | Priority  | Status in prototype |
|-------|--------------------------------------------------------------------------------------------------------------------|-----------|---------------------|
| FR-01 | System shall let the user declare which entrance they are at before any search.                                    | Must-have | ✓ Implemented       |
| FR-02 | System shall accept a room code as text input (both on-screen keypad and physical keyboard).                       | Must-have | ✓ Implemented       |
| FR-03 | System shall offer live autocomplete suggestions as the user types a partial room code.                            | Should    | ✓ Implemented       |
| FR-04 | System shall compute the shortest walking route from the chosen entrance to the queried room.                      | Must-have | ✓ Implemented (Dijkstra) |
| FR-05 | System shall render a 2D top-down map showing the destination floor, the route, a "you are here" marker and the destination. | Must-have | ✓ Implemented (SVG) |
| FR-06 | System shall produce an ordered, plain-language step list (e.g. "take the North stair up to Floor 2").             | Must-have | ✓ Implemented       |
| FR-07 | System shall report walking-distance and approximate walking time.                                                 | Should    | ✓ Implemented       |
| FR-08 | System shall recover gracefully from invalid input (unknown room codes).                                           | Must-have | ✓ Shake + inline message |
| FR-09 | System shall allow the user to start a new search or change entrance at any point.                                 | Must-have | ✓ Implemented       |
| FR-10 | System shall reset after idle time (kiosk privacy/reuse).                                                          | Should    | ⚠ Not yet — see §4.2 |
| FR-11 | System shall support multiple floors and cross-floor routing via stairs.                                           | Must-have | ✓ Implemented       |
| FR-12 | System shall allow the user to take the route with them (e.g. QR hand-off to phone).                               | Could     | ⚠ Not yet — see §4.2 |

### 1.2 Non-functional requirements

| ID     | Category         | Requirement                                                                                  | Status |
|--------|------------------|----------------------------------------------------------------------------------------------|--------|
| NFR-01 | **Usability**    | A first-time user must reach the arrival screen in ≤ 15 s with ≤ 3 taps.                     | ✓ Alpha testing: 100% success, 60% time saved |
| NFR-02 | **Accessibility**| Colour palette must meet WCAG AA contrast (≥ 4.5:1 for body text).                           | ✓ Navy #0b1f3a on white ≈ 14.4:1 |
| NFR-03 | **Accessibility**| All interactive targets ≥ 44 × 44 px (WCAG 2.5.5 minimum target size).                       | ✓ Keypad keys ≈ 80 × 70 px |
| NFR-04 | **Performance**  | Time from tap to route render ≤ 200 ms on low-end kiosk hardware.                            | ✓ Graph < 200 nodes; Dijkstra well below threshold |
| NFR-05 | **Portability**  | Must run as a static site with zero build step on commodity browsers (Chromium / Safari / Firefox, last 2 versions). | ✓ No bundler, no dependencies |
| NFR-06 | **Deployability**| Must deploy to a free-tier static host (GitHub Pages).                                       | ✓ Matches poster architecture |
| NFR-07 | **Offline**      | Should continue to function without an internet connection after first load.                 | ⚠ Feasible — needs a Service Worker |
| NFR-08 | **Maintainability**| Building data (rooms, wings, floors) must be editable without touching rendering logic.    | ✓ Geometry declared in `data.js`; rendering in `app.js` |
| NFR-09 | **Internationalisation** | UI strings should be centralisable for future localisation (EN / ZH).                | ⚠ Not yet — strings currently inline |
| NFR-10 | **Privacy**      | No personal data collected; no network calls; no cookies.                                    | ✓ Fully client-side |
| NFR-11 | **Security**     | No XSS surface — all user input is placed into DOM via `textContent` or whitelisted room codes. | ✓ By design |
| NFR-12 | **Resilience**   | The kiosk must never present a blank/broken screen — invalid states must fall back to the entrance view. | ✓ Reset flow covers this |

---

## 2. Interaction design

### 2.1 User journey (mirrors the poster's four-stage model)

```
  Encounter   →   Input   →   Routing   →   Arrival
  (pick door)     (type room)  (show map)    (walk there)
```

### 2.2 View-by-view interaction flow

**View 1 — Encounter (entrance selection)**
1. User walks up to the kiosk. A welcome question is shown: *"Where are you entering from?"*
2. Three large tiles (North / Main / South) fill the screen. The central *Main* tile is emphasised because it is statistically the most-used entrance.
3. A single tap sets the `entrance` state and advances to View 2.

**View 2 — Input (room search)**
1. A "You are here" chip confirms the chosen entrance. This stops the user second-guessing.
2. A large input field shows the typed code in 34 px uppercase.
3. A 3 × 5 on-screen keypad covers letters `E`, `B`, digits `0–9`, and utility keys (`Clear`, `⌫`, `Go`). A physical keyboard also works (useful for testing and accessibility).
4. Live suggestion chips appear after each keystroke — tapping a chip completes the field.
5. Invalid codes trigger a shake animation and an inline hint showing the valid range (*EB101–EB425*).
6. A "← Change entrance" link lets the user back out without resetting state entirely.

**View 3 — Routing & arrival**
1. Route header shows *From → To* and three stat tiles: **distance (m)**, **walk time (s)**, **floor**.
2. The SVG map renders the destination floor with:
   - Wing blocks (North, Hallway, South) and corridors drawn as dashed lines
   - All rooms on that floor, with the destination room highlighted green
   - The shortest path as a thick orange polyline
   - A pulsing orange "you are here" dot at the floor's entry point (either the entrance on Floor 1, or the stair exit on higher floors — labelled *"Arrive via stair"*)
   - Entrance letter markers (N / Main / S) on Floor 1
3. A numbered *Step-by-step* list re-states the route in prose ("Start at Main Entrance" → "Take the North Wing stair up to Floor 2" → "Arrive at EB204 ✓").
4. *New search* returns to View 2 (keeping the entrance). *Start over* returns to View 1.

### 2.3 Interaction principles applied

- **Progressive disclosure** — each view asks one thing at a time.
- **Forgiveness** — no destructive actions; every step can be reversed in one tap.
- **Closure** — the green checkmark on *"Arrive at EB204"* gives an explicit "you're done" signal.
- **Redundant encoding** — the route is communicated three times (map colour, stats, prose) so users with different cognitive styles all succeed.

---

## 3. Goals

### 3.1 Primary goal
Eliminate the *trial-and-error wandering* caused by EB's ambiguous room-code convention, by translating a room code into a concrete walking path at the moment of entry.

### 3.2 Measurable outcomes (from alpha testing, cited on the poster)
- **100 %** task success rate across three alpha testers
- **≈ 60 %** average time saved versus unaided navigation
- **≤ 3 taps** from entry to arrival screen

### 3.3 Secondary goals
1. Reduce **new-student anxiety** in the first weeks of term.
2. Reduce **visiting-guest friction** during events, open days, and conference week.
3. Offload navigation questions from reception and teaching staff.
4. Provide a **reusable pattern** (graph + 2D map + Dijkstra) transferable to other confusing campus buildings.

### 3.4 Out of scope for this prototype
- Real-time crowd-aware routing
- Indoor positioning / user tracking
- Lecture-schedule integration
- Outdoor campus-wide wayfinding

---

## 4. Risks

### 4.1 Risk register

| ID   | Risk                                                                                           | Likelihood | Impact | Mitigation in prototype / proposed |
|------|------------------------------------------------------------------------------------------------|------------|--------|-------------------------------------|
| R-01 | **Wrong-entrance assumption** — user taps the wrong entrance tile at the start.                | Medium     | High   | *Mitigated* by a persistent "← Change entrance" link and a prominent "You are here" chip; no destructive state. |
| R-02 | **Stale map data** — real EB rooms get renumbered or rewired.                                  | Low        | High   | *Revision:* split `data.js` into a JSON file loaded at runtime so facilities staff can edit without JS knowledge. |
| R-03 | **Accessibility failure for visually impaired users.**                                         | Medium     | High   | *Revision:* add ARIA live regions announcing each step, keyboard focus order, and an optional high-contrast mode and audio-readout of directions. |
| R-04 | **Non-English speakers** unable to read labels.                                                | Medium     | Medium | *Revision:* extract all strings into an `i18n.js` dictionary with at least EN / ZH; autodetect from browser lang, offer manual toggle. |
| R-05 | **Kiosk hardware failure** — touchscreen freezes, browser crashes.                             | Medium     | Medium | *Revision:* wrap the app in a kiosk shell that auto-reloads on error and run a heartbeat ping. Add a Service Worker for offline operation. |
| R-06 | **Germ / hygiene concerns** on a shared touchscreen.                                           | Medium     | Low    | *Revision:* add an optional QR hand-off so the route opens on the user's phone and the kiosk becomes "look, don't touch". |
| R-07 | **Privacy concerns** if logging is added carelessly.                                           | Low        | High   | *Mitigated*: prototype collects nothing. *Revision for production:* if analytics are added, use aggregated, anonymised counters only, disclosed on-screen. |
| R-08 | **Incorrect shortest path** due to mis-modelled stair/lift costs.                              | Medium     | Medium | *Revision:* calibrate edge weights against real walking measurements; optionally add a "prefer lift" toggle for mobility-impaired users. |
| R-09 | **Fire / emergency override** — static signage must not mislead during evacuation.             | Low        | Critical | *Revision:* integrate with the building fire-alarm system via a simple HTTP webhook; on alarm, app replaces content with "Follow green emergency signs" and nearest exit. |
| R-10 | **Map-reading literacy** — not every user reads 2D top-down plans.                             | Medium     | Medium | *Mitigated* by the parallel prose step list; *further revision:* add first-person photo waypoints for critical turns. |
| R-11 | **Power outage / network outage** during an event.                                             | Low        | Medium | *Revision:* Service Worker caches everything; kiosk runs off UPS. |
| R-12 | **Scope creep** during development turning a simple kiosk into a campus-wide app.              | Medium     | Medium | *Mitigated* by the explicit *out of scope* list in §3.4. |

### 4.2 Features deferred to reduce risk early
- Idle-timeout reset (FR-10) — straightforward to add, but not exercised during alpha testing so intentionally deferred.
- QR hand-off (FR-12) — requires a URL scheme decision.
- Service Worker (NFR-07) — optional for a static demo; essential for real deployment.
- Internationalisation (NFR-09) — kept inline to keep the prototype small; low effort to extract.

---

## 5. Specification — where and when the app should be deployed

### 5.1 Deployment environment
- **Physical:** wall-mounted landscape touchscreens (≥ 21", ≥ 1080 p) placed immediately inside each of the three EB entrances, at waist-to-chest height for wheelchair accessibility.
- **Software:** any Chromium-based kiosk browser in full-screen mode, pointed at the GitHub Pages URL. No installer, no signed binaries.
- **Network:** wired Ethernet preferred, with the site also pre-cached by a Service Worker so a brief outage is transparent to the user.
- **Power:** pass-through UPS recommended to survive short outages.

### 5.2 Situational fit (when the app is the right tool)

**Use the app when:**
- A building has **non-obvious room-code conventions** (floor-only codes, wing-agnostic codes, historic names).
- A building has **multiple entrances** with significantly different shortest-paths to interior rooms.
- The user population is **predominantly transient** (new students each semester, visitors during open days, conference delegates).
- The organisation prefers a **no-install** touchpoint — no app store, no account creation.

**Prefer alternatives when:**
- Outdoor campus-wide navigation is the actual need → use Google/Apple Maps or a dedicated campus app.
- Real-time lecture/room availability matters → integrate with the timetable system, possibly in parallel with CampusCompass.
- The building already has unambiguous signage and a single entrance → a kiosk is overkill; stick to printed signage.
- Users need turn-by-turn audio while walking → a mobile app with indoor positioning is a better fit.

### 5.3 Operational lifecycle
1. **Install** the kiosk, open the URL in full-screen mode, test every entrance-to-room combination on the floor plan.
2. **Audit quarterly** — reconcile `data.js` against Facilities' room list; update stair / lift costs after any building work.
3. **Monitor** via an uptime check (simple HTTP 200 ping).
4. **Retire** when the underlying building changes enough that the graph no longer represents reality — version-tag the data and archive.

---

## 6. Architecture summary

> Detailed tech discussion is in `doc/TECH_STACK.md`. This section is a one-page map.

```
┌──────────────────────┐      ┌───────────────────────┐      ┌────────────────────┐
│  HTML (structure)    │ ←──→ │  CSS (presentation)   │ ←──→ │  JavaScript        │
│  semantic views      │      │  CSS vars, Grid, Flex │      │  views + state +   │
│  data-attributes     │      │  high-contrast theme  │      │  Dijkstra + SVG    │
└──────────────────────┘      └───────────────────────┘      └──────────┬─────────┘
                                                                        │
                                                            ┌───────────▼───────────┐
                                                            │  data.js              │
                                                            │  LAYOUT + ROOM_SLOTS  │
                                                            │  → graph nodes/edges  │
                                                            └───────────────────────┘
```

Everything is static. No server. No build step. Deployable by copying files to any static host.

---

## 7. Added sections (things the brief didn't ask for but a real project document should contain)

> These are marked **[ADDED]** per your instruction to flag anything you missed.

### 7.1 **[ADDED]** Evaluation plan
- **Alpha testing (done):** 3 testers, 100% success, 60% average time saved — reported on the poster.
- **Proposed beta:** 15–20 participants (mix of new students and external visitors); metrics: time-to-arrival, number of wrong turns observed, SUS (System Usability Scale) score, post-task interview.
- **A/B candidates:** 2D top-down vs. 3D isometric (already trialled, 2D won); map + text vs. text-only; guest QR hand-off on vs. off.

### 7.2 **[ADDED]** Ethical & policy considerations
- Declared compliance with the university's AI disclosure policy on the poster (images were AI-assisted; code in this repo is human-authored with AI pair-programming assistance).
- No biometric or positional data collected.
- Signage on the kiosk must state that **no personal data is stored**.

### 7.3 **[ADDED]** Success criteria for production release
1. Three consecutive weeks of kiosk operation with ≥ 99 % uptime.
2. SUS score ≥ 75 on a beta cohort of ≥ 15 users.
3. Facilities can update the building graph in ≤ 15 min without developer involvement.
4. Accessibility audit (axe-core + manual screen-reader pass) reports zero critical issues.

### 7.4 **[ADDED]** Glossary (so non-technical stakeholders can read this doc)
- **Dijkstra's algorithm** — a classic method for finding the shortest path between two points in a weighted graph.
- **Graph (in software)** — a set of *nodes* (places) connected by *edges* (walkable segments).
- **Kiosk** — a fixed, shared public touchscreen.
- **SVG** — Scalable Vector Graphics; a web-native format for drawing shapes that stay crisp at any size.
- **WCAG AA** — the middle tier of the Web Content Accessibility Guidelines; widely used as the public-sector minimum.
- **Service Worker** — a small script the browser runs in the background; enables offline caching.

### 7.5 **[ADDED]** Assumptions & open questions
- **Assumed**: the building has exactly three entrances and three wings per floor. Real EB layout may differ — confirm with Facilities before production.
- **Assumed**: stair cost is roughly 45 units per floor. Needs calibration against stopwatch measurements.
- **Open**: does the university want analytics? If yes, what's the privacy policy?
- **Open**: is a lift accessible from every wing on every floor? The current graph only models stairs.

### 7.6 **[ADDED]** Team roles (suggested split for the write-up)
- UX / interaction design & user-journey writing
- Front-end implementation (HTML / CSS / JS)
- Graph & routing algorithm
- Evaluation and alpha testing coordination

---

*End of document.*
