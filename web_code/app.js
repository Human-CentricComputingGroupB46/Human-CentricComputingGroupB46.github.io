/* CampusCompass - one-screen EB first-floor navigator. */

const state = {
  entrance: "NW",
  entranceNodeId: ENTRANCES.NW.id,
  dest: null,
  graph: null,
  route: null,
  mode: "idle",
  map: null,
  canvas: null,
  ctx: null,
  mapProvider: null,
  mapNote: "",
  runtimeConfig: {},
  googleOverlay: null,
  editMode: false,
  editorTool: "move",
  dirtyRoomLayout: false,
  selectedRoomCode: null,
  selectedNodeId: null,
  hoverRoomCode: null,
  hoverNodeId: null,
  draggingRoomCode: null,
  dragOffset: null,
  editorMessage: "Edit mode is off.",
  editorTone: "",
  saveInFlight: false,
  roomLayoutSnapshot: "",
  roomLayoutResetData: null,
  mapSurface: null,
};

document.addEventListener("DOMContentLoaded", async () => {
  state.runtimeConfig = await loadRuntimeConfig();
  state.graph = buildGraph();
  await initMap();
  tickClock();
  setInterval(tickClock, 1000 * 15);
  wireEntrancePicker();
  wireInput();
  wireEditor();
  state.roomLayoutSnapshot = generateEditableDataSource();
  state.roomLayoutResetData = cloneEditorDataSnapshot();
  renderSuggestions("");
  renderMap();
  renderStatus();
  renderEditorState();
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

function wireEditor() {
  state.mapSurface = document.querySelector(".map-stack");

  document.getElementById("toggle-edit-mode").addEventListener("click", () => {
    setEditMode(!state.editMode);
  });

  document.getElementById("room-edit-tool").addEventListener("click", () => {
    setEditorTool("move");
  });

  document.getElementById("link-edit-tool").addEventListener("click", () => {
    setEditorTool("link");
  });

  document.getElementById("copy-room-data").addEventListener("click", copyRoomDataBlock);
  document.getElementById("save-room-data").addEventListener("click", saveRoomDataBlock);
  document.getElementById("reset-room-data").addEventListener("click", resetUnsavedRoomData);

  if (!state.mapSurface) return;

  state.mapSurface.addEventListener("pointerdown", handleEditorPointerDown);
  state.mapSurface.addEventListener("pointermove", handleEditorPointerMove);
  state.mapSurface.addEventListener("pointerup", handleEditorPointerUp);
  state.mapSurface.addEventListener("pointercancel", handleEditorPointerUp);
  state.mapSurface.addEventListener("pointerleave", handleEditorPointerLeave);
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
  refreshGraphAndRoute();
}

function refreshGraphAndRoute() {
  state.graph = buildGraph();

  if (!state.dest) {
    state.route = null;
    state.mode = state.entrance === "SW" ? "recommend" : "idle";
    renderMap();
    renderStatus();
    return;
  }

  if (state.entrance === "SW") {
    state.route = { path: RECOMMENDED_SW_TO_NW, distance: estimatePathDistance(RECOMMENDED_SW_TO_NW) };
    state.mode = "recommend";
    renderMap();
    renderStatus();
    return;
  }

  const result = dijkstra(state.graph, state.entranceNodeId, `ROOM-${state.dest}`);
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
    message.textContent = `Shortest first-floor route shown on the ${getMapSurfaceLabel()}.`;
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
  message.textContent = `Only EB first-floor rooms are available. Room positions are approximate on the ${getMapSurfaceLabel()}.`;
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

async function initMap() {
  state.canvas = document.getElementById("map-overlay");
  state.ctx = state.canvas.getContext("2d");

  if (MAP_PROVIDER.preferred === "google") {
    const ready = await initGoogleMap();
    if (ready) {
      renderMapSourceNote();
      return;
    }
  }

  initLeafletMap();
  renderMapSourceNote();
}

async function initGoogleMap() {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    state.mapNote = "Google Maps API key is not available in the local runtime config, so the page is using the open fallback layer.";
    return false;
  }

  try {
    await loadGoogleMapsApi(apiKey);
  } catch (error) {
    console.error("Failed to load Google Maps JS API", error);
    state.mapNote = "Google Maps JS API failed to load, so the page is using the open fallback layer.";
    return false;
  }

  state.mapProvider = "google";
  state.map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: GEO_REFERENCE.centerLat, lng: GEO_REFERENCE.centerLng },
    zoom: MAP_PROVIDER.googleInitialZoom,
    minZoom: MAP_PROVIDER.googleMinZoom,
    maxZoom: MAP_PROVIDER.googleMaxZoom,
    mapTypeId: MAP_PROVIDER.googleMapTypeId,
    disableDefaultUI: false,
    gestureHandling: "greedy",
    keyboardShortcuts: true,
    clickableIcons: false,
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: false,
  });

  state.googleOverlay = new google.maps.OverlayView();
  state.googleOverlay.onAdd = () => {};
  state.googleOverlay.onRemove = () => {};
  state.googleOverlay.draw = () => renderMap();
  state.googleOverlay.setMap(state.map);

  const bounds = new google.maps.LatLngBounds(
    { lat: getBuildingBounds().getSouth(), lng: getBuildingBounds().getWest() },
    { lat: getBuildingBounds().getNorth(), lng: getBuildingBounds().getEast() }
  );
  state.map.fitBounds(bounds, 32);

  state.map.addListener("bounds_changed", renderMap);
  state.map.addListener("zoom_changed", renderMap);
  state.map.addListener("drag", renderMap);
  window.addEventListener("resize", syncOverlaySize);
  syncOverlaySize();
  state.mapNote = "Base layer: Google Maps satellite imagery. Indoor rooms, nodes, and routes are canvas overlays anchored near the EB building coordinate.";
  return true;
}

