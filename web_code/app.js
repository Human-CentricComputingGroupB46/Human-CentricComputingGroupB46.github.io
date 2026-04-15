/* CampusCompass - one-screen EB first-floor navigator. */

const SVG_NS = "http://www.w3.org/2000/svg";

const state = {
  entrance: "NW",
  entranceNodeId: ENTRANCES.NW.id,
  dest: null,
  graph: null,
  route: null,
  mode: "idle",
};

document.addEventListener("DOMContentLoaded", () => {
  state.graph = buildGraph();
  tickClock();
  setInterval(tickClock, 1000 * 15);
  wireEntrancePicker();
  wireInput();
  renderSuggestions("");
  renderMap();
  renderStatus();
});

function tickClock() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  document.getElementById("clock").textContent = `${hh}:${mm}`;
}

function wireEntrancePicker() {
  document.querySelectorAll(".entrance-option").forEach(btn => {
    btn.addEventListener("click", () => {
      state.entrance = btn.dataset.entrance;
      state.entranceNodeId = ENTRANCES[state.entrance].id;
      state.dest = null;
      state.route = null;
      state.mode = state.entrance === "SW" ? "recommend" : "idle";
      document.getElementById("room-input").value = "";
      renderSuggestions("");
      renderMap();
      renderStatus();
      document.getElementById("room-input").focus();
    });
  });
}

function wireInput() {
  const input = document.getElementById("room-input");

  input.addEventListener("input", () => {
    input.value = cleanRoomInput(input.value);
    renderSuggestions(input.value);
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") tryRoute();
  });

  document.querySelectorAll(".keypad button").forEach(button => {
    button.addEventListener("click", () => {
      const key = button.dataset.k;
      if (key === "clear") {
        input.value = "";
        clearRoute();
      } else if (key === "back") {
        input.value = input.value.slice(0, -1);
      } else if (key === "enter") {
        tryRoute();
        return;
      } else {
        input.value = cleanRoomInput(input.value + key);
      }
      renderSuggestions(input.value);
    });
  });

  document.getElementById("go-btn").addEventListener("click", tryRoute);
  document.getElementById("clear-route").addEventListener("click", () => {
    input.value = "";
    clearRoute();
    renderSuggestions("");
  });
}

function cleanRoomInput(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
}

function clearRoute() {
  state.dest = null;
  state.route = null;
  state.mode = state.entrance === "SW" ? "recommend" : "idle";
  renderMap();
  renderStatus();
}

function renderSuggestions(prefix) {
  const box = document.getElementById("suggestions");
  box.innerHTML = "";
  const p = cleanRoomInput(prefix || "");
  const matches = allRoomCodes()
    .filter(code => !p || code.startsWith(p))
    .slice(0, p ? 8 : 10);

  if (matches.length === 0 && p.length >= 3) {
    const span = document.createElement("span");
    span.textContent = `No first-floor room found for "${p}".`;
    box.appendChild(span);
    return;
  }

  matches.forEach(code => {
    const button = document.createElement("button");
    button.textContent = code;
    button.addEventListener("click", () => {
      document.getElementById("room-input").value = code;
      renderSuggestions(code);
      tryRoute();
    });
    box.appendChild(button);
  });
}

function tryRoute() {
  const input = document.getElementById("room-input");
  const code = cleanRoomInput(input.value);
  input.value = code;

  if (!allRoomCodes().includes(code)) {
    state.dest = null;
    state.route = null;
    state.mode = state.entrance === "SW" ? "recommend" : "invalid";
    flashInput();
    renderMap();
    renderStatus();
    return;
  }

  state.dest = code;

  if (state.entrance === "SW") {
    state.route = { path: RECOMMENDED_SW_TO_NW, distance: estimatePathDistance(RECOMMENDED_SW_TO_NW) };
    state.mode = "recommend";
    renderMap();
    renderStatus();
    return;
  }

  const result = dijkstra(state.graph, state.entranceNodeId, `ROOM-${code}`);
  if (!result) {
    state.route = null;
    state.mode = "unreachable";
  } else {
    state.route = result;
    state.mode = "route";
  }
  renderMap();
  renderStatus();
}

function flashInput() {
  const el = document.getElementById("room-input");
  el.style.borderColor = "var(--warn)";
  el.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-6px)" },
      { transform: "translateX(6px)" },
      { transform: "translateX(0)" },
    ],
    { duration: 240 }
  );
  setTimeout(() => (el.style.borderColor = ""), 600);
}

