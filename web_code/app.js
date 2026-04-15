/* CampusCompass — view controller, routing (Dijkstra), and SVG rendering. */

const SVG_NS = "http://www.w3.org/2000/svg";
const state = {
  entrance: null,          // "N" | "H" | "S"
  entranceNodeId: null,    // graph node
  dest: null,              // room code like "EB204"
  graph: null,
};

document.addEventListener("DOMContentLoaded", () => {
  state.graph = buildGraph();
  tickClock(); setInterval(tickClock, 1000 * 15);
  wireEntranceView();
  wireInputView();
  wireRouteView();
});

/* --------------- Clock --------------- */
function tickClock() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  document.getElementById("clock").textContent = `${hh}:${mm}`;
}

/* --------------- View switching --------------- */
function show(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById(viewId).classList.remove("hidden");
}

/* --------------- Entrance view --------------- */
function wireEntranceView() {
  document.querySelectorAll(".entrance-card").forEach(btn => {
    btn.addEventListener("click", () => {
      state.entrance = btn.dataset.entrance;
      state.entranceNodeId = LAYOUT.entrances[state.entrance].id;
      document.getElementById("entrance-label").textContent = LAYOUT.entrances[state.entrance].label;
      document.getElementById("room-input").value = "";
      renderSuggestions("");
      show("view-input");
      document.getElementById("room-input").focus();
    });
  });
}

/* --------------- Input view --------------- */
function wireInputView() {
  const input = document.getElementById("room-input");
  const go = document.getElementById("go-btn");

  input.addEventListener("input", () => {
    input.value = input.value.toUpperCase();
    renderSuggestions(input.value);
  });
  input.addEventListener("keydown", e => { if (e.key === "Enter") tryRoute(); });

  document.querySelectorAll(".keypad button").forEach(b => {
    b.addEventListener("click", () => {
      const k = b.dataset.k;
      if (k === "clear") input.value = "";
      else if (k === "back") input.value = input.value.slice(0, -1);
      else if (k === "enter") { tryRoute(); return; }
      else input.value = (input.value + k).toUpperCase();
      renderSuggestions(input.value);
    });
  });

  go.addEventListener("click", tryRoute);
  document.getElementById("back-to-entrance").addEventListener("click", () => show("view-entrance"));
}

function renderSuggestions(prefix) {
  const box = document.getElementById("suggestions");
  box.innerHTML = "";
  const codes = allRoomCodes();
  const p = (prefix || "").toUpperCase().replace(/\s+/g, "");
  let matches;
  if (!p) matches = codes.slice(0, 6);
  else matches = codes.filter(c => c.startsWith(p)).slice(0, 8);
  if (matches.length === 0 && p.length >= 3) {
    box.innerHTML = `<span style="color:var(--warn);font-size:14px;">No room matches "${p}". Try EB101–EB425.</span>`;
    return;
  }
  matches.forEach(code => {
    const b = document.createElement("button");
    b.textContent = code;
    b.addEventListener("click", () => {
      document.getElementById("room-input").value = code;
      renderSuggestions(code);
    });
    box.appendChild(b);
  });
}

function tryRoute() {
  const code = document.getElementById("room-input").value.trim().toUpperCase();
  if (!allRoomCodes().includes(code)) {
    flashInput();
    return;
  }
  state.dest = code;
  computeAndShowRoute();
}

function flashInput() {
  const el = document.getElementById("room-input");
  el.style.borderColor = "var(--warn)";
  el.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 240 });
  setTimeout(() => (el.style.borderColor = ""), 600);
}