function initLeafletMap() {
  state.mapProvider = "leaflet";

  state.map = L.map("map", {
    zoomControl: true,
    attributionControl: true,
    minZoom: GEO_REFERENCE.minZoom,
    maxZoom: GEO_REFERENCE.maxZoom,
    scrollWheelZoom: true,
    preferCanvas: true,
  });

  L.tileLayer(GEO_REFERENCE.tileUrl, {
    attribution: GEO_REFERENCE.tileAttribution,
    minZoom: GEO_REFERENCE.minZoom,
    maxZoom: GEO_REFERENCE.maxZoom,
    crossOrigin: true,
  }).addTo(state.map);

  syncOverlaySize();
  state.map.fitBounds(getBuildingBounds(), {
    padding: [32, 32],
    maxZoom: GEO_REFERENCE.initialZoom,
  });

  state.map.on("move zoom resize", renderMap);
  window.addEventListener("resize", syncOverlaySize);
  if (!state.mapNote) {
    state.mapNote = "Base layer: open terrain tiles. Indoor rooms and routes are canvas overlays anchored near the EB building coordinate.";
  }
}

function renderMap() {
  if (!state.map || !state.ctx || !state.canvas) return;

  syncOverlaySize();

  const ctx = state.ctx;
  const rect = state.canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  drawNorthBadge(ctx);
  drawBase(ctx);
  drawEdges(ctx);
  drawRooms(ctx);
  drawServicePoints(ctx);
  drawEntrances(ctx);
  drawPath(ctx);
  drawMarkers(ctx);
  drawEditorOverlay(ctx);
}

function drawBase(ctx) {
  drawGeoRect(ctx, BUILDING_SHELL.x, BUILDING_SHELL.y, BUILDING_SHELL.w, BUILDING_SHELL.h, {
    fillStyle: "rgba(255, 255, 255, 0.84)",
    strokeStyle: "rgba(169, 180, 199, 0.92)",
    lineWidth: 2,
  });

  for (const area of INACCESSIBLE_AREAS) {
    drawGeoRect(ctx, area.x, area.y, area.w, area.h, {
      fillStyle: "rgba(215, 221, 232, 0.92)",
      strokeStyle: "rgba(184, 194, 210, 0.95)",
      lineWidth: 1.4,
    });

    const center = projectLocalPoint(area.x + area.w / 2, area.y + area.h / 2);
    if (center) {
      ctx.save();
      ctx.fillStyle = "#738097";
      ctx.font = "700 12px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(area.label, center.x, center.y);
      ctx.restore();
    }
  }
}

function drawEdges(ctx) {
  for (const segment of getRenderableGraphLinks()) {
    const a = state.graph.nodes[segment.from];
    const b = state.graph.nodes[segment.to];
    if (!a || !b) continue;

    drawGeoLine(ctx, a.x, a.y, b.x, b.y, {
      strokeStyle: segment.kind === "doorway" ? "rgba(107, 123, 146, 0.98)" : "rgba(169, 194, 227, 0.95)",
      lineWidth: segment.kind === "doorway" ? localUnitsToPixels(4) : localUnitsToPixels(18),
      lineDash: segment.kind === "doorway" ? [7, 6] : [],
    });
  }
}

function getNonRoomNodes() {
  return [...Object.values(ENTRANCES), ...SERVICE_POINTS, ...WALKABLE_NODES];
}

function getGraphNodeById(id) {
  return getNonRoomNodes().find(node => node.id === id) || null;
}

function findEditableNodeRecord(nodeId) {
  if (!nodeId) return null;

  if (nodeId.startsWith("ROOM-")) {
    const room = getRoom(nodeId.slice(5));
    return room
      ? { id: nodeId, label: room.code, kind: "room", type: "room", data: room }
      : null;
  }

  const node = getGraphNodeById(nodeId);
  if (!node) return null;

  return {
    id: node.id,
    label: node.label || node.id,
    kind: getGraphNodeKind(node.id),
    type: "node",
    data: node,
  };
}

function getGraphNodeKind(nodeId) {
  if (Object.values(ENTRANCES).some(node => node.id === nodeId)) return "entrance";
  if (SERVICE_POINTS.some(node => node.id === nodeId)) return "service";
  return "corridor";
}

function getEditableNodeLocalPoint(nodeId) {
  const record = findEditableNodeRecord(nodeId);
  if (!record) return null;

  if (record.type === "room") return getRoomLocalPoint(record.data);
  return { x: record.data.x, y: record.data.y };
}

function getEditableNodeLatLng(nodeId) {
  const record = findEditableNodeRecord(nodeId);
  if (!record) return null;

  if (record.type === "room") return getRoomLatLng(record.data);
  return localPointToLatLng(record.data.x, record.data.y);
}

function getEditableNodeScreenPoint(nodeId) {
  const point = getEditableNodeLocalPoint(nodeId);
  return point ? projectLocalPoint(point.x, point.y) : null;
}

function getNodeLinks(node) {
  return normalizeLinkDescriptors(node?.links, "corridor");
}

function getRoomLinks(room) {
  return normalizeLinkDescriptors(room?.links, "room");
}

function normalizeLinkDescriptors(links, defaultKind) {
  return (links || []).map(link => {
    if (typeof link === "string") return { to: link, kind: defaultKind };
    return { to: link.to, kind: link.kind || defaultKind };
  });
}

function getRenderableGraphLinks() {
  const seen = new Set();
  const segments = [];

  for (const node of getNonRoomNodes()) {
    for (const link of getNodeLinks(node)) {
      if (link.to.startsWith("ROOM-")) continue;
      const pairKey = [node.id, link.to].sort().join("::");
      if (seen.has(pairKey)) continue;
      segments.push({ from: node.id, to: link.to, kind: link.kind || "corridor" });
      seen.add(pairKey);
    }
  }

  return segments;
}