function dijkstra(graph, startId, endId) {
  const dist = {};
  const prev = {};
  const visited = new Set();
  const pq = [];

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
  while (cur !== undefined) {
    path.unshift(cur);
    cur = prev[cur];
  }
  return { path, distance: dist[endId] };
}

function estimatePathDistance(path) {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = state.graph.nodes[path[i]];
    const b = state.graph.nodes[path[i + 1]];
    if (a && b) total += Math.hypot(a.x - b.x, a.y - b.y);
  }
  return total;
}

function renderStatus() {
  const entrance = ENTRANCES[state.entrance];
  document.getElementById("entrance-label").textContent = entrance.label;
  document.querySelectorAll(".entrance-option").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.entrance === state.entrance);
  });

  const title = document.getElementById("route-title");
  const steps = document.getElementById("steps");
  const message = document.getElementById("message");
  const dist = document.getElementById("stat-dist");
  const time = document.getElementById("stat-time");

  steps.innerHTML = "";
  dist.textContent = "--";
  time.textContent = "--";
  message.className = "message";

  if (state.mode === "route" && state.route && state.dest) {
    title.textContent = `${entrance.label} to ${state.dest}`;
    message.textContent = "Shortest first-floor route shown on the map.";
    dist.textContent = Math.round(state.route.distance / 10);
    time.textContent = Math.max(5, Math.round(state.route.distance / 14));
    addStep(`Start at ${entrance.label}.`);
    addRouteLandmarks(state.route.path);
    addStep(`Arrive at ${state.dest}.`);
    return;
  }

  if (state.mode === "recommend") {
    title.textContent = "Use the North-West Entrance.";
    message.classList.add("warn");
    message.textContent = "From the South-West Entrance, please go to the North-West Entrance first.";
    if (state.route) {
      dist.textContent = Math.round(state.route.distance / 10);
      time.textContent = Math.max(10, Math.round(state.route.distance / 14));
    }
    addStep("You are at the South-West Entrance.");
    addStep("Go to the North-West Entrance before starting indoor navigation.");
    if (state.dest) addStep(`Then search ${state.dest} from the North-West Entrance.`);
    return;
  }

  if (state.mode === "invalid") {
    title.textContent = "Room not found.";
    message.classList.add("warn");
    message.textContent = "Please enter one of the listed first-floor room numbers.";
    addStep("Check the room code and try again.");
    return;
  }

  if (state.mode === "unreachable") {
    title.textContent = "No route found.";
    message.classList.add("warn");
    message.textContent = "This room is in the data, but no connected route was found.";
    addStep("Try another entrance or check the room code.");
    return;
  }

  if (state.entrance === "SW") {
    title.textContent = "Use the North-West Entrance.";
    message.classList.add("warn");
    message.textContent = "South-West users should go to the North-West Entrance.";
    addStep("Select NW after moving to the North-West Entrance.");
    return;
  }

  title.textContent = "Choose an entrance, then enter a room.";
  message.textContent = "Only EB first-floor rooms are available.";
  addStep("Select NW, NE, or SW on the input panel.");
  addStep("Enter a room such as EB102, EB111, or EB138.");
}

function addRouteLandmarks(path) {
  const labels = [];
  for (const id of path) {
    const node = state.graph.nodes[id];
    if (!node || !node.label || node.kind === "room") continue;
    if (labels[labels.length - 1] !== node.label) labels.push(node.label);
  }
  labels.forEach(label => addStep(`Pass ${label}.`));
}

function addStep(text) {
  const li = document.createElement("li");
  li.textContent = text;
  document.getElementById("steps").appendChild(li);
}

function renderMap() {
  const svg = document.getElementById("map");
  svg.innerHTML = "";

  drawBase(svg);
  drawEdges(svg);
  drawRooms(svg);
  drawServicePoints(svg);
  drawEntrances(svg);
  drawPath(svg);
  drawMarkers(svg);
}

function drawBase(svg) {
  svg.appendChild(el("rect", {
    x: 24,
    y: 24,
    width: MAP.width - 48,
    height: MAP.height - 48,
    rx: 8,
    class: "map-shell",
  }));

  for (const area of INACCESSIBLE_AREAS) {
    svg.appendChild(el("rect", {
      x: area.x,
      y: area.y,
      width: area.w,
      height: area.h,
      rx: 6,
      class: "inaccessible",
    }));
    const t = el("text", {
      x: area.x + area.w / 2,
      y: area.y + area.h / 2,
      class: "inaccessible-label",
      "text-anchor": "middle",
    });
    t.textContent = area.label;
    svg.appendChild(t);
  }

  const labels = [
    { text: "North", x: 500, y: 18 },
    { text: "South", x: 500, y: 628 },
    { text: "West", x: 42, y: 326, rotate: -90 },
    { text: "East", x: 958, y: 326, rotate: 90 },
  ];

  for (const label of labels) {
    const t = el("text", {
      x: label.x,
      y: label.y,
      class: "axis-label",
      "text-anchor": "middle",
    });
    if (label.rotate) t.setAttribute("transform", `rotate(${label.rotate} ${label.x} ${label.y})`);
    t.textContent = label.text;
    svg.appendChild(t);
  }
}