/* --------------- Routing (Dijkstra) --------------- */
function dijkstra(graph, startId, endId) {
  const dist = {};
  const prev = {};
  const visited = new Set();
  const pq = []; // simple array-based priority queue (small graph)

  for (const id in graph.nodes) dist[id] = Infinity;
  dist[startId] = 0;
  pq.push([0, startId]);

  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    if (u === endId) break;
    for (const { to, w } of graph.edges[u] || []) {
      if (visited.has(to)) continue;
      const nd = d + w;
      if (nd < dist[to]) {
        dist[to] = nd;
        prev[to] = u;
        pq.push([nd, to]);
      }
    }
  }

  if (dist[endId] === Infinity) return null;
  const path = [];
  let cur = endId;
  while (cur !== undefined) { path.unshift(cur); cur = prev[cur]; }
  return { path, distance: dist[endId] };
}

/* --------------- Compute + render route --------------- */
function computeAndShowRoute() {
  const g = state.graph;
  const destNodeId = `ROOM-${state.dest}`;
  const result = dijkstra(g, state.entranceNodeId, destNodeId);
  if (!result) { alert("No route found."); return; }

  const destNode = g.nodes[destNodeId];
  document.getElementById("from-label").textContent = LAYOUT.entrances[state.entrance].label;
  document.getElementById("dest-label").textContent = state.dest;
  document.getElementById("stat-dist").textContent = Math.round(result.distance / 10) * 1; // arbitrary scale → metres
  document.getElementById("stat-time").textContent = Math.round(result.distance / 15);
  document.getElementById("stat-floor").textContent = destNode.floor;

  renderMap(result.path, destNode);
  renderSteps(result.path);
  show("view-route");
}