function drawRooms(ctx) {
  const dest = state.dest ? getRoom(state.dest) : null;
  const showLabels = state.editMode || getMapZoom() >= 19;
  const showNotes = state.editMode || getMapZoom() >= 20;

  for (const room of ROOM_DATA[1]) {
    const roomPoint = getRoomLocalPoint(room);
    const isSelected = state.selectedRoomCode === room.code;
    const isHover = state.hoverRoomCode === room.code;
    if (!roomPoint) continue;

    drawGeoRect(ctx, roomPoint.x - room.w / 2, roomPoint.y - room.h / 2, room.w, room.h, {
      fillStyle: dest && dest.code === room.code
        ? "rgba(217, 242, 230, 0.95)"
        : isSelected && state.editMode
          ? "rgba(255, 242, 220, 0.97)"
          : "rgba(255, 255, 255, 0.96)",
      strokeStyle: dest && dest.code === room.code
        ? "#167a55"
        : isSelected
          ? "#f29325"
          : isHover && state.editMode
            ? "#0b1f3a"
            : "#aeb9ca",
      lineWidth: dest && dest.code === room.code ? 2.4 : isSelected ? 2.6 : isHover && state.editMode ? 2 : 1.3,
    });

    if (showLabels || (dest && dest.code === room.code)) {
      const labelPoint = projectLocalPoint(roomPoint.x, roomPoint.y);
      if (labelPoint) {
        ctx.save();
        ctx.fillStyle = "#20293b";
        ctx.font = "800 12px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(room.code, labelPoint.x, labelPoint.y);
        ctx.restore();
      }
    }

    if (showNotes && room.note) {
      const notePoint = projectLocalPoint(roomPoint.x, roomPoint.y + 22);
      if (notePoint) {
        ctx.save();
        ctx.fillStyle = "#5c6678";
        ctx.font = "700 10px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(room.note, notePoint.x, notePoint.y);
        ctx.restore();
      }
    }

    for (const link of getRoomLinks(room)) {
      const door = state.graph.nodes[link.to];
      if (!door) continue;
      drawGeoLine(ctx, door.x, door.y, roomPoint.x, roomPoint.y, {
        strokeStyle: "rgba(141, 166, 198, 0.95)",
        lineWidth: localUnitsToPixels(2),
        lineDash: [4, 4],
      });
    }
  }
}

function drawServicePoints(ctx) {
  for (const sp of SERVICE_POINTS) {
    const point = projectLocalPoint(sp.x, sp.y);
    if (!point) continue;
    drawScreenRoundedRect(ctx, point.x - 24, point.y - 15, 48, 30, 5, {
      fillStyle: "rgba(255, 255, 255, 0.97)",
      strokeStyle: "#78849a",
      lineWidth: 1.3,
    });
    ctx.save();
    ctx.fillStyle = "#4c586e";
    ctx.font = "800 9px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Lift/Stair", point.x, point.y + 1);
    ctx.restore();
  }
}

function drawEntrances(ctx) {
  for (const [key, entrance] of Object.entries(ENTRANCES)) {
    const point = projectLocalPoint(entrance.x, entrance.y);
    if (!point) continue;
    ctx.save();
    ctx.beginPath();
    ctx.arc(point.x, point.y, 18, 0, Math.PI * 2);
    ctx.fillStyle = state.entrance === key ? "#fff2dc" : "rgba(255, 255, 255, 0.96)";
    ctx.strokeStyle = state.entrance === key ? "#f29325" : "#0b1f3a";
    ctx.lineWidth = state.entrance === key ? 4 : 2.5;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#0b1f3a";
    ctx.font = "900 13px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(key, point.x, point.y + 1);
    ctx.restore();
  }
}

function drawPath(ctx) {
  if (!state.route || !state.route.path || state.route.path.length < 2) {
    if (state.entrance === "SW") drawRecommendedPath(ctx);
    return;
  }

  drawPolyline(ctx, state.route.path, {
    strokeStyle: state.mode === "recommend" ? "#b8322a" : "#f29325",
    lineWidth: 7,
    lineDash: state.mode === "recommend" ? [12, 10] : [],
  });
}

function drawRecommendedPath(ctx) {
  drawPolyline(ctx, RECOMMENDED_SW_TO_NW, {
    strokeStyle: "#b8322a",
    lineWidth: 7,
    lineDash: [12, 10],
  });
}

function drawMarkers(ctx) {
  const start = state.graph.nodes[state.entranceNodeId];
  if (start) {
    const point = projectLocalPoint(start.x, start.y);
    if (point) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(point.x, point.y, 24, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(242, 147, 37, 0.65)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = "#f29325";
      ctx.fill();
      ctx.restore();
    }
  }

  if (!state.dest) return;
  const destNode = state.graph.nodes[`ROOM-${state.dest}`];
  if (!destNode || state.mode === "recommend") return;
  const destPoint = projectLocalPoint(destNode.x, destNode.y);
  if (!destPoint) return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(destPoint.x, destPoint.y, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#167a55";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawNorthBadge(ctx) {
  ctx.save();
  drawScreenRoundedRect(ctx, 16, 16, 134, 56, 10, {
    fillStyle: "rgba(11, 31, 58, 0.82)",
    strokeStyle: "rgba(255, 255, 255, 0.2)",
    lineWidth: 1,
  });
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 14px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("N", 32, 32);
  ctx.beginPath();
  ctx.moveTo(36, 56);
  ctx.lineTo(48, 28);
  ctx.lineTo(60, 56);
  ctx.closePath();
  ctx.fillStyle = "#f29325";
  ctx.fill();
  ctx.fillStyle = "#d7e1f1";
  ctx.font = "700 11px Arial, sans-serif";
  ctx.fillText(getMapBadgeText(), 74, 46);
  ctx.restore();
}

function drawPolyline(ctx, path, style) {
  const points = path
    .map(id => {
      const node = state.graph.nodes[id];
      return node ? projectLocalPoint(node.x, node.y) : null;
    })
    .filter(Boolean);

  if (points.length < 2) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index].x, points[index].y);
  }
  ctx.strokeStyle = style.strokeStyle;
  ctx.lineWidth = style.lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash(style.lineDash || []);
  ctx.stroke();
  ctx.restore();
}