function drawEdges(svg) {
  for (const [aId, bId] of WALKABLE_EDGES) {
    const a = state.graph.nodes[aId];
    const b = state.graph.nodes[bId];
    svg.appendChild(el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: "edge" }));
  }

  for (const [aId, bId] of DOORWAY_EDGES) {
    const a = state.graph.nodes[aId];
    const b = state.graph.nodes[bId];
    svg.appendChild(el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: "doorway-edge" }));
  }
}

function drawRooms(svg) {
  const dest = state.dest ? getRoom(state.dest) : null;

  for (const room of ROOM_DATA[1]) {
    svg.appendChild(el("rect", {
      x: room.x - room.w / 2,
      y: room.y - room.h / 2,
      width: room.w,
      height: room.h,
      rx: 4,
      class: "room-rect" + (dest && dest.code === room.code ? " dest" : ""),
    }));

    const label = el("text", { x: room.x, y: room.y + 4, class: "room-label" });
    label.textContent = room.code;
    svg.appendChild(label);

    if (room.note) {
      const note = el("text", { x: room.x, y: room.y + 22, class: "room-note" });
      note.textContent = room.note;
      svg.appendChild(note);
    }

    const door = state.graph.nodes[room.doorNode];
    svg.appendChild(el("line", {
      x1: door.x,
      y1: door.y,
      x2: room.x,
      y2: room.y,
      class: "door-link",
    }));
  }
}

function drawServicePoints(svg) {
  for (const sp of SERVICE_POINTS) {
    svg.appendChild(el("rect", {
      x: sp.x - 22,
      y: sp.y - 14,
      width: 44,
      height: 28,
      rx: 4,
      class: "service-marker",
    }));
    const t = el("text", { x: sp.x, y: sp.y + 4, class: "service-label" });
    t.textContent = "Lift/Stair";
    svg.appendChild(t);
  }
}

function drawEntrances(svg) {
  for (const [key, entrance] of Object.entries(ENTRANCES)) {
    svg.appendChild(el("circle", {
      cx: entrance.x,
      cy: entrance.y,
      r: 18,
      class: "entrance-marker" + (state.entrance === key ? " active" : ""),
    }));
    const t = el("text", { x: entrance.x, y: entrance.y + 5, class: "entrance-marker-label" });
    t.textContent = key;
    svg.appendChild(t);
  }
}

function drawPath(svg) {
  if (!state.route || !state.route.path || state.route.path.length < 2) {
    if (state.entrance === "SW") drawRecommendedPath(svg);
    return;
  }

  const d = pathToD(state.route.path);
  svg.appendChild(el("path", {
    d,
    class: state.mode === "recommend" ? "path recommend" : "path",
  }));
}

function drawRecommendedPath(svg) {
  const d = pathToD(RECOMMENDED_SW_TO_NW);
  svg.appendChild(el("path", { d, class: "path recommend" }));
}

function drawMarkers(svg) {
  const start = state.graph.nodes[state.entranceNodeId];
  if (start) {
    svg.appendChild(el("circle", { cx: start.x, cy: start.y, r: 24, class: "node-you-ring" }));
    svg.appendChild(el("circle", { cx: start.x, cy: start.y, r: 10, class: "node-you" }));
  }

  if (!state.dest) return;
  const destNode = state.graph.nodes[`ROOM-${state.dest}`];
  if (!destNode || state.mode === "recommend") return;
  svg.appendChild(el("circle", { cx: destNode.x, cy: destNode.y, r: 10, class: "node-dest" }));
}

function pathToD(path) {
  return path
    .map((id, index) => {
      const n = state.graph.nodes[id];
      return `${index === 0 ? "M" : "L"} ${n.x} ${n.y}`;
    })
    .join(" ");
}

function el(name, attrs) {
  const e = document.createElementNS(SVG_NS, name);
  for (const key in attrs) e.setAttribute(key, attrs[key]);
  return e;
}