/* --------------- SVG map render --------------- */
function renderMap(path, destNode) {
  const svg = document.getElementById("map");
  svg.innerHTML = "";
  const floor = destNode.floor;

  // Title bar
  const title = el("text", { x: 500, y: 34, "text-anchor": "middle", "font-size": 18, "font-weight": 700, fill: "#0b1f3a" });
  title.textContent = `EB Building · Floor ${floor}`;
  svg.appendChild(title);

  // Wings
  for (const wk of ["N", "H", "S"]) {
    const w = LAYOUT.wings[wk];
    const rect = el("rect", { x: w.block.x, y: w.block.y, width: w.block.w, height: w.block.h, rx: 8, ry: 8, class: wk === "H" ? "hallway-block" : "wing-block" });
    svg.appendChild(rect);
    const lbl = el("text", { x: w.block.x + w.block.w / 2, y: w.block.y + 22, "text-anchor": "middle", class: "wing-label" });
    lbl.textContent = w.label.toUpperCase();
    svg.appendChild(lbl);

    // Corridor line
    svg.appendChild(el("line", { x1: w.block.x + 10, y1: w.corridorY, x2: w.block.x + w.block.w - 10, y2: w.corridorY, class: "edge", "stroke-dasharray": "4 4" }));

    // Stair marker
    svg.appendChild(el("rect", { x: w.stair.x - 14, y: w.corridorY - 12, width: 28, height: 24, fill: "#fff", stroke: "#8a94ae", "stroke-width": 1.5, rx: 4 }));
    const stxt = el("text", { x: w.stair.x, y: w.corridorY + 4, "text-anchor": "middle", "font-size": 10, fill: "#5a6485", "font-weight": 700 });
    stxt.textContent = "STAIR";
    svg.appendChild(stxt);
  }

  // Inter-wing seams
  svg.appendChild(el("line", { x1: 300, y1: 260, x2: 340, y2: 260, class: "edge" }));
  svg.appendChild(el("line", { x1: 660, y1: 260, x2: 700, y2: 260, class: "edge" }));

  // Rooms on this floor
  for (const wk of ["N", "H", "S"]) {
    for (const slot of ROOM_SLOTS[wk]) {
      const code = `EB${floor}${slot.n}`;
      const isDest = code === destNode.room;
      const rw = 44, rh = 34;
      const rx = slot.x - rw / 2;
      const ry = slot.y - rh / 2;
      svg.appendChild(el("rect", { x: rx, y: ry, width: rw, height: rh, rx: 4, class: "room-rect" + (isDest ? " dest" : "") }));
      const lbl = el("text", { x: slot.x, y: slot.y + 3, class: "room-label" });
      lbl.textContent = code;
      svg.appendChild(lbl);
    }
  }

  // Entrance markers (floor 1 only display)
  if (floor === 1) {
    for (const k of ["N", "H", "S"]) {
      const e = LAYOUT.entrances[k];
      svg.appendChild(el("circle", { cx: e.x, cy: e.y, r: 16, class: "entrance-marker" }));
      const t = el("text", { x: e.x, y: e.y + 4, class: "entrance-marker-label" });
      t.textContent = k;
      svg.appendChild(t);
    }
  }

  // Filter path to nodes on this floor (destination floor)
  const g = state.graph;
  const floorPath = path.map(id => g.nodes[id]).filter(n => n.floor === floor);

  // Entry point for this floor's drawing:
  //   If floor === 1: draw from entrance marker along the path.
  //   Else: the path enters this floor at a stair node — mark it "You arrive here".
  if (floorPath.length >= 2) {
    const d = floorPath.map((n, i) => (i === 0 ? `M ${n.x} ${n.y}` : `L ${n.x} ${n.y}`)).join(" ");
    svg.appendChild(el("path", { d, class: "path" }));
  }

  // "You are here" marker at start of floor path
  const you = floorPath[0];
  if (you) {
    svg.appendChild(el("circle", { cx: you.x, cy: you.y, r: 20, class: "node-you-ring" }));
    svg.appendChild(el("circle", { cx: you.x, cy: you.y, r: 9, class: "node-you" }));
    if (floor !== 1) {
      const t = el("text", { x: you.x, y: you.y - 28, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#c2690e" });
      t.textContent = "Arrive via stair";
      svg.appendChild(t);
    }
  }

  // Destination marker
  svg.appendChild(el("circle", { cx: destNode.x, cy: destNode.y, r: 10, class: "node-dest" }));
}

function el(name, attrs) {
  const e = document.createElementNS(SVG_NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

/* --------------- Step-by-step directions --------------- */
function renderSteps(path) {
  const g = state.graph;
  const ol = document.getElementById("steps");
  ol.innerHTML = "";
  const steps = [];

  const startFloor = g.nodes[path[0]].floor;
  steps.push(`Start at the <b>${LAYOUT.entrances[state.entrance].label}</b>.`);

  // Detect floor changes and wing entries
  let curFloor = startFloor;
  let curWing = g.nodes[path[0]].wing || state.entrance;

  for (let i = 1; i < path.length; i++) {
    const n = g.nodes[path[i]];
    const prev = g.nodes[path[i - 1]];

    if (n.floor !== curFloor) {
      const wingName = LAYOUT.wings[n.wing || curWing]?.label || "nearby stair";
      const dir = n.floor > curFloor ? "up" : "down";
      steps.push(`Take the <b>${wingName} stair</b> ${dir} to <b>Floor ${n.floor}</b>.`);
      curFloor = n.floor;
    }
    if (n.wing && n.wing !== curWing && n.kind !== "entrance") {
      const enteringName = LAYOUT.wings[n.wing]?.label;
      if (enteringName && prev.kind === "junction") {
        steps.push(`Enter the <b>${enteringName}</b>.`);
      }
      curWing = n.wing;
    }
    if (n.kind === "room") {
      steps.push(`Arrive at <b>${n.room}</b>. ✓`);
    }
  }

  steps.forEach(s => {
    const li = document.createElement("li");
    li.innerHTML = s;
    ol.appendChild(li);
  });
}

/* --------------- Route view wiring --------------- */
function wireRouteView() {
  document.getElementById("new-search").addEventListener("click", () => {
    document.getElementById("room-input").value = "";
    renderSuggestions("");
    show("view-input");
  });
  document.getElementById("reset").addEventListener("click", () => {
    state.entrance = null; state.dest = null;
    show("view-entrance");
  });
}