function drawGeoLine(ctx, x1, y1, x2, y2, style) {
  const start = projectLocalPoint(x1, y1);
  const end = projectLocalPoint(x2, y2);
  if (!start || !end) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = style.strokeStyle;
  ctx.lineWidth = style.lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash(style.lineDash || []);
  ctx.stroke();
  ctx.restore();
}

function drawGeoRect(ctx, x, y, w, h, style) {
  const corners = [
    projectLocalPoint(x, y),
    projectLocalPoint(x + w, y),
    projectLocalPoint(x + w, y + h),
    projectLocalPoint(x, y + h),
  ];

  if (corners.some(point => !point)) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let index = 1; index < corners.length; index += 1) {
    ctx.lineTo(corners[index].x, corners[index].y);
  }
  ctx.closePath();
  ctx.fillStyle = style.fillStyle;
  ctx.strokeStyle = style.strokeStyle;
  ctx.lineWidth = style.lineWidth;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawScreenRoundedRect(ctx, x, y, w, h, r, style) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = style.fillStyle;
  ctx.strokeStyle = style.strokeStyle;
  ctx.lineWidth = style.lineWidth;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function syncOverlaySize() {
  if (!state.canvas || !state.ctx) return;

  const rect = state.canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.round(rect.width * dpr);
  const height = Math.round(rect.height * dpr);

  if (state.canvas.width !== width || state.canvas.height !== height) {
    state.canvas.width = width;
    state.canvas.height = height;
  }

  state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function localPointToLatLng(x, y) {
  return mapLocalPointToLatLng(x, y);
}

function latLngToLocalPoint(lat, lng) {
  return mapLatLngToLocalPoint(lat, lng);
}

function projectLocalPoint(x, y) {
  if (!state.map) return null;
  const latLng = localPointToLatLng(x, y);

  if (state.mapProvider === "google") {
    const projection = state.googleOverlay?.getProjection?.();
    if (!projection) return null;
    const pixel = projection.fromLatLngToContainerPixel(new google.maps.LatLng(latLng.lat, latLng.lng));
    return pixel ? { x: pixel.x, y: pixel.y } : null;
  }

  return state.map.latLngToContainerPoint(L.latLng(latLng.lat, latLng.lng));
}

function containerPointToLatLng(x, y) {
  if (!state.map) return null;

  if (state.mapProvider === "google") {
    const projection = state.googleOverlay?.getProjection?.();
    if (!projection) return null;
    const latLng = projection.fromContainerPixelToLatLng(new google.maps.Point(x, y));
    if (!latLng) return null;
    return { lat: latLng.lat(), lng: latLng.lng() };
  }

  const latLng = state.map.containerPointToLatLng(L.point(x, y));
  return latLng ? { lat: latLng.lat, lng: latLng.lng } : null;
}

function getRoomCenterLocalPoint(room) {
  return getRoomLocalPoint(room);
}

function getRoomCenterScreenPoint(room) {
  const roomPoint = getRoomCenterLocalPoint(room);
  return roomPoint ? projectLocalPoint(roomPoint.x, roomPoint.y) : null;
}

function getRoomScreenPolygon(room) {
  const roomPoint = getRoomCenterLocalPoint(room);
  if (!roomPoint) return null;

  const polygon = [
    projectLocalPoint(roomPoint.x - room.w / 2, roomPoint.y - room.h / 2),
    projectLocalPoint(roomPoint.x + room.w / 2, roomPoint.y - room.h / 2),
    projectLocalPoint(roomPoint.x + room.w / 2, roomPoint.y + room.h / 2),
    projectLocalPoint(roomPoint.x - room.w / 2, roomPoint.y + room.h / 2),
  ];

  return polygon.some(point => !point) ? null : polygon;
}

function pickRoomAtScreenPoint(x, y) {
  for (let index = ROOM_DATA[1].length - 1; index >= 0; index -= 1) {
    const room = ROOM_DATA[1][index];
    const polygon = getRoomScreenPolygon(room);
    if (polygon && pointInPolygon({ x, y }, polygon)) return room;
  }
  return null;
}

function getEditableNodeIds() {
  return [
    ...getNonRoomNodes().map(node => node.id),
    ...ROOM_DATA[1].map(room => `ROOM-${room.code}`),
  ];
}

function pickEditableNodeAtScreenPoint(x, y) {
  let bestMatch = null;

  for (const nodeId of getEditableNodeIds()) {
    const point = getEditableNodeScreenPoint(nodeId);
    if (!point) continue;
    const dx = point.x - x;
    const dy = point.y - y;
    const distance = Math.hypot(dx, dy);
    const threshold = nodeId.startsWith("ROOM-") ? 18 : 14;
    if (distance > threshold) continue;

    if (!bestMatch || distance < bestMatch.distance) {
      bestMatch = { nodeId, distance };
    }
  }

  return bestMatch ? findEditableNodeRecord(bestMatch.nodeId) : null;
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersects = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / ((yj - yi) || 1e-7) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function getSurfacePointFromEvent(event) {
  const rect = state.canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function isEditorControlTarget(target) {
  return Boolean(target.closest(".leaflet-control, .gm-style button, .gm-style [role='button']"));
}

function getBuildingBounds() {
  const northWest = localPointToLatLng(BUILDING_SHELL.x, BUILDING_SHELL.y);
  const southEast = localPointToLatLng(BUILDING_SHELL.x + BUILDING_SHELL.w, BUILDING_SHELL.y + BUILDING_SHELL.h);
  return L.latLngBounds(L.latLng(northWest.lat, northWest.lng), L.latLng(southEast.lat, southEast.lng));
}

function localUnitsToPixels(units) {
  const meters = units / GEO_REFERENCE.unitsPerMeter;
  return Math.max(1, meters / getMetersPerPixel());
}

function getMetersPerPixel() {
  const latitude = getMapCenterLat() * Math.PI / 180;
  return 156543.03392 * Math.cos(latitude) / Math.pow(2, state.map ? state.map.getZoom() : GEO_REFERENCE.initialZoom);
}

function metersToLatitude(meters) {
  return meters / 111320;
}

function metersToLongitude(meters, latitude) {
  return meters / (111320 * Math.cos(latitude * Math.PI / 180));
}

function getMapZoom() {
  return state.map ? state.map.getZoom() : GEO_REFERENCE.initialZoom;
}

function getMapCenterLat() {
  if (!state.map) return GEO_REFERENCE.centerLat;
  if (state.mapProvider === "google") {
    const center = state.map.getCenter();
    return center ? center.lat() : GEO_REFERENCE.centerLat;
  }
  return state.map.getCenter().lat;
}

function getMapBadgeText() {
  if (state.mapProvider === "google") return "Google Maps + indoor overlay";
  return "Terrain + indoor overlay";
}

function getMapSurfaceLabel() {
  if (state.mapProvider === "google") return "Google Maps base layer";
  return "terrain map";
}

function drawEditorOverlay(ctx) {
  if (!state.editMode) return;

  if (state.editorTool === "link") {
    drawLinkEditorNodes(ctx);
    drawSelectedNodeBadge(ctx, state.selectedNodeId || state.hoverNodeId);
    return;
  }

  const roomId = state.selectedRoomCode ? `ROOM-${state.selectedRoomCode}` : null;
  drawSelectedNodeBadge(ctx, roomId);
}

function drawLinkEditorNodes(ctx) {
  for (const nodeId of getEditableNodeIds()) {
    const point = getEditableNodeScreenPoint(nodeId);
    const record = findEditableNodeRecord(nodeId);
    if (!point || !record) continue;

    const isSelected = state.selectedNodeId === nodeId;
    const isHover = state.hoverNodeId === nodeId;
    const radius = record.kind === "room" ? 7 : 5;

    ctx.save();
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? "#f29325" : isHover ? "#0b1f3a" : "rgba(11, 31, 58, 0.68)";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawSelectedNodeBadge(ctx, nodeId) {
  if (!nodeId) return;

  const point = getEditableNodeScreenPoint(nodeId);
  const record = findEditableNodeRecord(nodeId);
  const latLng = getEditableNodeLatLng(nodeId);
  if (!point || !record || !latLng) return;

  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
  ctx.fillStyle = "#f29325";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();

  const badgeWidth = 220;
  const badgeX = Math.min(point.x + 16, state.canvas.getBoundingClientRect().width - badgeWidth - 12);
  const badgeY = Math.max(14, point.y - 56);
  drawScreenRoundedRect(ctx, badgeX, badgeY, badgeWidth, 48, 8, {
    fillStyle: "rgba(11, 31, 58, 0.9)",
    strokeStyle: "rgba(255, 255, 255, 0.18)",
    lineWidth: 1,
  });
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 12px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(record.label, badgeX + 12, badgeY + 16);
  ctx.fillStyle = "#d7e1f1";
  ctx.font = "700 10px Arial, sans-serif";
  ctx.fillText(`${formatCoordinate(latLng.lat)}, ${formatCoordinate(latLng.lng)}`, badgeX + 12, badgeY + 32);
  ctx.restore();
}

function setEditMode(enabled) {
  state.editMode = enabled;
  state.hoverRoomCode = null;
  state.hoverNodeId = null;

  if (!enabled) {
    state.draggingRoomCode = null;
    state.dragOffset = null;
    state.selectedNodeId = null;
    state.mapSurface?.classList.remove("dragging");
    setEditorMessage("Edit mode is off.");
  } else {
    state.selectedRoomCode = state.selectedRoomCode || state.dest || ROOM_DATA[1][0]?.code || null;
    setEditorTool(state.editorTool);
  }

  setMapInteractionEnabled(!enabled);
  state.mapSurface?.classList.toggle("editing", enabled);
  renderEditorState();
  renderMap();
}

function setEditorTool(tool) {
  state.editorTool = tool;
  state.draggingRoomCode = null;
  state.dragOffset = null;
  state.hoverRoomCode = null;
  state.hoverNodeId = null;

  if (tool === "move") {
    state.selectedNodeId = null;
    state.selectedRoomCode = state.selectedRoomCode || state.dest || ROOM_DATA[1][0]?.code || null;
    setEditorMessage(
      canSaveRoomDataToFile()
        ? "Move Rooms is active. Drag a room to update its lat/lng, then save the layout blocks back to data.js."
        : "Move Rooms is active. Drag a room to update its lat/lng. Direct file save requires the local editor server.",
      canSaveRoomDataToFile() ? "" : "warn"
    );
  } else {
    state.selectedRoomCode = null;
    setEditorMessage(
      "Edit Links is active. Click one node to select it, then click another node to add or remove a bidirectional link.",
      ""
    );
  }

  renderEditorState();
  renderMap();
}

function setMapInteractionEnabled(enabled) {
  if (!state.map) return;

  if (state.mapProvider === "google") {
    state.map.setOptions({
      draggable: enabled,
      scrollwheel: enabled,
      disableDoubleClickZoom: !enabled,
      keyboardShortcuts: enabled,
      gestureHandling: enabled ? "greedy" : "none",
    });
    return;
  }

  const methods = ["dragging", "scrollWheelZoom", "doubleClickZoom", "touchZoom", "boxZoom", "keyboard"];
  methods.forEach(method => {
    if (!state.map[method]) return;
    if (enabled) {
      state.map[method].enable();
    } else {
      state.map[method].disable();
    }
  });
}

function handleEditorPointerDown(event) {
  if (!state.editMode || isEditorControlTarget(event.target)) return;

  const point = getSurfacePointFromEvent(event);
  if (state.editorTool === "link") {
    handleLinkEditorPointerDown(point);
    event.preventDefault();
    return;
  }

  const room = pickRoomAtScreenPoint(point.x, point.y);
  state.selectedRoomCode = room ? room.code : null;
  state.hoverRoomCode = room ? room.code : null;

  if (!room) {
    setEditorMessage("Click a room, then drag it to place its saved lat/lng anchor.");
    renderEditorState();
    renderMap();
    return;
  }

  const center = getRoomCenterScreenPoint(room);
  state.draggingRoomCode = room.code;
  state.dragOffset = center ? { x: point.x - center.x, y: point.y - center.y } : { x: 0, y: 0 };
  state.mapSurface?.classList.add("dragging");
  state.mapSurface?.setPointerCapture?.(event.pointerId);
  setEditorMessage(`Dragging ${room.code}. Release to keep the new saved position.`);
  renderEditorState();
  renderMap();
  event.preventDefault();
}

function handleLinkEditorPointerDown(point) {
  const record = pickEditableNodeAtScreenPoint(point.x, point.y);
  state.hoverNodeId = record ? record.id : null;

  if (!record) {
    setEditorMessage("Click a node handle to select it, then click a second node to toggle adjacency.");
    renderEditorState();
    renderMap();
    return;
  }

  if (!state.selectedNodeId || state.selectedNodeId === record.id) {
    state.selectedNodeId = state.selectedNodeId === record.id ? null : record.id;
    setEditorMessage(
      state.selectedNodeId
        ? `Selected ${record.label}. Click another node to toggle a bidirectional link.`
        : "Node selection cleared.",
      ""
    );
    renderEditorState();
    renderMap();
    return;
  }

  const changed = toggleBidirectionalLink(state.selectedNodeId, record.id);
  if (changed) {
    const source = findEditableNodeRecord(state.selectedNodeId);
    setEditorMessage(`Toggled link between ${source?.label || state.selectedNodeId} and ${record.label}.`, "success");
    markEditorDirty();
    refreshGraphAndRoute();
    renderEditorState();
  }
}

function handleEditorPointerMove(event) {
  if (!state.editMode || isEditorControlTarget(event.target)) return;

  const point = getSurfacePointFromEvent(event);

  if (state.editorTool === "link") {
    const record = pickEditableNodeAtScreenPoint(point.x, point.y);
    const nextHover = record ? record.id : null;
    if (nextHover !== state.hoverNodeId) {
      state.hoverNodeId = nextHover;
      renderMap();
    }
    return;
  }

  if (state.draggingRoomCode) {
    const targetPoint = {
      x: point.x - (state.dragOffset?.x || 0),
      y: point.y - (state.dragOffset?.y || 0),
    };
    const latLng = containerPointToLatLng(targetPoint.x, targetPoint.y);
    if (!latLng) return;
    updateRoomPosition(state.draggingRoomCode, latLng.lat, latLng.lng);
    event.preventDefault();
    return;
  }

  const room = pickRoomAtScreenPoint(point.x, point.y);
  const nextHover = room ? room.code : null;
  if (nextHover !== state.hoverRoomCode) {
    state.hoverRoomCode = nextHover;
    renderMap();
  }
}

function handleEditorPointerUp(event) {
  if (state.editorTool !== "move") return;
  if (!state.draggingRoomCode) return;

  const roomCode = state.draggingRoomCode;
  state.draggingRoomCode = null;
  state.dragOffset = null;
  state.mapSurface?.releasePointerCapture?.(event.pointerId);
  state.mapSurface?.classList.remove("dragging");
  setEditorMessage(`Moved ${roomCode}. Save to data.js to persist it, or reset unsaved changes to revert.`);
  renderEditorState();
  renderMap();
}

function handleEditorPointerLeave() {
  if (!state.editMode || state.draggingRoomCode) return;
  if (state.editorTool === "link") {
    if (state.hoverNodeId) {
      state.hoverNodeId = null;
      renderMap();
    }
    return;
  }

  if (state.hoverRoomCode) {
    state.hoverRoomCode = null;
    renderMap();
  }
}

function updateRoomPosition(roomCode, lat, lng) {
  const room = getRoom(roomCode);
  if (!room) return;

  room.lat = roundCoordinate(lat);
  room.lng = roundCoordinate(lng);
  markEditorDirty();
  state.graph = buildGraph();

  if (state.dest === roomCode) {
    refreshGraphAndRoute();
  } else {
    renderMap();
  }

  renderEditorState();
}

function resetUnsavedRoomData() {
  if (!state.dirtyRoomLayout || !state.roomLayoutResetData) return;

  applyEditorDataSnapshot(state.roomLayoutResetData);
  state.dirtyRoomLayout = false;
  state.graph = buildGraph();
  setEditorMessage("Unsaved room edits were reverted.", "success");
  refreshGraphAndRoute();
  renderEditorState();
}

async function copyRoomDataBlock() {
  const block = generateEditableDataSource();
  try {
    await navigator.clipboard.writeText(block);
    setEditorMessage("Copied the current layout data blocks to the clipboard.", "success");
  } catch (error) {
    console.error("Failed to copy layout data blocks", error);
    setEditorMessage("Copy failed in this browser context. Use the textarea below and copy manually.", "warn");
  }
  renderEditorState();
}

async function saveRoomDataBlock() {
  if (state.saveInFlight || !state.dirtyRoomLayout) return;

  if (!canSaveRoomDataToFile()) {
    setEditorMessage("Direct save is only available when the page is opened from the local editor server over http://localhost.", "warn");
    renderEditorState();
    return;
  }

  state.saveInFlight = true;
  renderEditorState();

  try {
    const response = await fetch("/api/save-room-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks: generateEditableDataBlocks() }),
    });

    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || `Save failed with status ${response.status}`);
    }

    state.roomLayoutSnapshot = generateEditableDataSource();
    state.roomLayoutResetData = cloneEditorDataSnapshot();
    state.dirtyRoomLayout = false;
    setEditorMessage(`Saved updated node links and room lat/lng back to data.js at ${new Date(result.savedAt).toLocaleTimeString()}.`, "success");
  } catch (error) {
    console.error("Failed to save layout data blocks", error);
    setEditorMessage(`Save failed: ${error.message}`, "warn");
  } finally {
    state.saveInFlight = false;
    renderEditorState();
  }
}

function renderEditorState() {
  const toggle = document.getElementById("toggle-edit-mode");
  const save = document.getElementById("save-room-data");
  const copy = document.getElementById("copy-room-data");
  const reset = document.getElementById("reset-room-data");
  const moveTool = document.getElementById("room-edit-tool");
  const linkTool = document.getElementById("link-edit-tool");
  const message = document.getElementById("editor-message");
  const selection = document.getElementById("editor-selection");
  const neighbors = document.getElementById("editor-neighbors");
  const exportBox = document.getElementById("editor-export");

  if (!toggle || !save || !copy || !reset || !moveTool || !linkTool || !message || !selection || !neighbors || !exportBox) return;

  const selectedRecord = state.editorTool === "link"
    ? findEditableNodeRecord(state.selectedNodeId)
    : (state.selectedRoomCode ? findEditableNodeRecord(`ROOM-${state.selectedRoomCode}`) : null);
  const selectedLatLng = selectedRecord ? getEditableNodeLatLng(selectedRecord.id) : null;
  const selectedLinks = selectedRecord ? getLinksForRecord(selectedRecord) : [];

  toggle.textContent = state.editMode ? "Exit Edit Mode" : "Edit Rooms";
  save.disabled = !state.dirtyRoomLayout || state.saveInFlight || !canSaveRoomDataToFile();
  copy.disabled = state.saveInFlight;
  reset.disabled = !state.dirtyRoomLayout || state.saveInFlight;
  moveTool.classList.toggle("active-tool", state.editorTool === "move");
  linkTool.classList.toggle("active-tool", state.editorTool === "link");

  message.className = `editor-message${state.editorTone ? ` ${state.editorTone}` : ""}`;
  message.textContent = state.editorMessage;

  selection.textContent = selectedRecord && selectedLatLng
    ? `Selected ${selectedRecord.kind}: ${selectedRecord.label} · lat ${formatCoordinate(selectedLatLng.lat)} · lng ${formatCoordinate(selectedLatLng.lng)}`
    : "Selected item: --";

  neighbors.textContent = selectedRecord
    ? `Neighbors: ${selectedLinks.length ? selectedLinks.map(link => findEditableNodeRecord(link.to)?.label || link.to).join(", ") : "--"}`
    : "Neighbors: --";

  exportBox.value = state.editMode || state.dirtyRoomLayout ? generateEditableDataSource() : "";
  state.mapSurface?.classList.toggle("editing", state.editMode);
  state.mapSurface?.classList.toggle("dragging", Boolean(state.draggingRoomCode));
}

function generateEditableDataSource() {
  const blocks = generateEditableDataBlocks();
  return [blocks.ENTRANCES, blocks.SERVICE_POINTS, blocks.WALKABLE_NODES, blocks.ROOM_DATA].join("\n\n");
}

function generateEditableDataBlocks() {
  return {
    ENTRANCES: generateEntrancesBlock(),
    SERVICE_POINTS: generateServicePointsBlock(),
    WALKABLE_NODES: generateWalkableNodesBlock(),
    ROOM_DATA: generateRoomDataBlock(),
  };
}

function generateEntrancesBlock() {
  const entries = Object.entries(ENTRANCES)
    .map(([key, value]) => `  ${key}: ${formatGraphNodeEntry(value, ["id", "label", "x", "y", "hint", "links"] )},`)
    .join("\n");
  return `const ENTRANCES = {\n${entries}\n};`;
}

function generateServicePointsBlock() {
  const entries = SERVICE_POINTS.map(point => `  ${formatGraphNodeEntry(point, ["id", "label", "x", "y", "entrance", "links"])},`).join("\n");
  return `const SERVICE_POINTS = [\n${entries}\n];`;
}

function generateWalkableNodesBlock() {
  const entries = WALKABLE_NODES.map(node => `  ${formatGraphNodeEntry(node, ["id", "x", "y", "label", "links"])},`).join("\n");
  return `const WALKABLE_NODES = [\n${entries}\n];`;
}

function generateRoomDataBlock() {
  const floorEntries = Object.keys(ROOM_DATA)
    .sort((a, b) => Number(a) - Number(b))
    .map(floor => {
      const rooms = ROOM_DATA[floor].map(room => `    ${formatRoomDataEntry(room)}`).join("\n");
      return `  ${floor}: [\n${rooms}\n  ],`;
    })
    .join("\n");

  return `const ROOM_DATA = {\n${floorEntries}\n};`;
}

function formatGraphNodeEntry(node, fieldOrder) {
  const parts = [];
  for (const field of fieldOrder) {
    if (node[field] == null) continue;
    if (field === "links") {
      parts.push(`links: ${formatLinksValue(node.links, node.id.startsWith("ROOM-") ? "room" : "corridor")}`);
      continue;
    }
    parts.push(`${field}: ${formatValue(node[field])}`);
  }
  return `{ ${parts.join(", ")} }`;
}

function formatRoomDataEntry(room) {
  const parts = [
    `code: ${JSON.stringify(room.code)}`,
    `lat: ${formatCoordinate(room.lat)}`,
    `lng: ${formatCoordinate(room.lng)}`,
    `w: ${room.w}`,
    `h: ${room.h}`,
    `zone: ${JSON.stringify(room.zone)}`,
    `links: ${formatLinksValue(room.links, "room")}`,
  ];

  if (room.note) {
    parts.push(`note: ${JSON.stringify(room.note)}`);
  }

  return `{ ${parts.join(", ")} },`;
}

function formatLinksValue(links, defaultKind) {
  return `[${normalizeLinkDescriptors(links, defaultKind).map(link => `{ to: ${JSON.stringify(link.to)}, kind: ${JSON.stringify(link.kind)} }`).join(", ")}]`;
}

function formatValue(value) {
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
}

function cloneEditorDataSnapshot() {
  return {
    entrances: JSON.parse(JSON.stringify(ENTRANCES)),
    servicePoints: JSON.parse(JSON.stringify(SERVICE_POINTS)),
    walkableNodes: JSON.parse(JSON.stringify(WALKABLE_NODES)),
    roomData: JSON.parse(JSON.stringify(ROOM_DATA)),
  };
}

function applyEditorDataSnapshot(snapshot) {
  for (const key of Object.keys(ENTRANCES)) {
    ENTRANCES[key] = JSON.parse(JSON.stringify(snapshot.entrances[key]));
  }

  SERVICE_POINTS.length = 0;
  snapshot.servicePoints.forEach(node => SERVICE_POINTS.push(JSON.parse(JSON.stringify(node))));

  WALKABLE_NODES.length = 0;
  snapshot.walkableNodes.forEach(node => WALKABLE_NODES.push(JSON.parse(JSON.stringify(node))));

  for (const floor of Object.keys(ROOM_DATA)) {
    ROOM_DATA[floor].length = 0;
  }

  for (const [floor, rooms] of Object.entries(snapshot.roomData)) {
    ROOM_DATA[floor] = rooms.map(room => JSON.parse(JSON.stringify(room)));
  }
}

function markEditorDirty() {
  state.dirtyRoomLayout = generateEditableDataSource() !== state.roomLayoutSnapshot;
}

function getLinksForRecord(record) {
  return record?.type === "room" ? getRoomLinks(record.data) : getNodeLinks(record?.data);
}

function toggleBidirectionalLink(aId, bId) {
  const source = findEditableNodeRecord(aId);
  const target = findEditableNodeRecord(bId);
  if (!source || !target || source.id === target.id) return false;

  const kind = inferLinkKind(source, target);
  const hasExisting = hasLinkTo(source, target.id);

  if (hasExisting) {
    removeLinkFromRecord(source, target.id);
    removeLinkFromRecord(target, source.id);
  } else {
    addLinkToRecord(source, target.id, kind);
    addLinkToRecord(target, source.id, kind);
  }

  return true;
}

function hasLinkTo(record, targetId) {
  return getLinksForRecord(record).some(link => link.to === targetId);
}

function addLinkToRecord(record, targetId, kind) {
  if (hasLinkTo(record, targetId)) return;
  if (!Array.isArray(record.data.links)) record.data.links = [];
  record.data.links.push({ to: targetId, kind });
}

function removeLinkFromRecord(record, targetId) {
  if (!Array.isArray(record.data.links)) return;
  record.data.links = record.data.links.filter(link => (typeof link === "string" ? link : link.to) !== targetId);
}

function inferLinkKind(source, target) {
  if (source.kind === "room" || target.kind === "room") return "room";
  if ([source.kind, target.kind].includes("entrance") || [source.kind, target.kind].includes("service")) return "connector";
  return "corridor";
}

function canSaveRoomDataToFile() {
  return /^https?:$/.test(window.location.protocol);
}

function setEditorMessage(text, tone = "") {
  state.editorMessage = text;
  state.editorTone = tone;
}

function formatCoordinate(value) {
  return Number(value).toFixed(9);
}

function roundCoordinate(value) {
  return Number(Number(value).toFixed(9));
}

async function loadRuntimeConfig() {
  if (!/^https?:$/.test(window.location.protocol)) return {};

  try {
    const response = await fetch("/api/runtime-config", { cache: "no-store" });
    if (!response.ok) return {};
    return await response.json();
  } catch (error) {
    console.error("Failed to load runtime map config", error);
    return {};
  }
}

function getGoogleMapsApiKey() {
  const params = new URLSearchParams(window.location.search);
  return params.get("googleMapsApiKey") || state.runtimeConfig.googleMapsApiKey || "";
}

function loadGoogleMapsApi(apiKey) {
  if (window.google?.maps) return Promise.resolve(window.google.maps);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-map-provider="google"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google.maps), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const callbackName = `__campusCompassGoogleMapsReady_${Date.now()}`;
    window[callbackName] = () => {
      resolve(window.google.maps);
      delete window[callbackName];
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.dataset.mapProvider = "google";
    script.onerror = error => {
      delete window[callbackName];
      reject(error);
    };
    document.head.appendChild(script);
  });
}

function renderMapSourceNote() {
  const note = document.getElementById("map-source-note");
  if (!note) return;
  note.textContent = state.mapNote;
}
