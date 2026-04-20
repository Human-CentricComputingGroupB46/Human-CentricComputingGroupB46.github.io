/* CampusCompass - one-screen EB indoor navigator. */
const state = {
  entrance: "NW",
  entranceNodeId: ENTRANCES.NW.id,
  dest: null,
  activeFloor: 1,
  graph: null,
  route: null,
  mode: "idle",
  map: null,
  canvas: null,
  ctx: null,
  mapProvider: null,
  mapNote: "",
  googleOverlay: null,
  editMode: false,
  editorTool: "move",
  dirtyRoomLayout: false,
  overlaySelected: false,
  overlayResizeHandle: null,
  roomResizeHandle: null,
  corridorResizeHandle: null,
  selectedRoomCode: null,
  selectedCorridorId: null,
  selectedNodeId: null,
  hoverRoomCode: null,
  hoverCorridorId: null,
  hoverNodeId: null,
  draggingRoomCode: null,
  draggingRoomResize: null,
  draggingCorridorId: null,
  draggingCorridorResize: null,
  draggingOverlay: null,
  dragOffset: null,
  editorMessage: "Layout editing is off.",
  editorTone: "",
  saveInFlight: false,
  roomLayoutSnapshot: "",
  roomLayoutResetData: null,
  mapSurface: null,
  editSurface: null,
  demoMode: true,
  visibleLayers: {
    rooms: true,
    corridors: true,
    entrances: true,
    services: true,
    edges: true,
  },
};

const MIN_ROOM_DIMENSION = 24;
const MIN_CORRIDOR_DIMENSION = 18;
const DEFAULT_CORRIDOR_THICKNESS = 34;
const DEFAULT_CORRIDOR_SPAN_PADDING = 28;
const DEFAULT_CORRIDOR_BLOCK_SIZE = 42;

document.addEventListener("DOMContentLoaded", async () => {
  state.demoMode = getRequestedAppMode() !== "design";
  state.activeFloor = getAvailableFloors()[0] || 1;
  applyAppMode();
  state.graph = buildGraph();
  await initMap();
  tickClock();
  setInterval(tickClock, 1000 * 15);
  wireModeSwitch();
  wireEntrancePicker();
  wireFloorPicker();
  wireInput();
  setRoomInputPrefix();
  if (!state.demoMode) {
    wireEditor();
    state.roomLayoutSnapshot = generateEditableDataSource();
    state.roomLayoutResetData = cloneEditorDataSnapshot();
  }
  renderSuggestions("");
  renderMap();
  renderStatus();
  if (!state.demoMode) {
    renderEditorState();
  }
});

function getRequestedAppMode() {
  const params = new URLSearchParams(window.location.search);
  const mode = String(params.get("mode") || "demo").trim().toLowerCase();
  return mode === "design" || mode === "edit" ? "design" : "demo";
}

function applyAppMode() {
  document.body.classList.toggle("app-mode-demo", state.demoMode);
  document.body.classList.toggle("app-mode-design", !state.demoMode);
  document.body.classList.toggle("app-mode-edit", !state.demoMode);

  const badge = document.getElementById("mode-badge");
  if (badge) {
    badge.hidden = false;
    badge.textContent = state.demoMode ? "Demo mode" : "Design mode";
  }

  renderModeSwitch();
}

function wireModeSwitch() {
  const button = document.getElementById("mode-switch");
  if (!button) return;

  button.addEventListener("click", () => {
    if (!state.demoMode && state.dirtyRoomLayout) {
      const shouldContinue = window.confirm("You have unsaved layout edits. Switch modes and discard the in-memory changes?");
      if (!shouldContinue) return;
    }

    window.location.assign(buildModeUrl(state.demoMode ? "design" : "demo"));
  });

  renderModeSwitch();
}

function renderModeSwitch() {
  const button = document.getElementById("mode-switch");
  if (!button) return;

  button.textContent = state.demoMode ? "Open Design" : "Go to Demo";
  button.setAttribute("aria-pressed", state.demoMode ? "false" : "true");
}

function buildModeUrl(mode) {
  const url = new URL(window.location.href);
  if (mode === "design") {
    url.searchParams.set("mode", "design");
  } else {
    url.searchParams.delete("mode");
  }
  return url.toString();
}

function wireFloorPicker() {
  const picker = document.getElementById("floor-picker");
  if (!picker) return;

  picker.addEventListener("click", event => {
    const button = event.target.closest("button[data-floor]");
    if (!button) return;
    setActiveFloor(Number(button.dataset.floor));
  });

  renderFloorPicker();
}

function renderFloorPicker() {
  const picker = document.getElementById("floor-picker");
  const eyebrow = document.getElementById("floor-eyebrow");
  const title = document.getElementById("floor-title");
  const meta = FLOOR_METADATA[getVisibleFloor()] || {
    label: `Floor ${getVisibleFloor()}`,
    title: `Floor ${getVisibleFloor()} route map`,
  };

  if (eyebrow) eyebrow.textContent = `EB ${meta.label}`;
  if (title) title.textContent = meta.title;
  if (!picker) return;

  picker.innerHTML = "";
  getAvailableFloors().forEach(floor => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.floor = String(floor);
    button.textContent = FLOOR_METADATA[floor]?.label || `Floor ${floor}`;
    button.className = `floor-option${floor === getVisibleFloor() ? " active" : ""}`;
    button.setAttribute("aria-pressed", floor === getVisibleFloor() ? "true" : "false");
    picker.appendChild(button);
  });
}

function setActiveFloor(floor) {
  if (!getAvailableFloors().includes(floor) || floor === state.activeFloor) return;

  state.activeFloor = floor;
  syncSelectionToVisibleFloor();
  renderFloorPicker();
  renderMap();
  renderStatus();

  if (!state.demoMode) {
    renderEditorState();
  }
}

function syncSelectionToVisibleFloor() {
  if (state.selectedRoomCode && getFloorForRoomCode(state.selectedRoomCode) !== getVisibleFloor()) {
    state.selectedRoomCode = null;
  }

  if (state.selectedCorridorId) {
    const corridor = getCorridorNodeById(state.selectedCorridorId);
    if (!corridor || getNodeFloor(corridor) !== getVisibleFloor()) {
      state.selectedCorridorId = null;
    }
  }

  if (!state.selectedNodeId) return;

  const record = findEditableNodeRecord(state.selectedNodeId);
  const recordFloor = record?.type === "room"
    ? getFloorForRoomCode(record.data.code)
    : getNodeFloor(record?.data);

  if (recordFloor !== getVisibleFloor()) {
    state.selectedNodeId = null;
  }
}

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
      state.activeFloor = 1;
      state.route = null;
      state.mode = state.entrance === "SW" ? "recommend" : "idle";
      document.getElementById("room-input").value = "";
      syncSelectionToVisibleFloor();
      renderFloorPicker();
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
    input.value = normalizeRoomSearchInput(input.value);
    renderSuggestions(input.value);
  });

  input.addEventListener("focus", () => {
    if (!input.value || normalizeRoomSearchInput(input.value) === "") {
      setRoomInputPrefix();
    }
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
        const suffix = getRoomSearchNumericSuffix(input.value);
        input.value = formatRoomSearchNumericSuffix(suffix.slice(0, -1));
      } else if (key === "enter") {
        tryRoute();
        return;
      } else {
        const suffix = getRoomSearchNumericSuffix(input.value);
        input.value = formatRoomSearchNumericSuffix(`${suffix}${key}`);
      }
      renderSuggestions(input.value);
    });
  });

  document.getElementById("go-btn").addEventListener("click", tryRoute);
  document.getElementById("clear-route").addEventListener("click", () => {
    input.value = "";
    clearRoute();
    setRoomInputPrefix();
    renderSuggestions("");
  });
}

function setRoomInputPrefix() {
  const input = document.getElementById("room-input");
  if (!input) return;
  input.value = "EB";
  input.focus();
  if (typeof input.setSelectionRange === "function") {
    input.setSelectionRange(2, 2);
  }
}

function wireEditor() {
  state.mapSurface = document.querySelector(".map-stack");
  state.editSurface = document.getElementById("map-hit-area") || state.mapSurface;

  document.getElementById("toggle-edit-mode").addEventListener("click", () => {
    setEditMode(!state.editMode);
  });

  document.getElementById("room-edit-tool").addEventListener("click", () => {
    setEditorTool("move");
  });

  document.getElementById("add-room-tool").addEventListener("click", () => {
    setEditorTool("add-room");
  });

  document.getElementById("link-edit-tool").addEventListener("click", () => {
    setEditorTool("link");
  });

  document.getElementById("delete-selected").addEventListener("click", deleteSelectedLayoutItem);

  ["new-room-code", "new-room-width", "new-room-height", "new-room-zone", "new-room-note"].forEach(id => {
    const field = document.getElementById(id);
    field?.addEventListener("input", () => {
      if (id === "new-room-code") {
        field.value = normalizeRoomCodeInput(field.value);
      }
      renderEditorState();
    });
  });

  ["selected-room-width", "selected-room-height"].forEach(id => {
    const field = document.getElementById(id);
    field?.addEventListener("change", updateSelectedGeometryDimensionsFromInputs);
  });

  document.getElementById("copy-room-data").addEventListener("click", copyRoomDataBlock);
  document.getElementById("save-room-data").addEventListener("click", saveRoomDataBlock);
  document.getElementById("reset-room-data").addEventListener("click", resetUnsavedRoomData);

  if (!state.editSurface) return;

  state.editSurface.addEventListener("pointerdown", handleEditorPointerDown);
  state.editSurface.addEventListener("pointermove", handleEditorPointerMove);
  state.editSurface.addEventListener("pointerup", handleEditorPointerUp);
  state.editSurface.addEventListener("pointercancel", handleEditorPointerUp);
  state.editSurface.addEventListener("pointerleave", handleEditorPointerLeave);

  wireLayerFilter();
}

function wireLayerFilter() {
  const fieldset = document.querySelector(".editor-layer-filter");
  if (!fieldset) return;
  fieldset.addEventListener("change", (e) => {
    const cb = e.target.closest("input[data-layer]");
    if (!cb) return;
    state.visibleLayers[cb.dataset.layer] = cb.checked;
    renderMap();
  });
}

function isLayerVisible(layer) {
  if (state.demoMode || !state.editMode) return true;
  return state.visibleLayers[layer] !== false;
}

function cleanRoomInput(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
}

function normalizeRoomSearchInput(value) {
  const cleaned = cleanRoomInput(value);
  if (!cleaned) return "";
  if (/^\d+$/.test(cleaned)) return `EB${cleaned}`;
  if (/^[A-Z]+\d+$/.test(cleaned) && !cleaned.startsWith("EB")) {
    return `EB${cleaned.replace(/^[A-Z]+/, "")}`;
  }
  return cleaned;
}

function getRoomSearchNumericSuffix(value) {
  const normalized = normalizeRoomSearchInput(value);
  if (!normalized) return "";
  if (normalized.startsWith("EB")) return normalized.slice(2).replace(/\D/g, "");
  return normalized.replace(/\D/g, "");
}

function formatRoomSearchNumericSuffix(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  return digits ? `EB${digits}` : "";
}

function normalizeRoomCodeInput(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
}

function getVisibleFloor() {
  return Number(state.activeFloor) || 1;
}

function getNodeFloor(node) {
  return node?.floor ?? 1;
}

function getVisibleRooms() {
  return getRoomsForFloor(getVisibleFloor());
}

function getVisibleInaccessibleAreas() {
  return INACCESSIBLE_AREAS_BY_FLOOR[getVisibleFloor()] || [];
}

function getFloorLabel(floor) {
  return FLOOR_METADATA[floor]?.label || `Floor ${floor}`;
}

function getRouteFloors(path) {
  return [...new Set((path || [])
    .map(id => state.graph?.nodes[id]?.floor)
    .filter(Number.isFinite))];
}

function getVisibleRoutePath(path = state.route?.path) {
  return (path || []).filter(id => state.graph?.nodes[id]?.floor === getVisibleFloor());
}

function clearRoute() {
  state.dest = null;
  state.activeFloor = 1;
  state.route = null;
  state.mode = state.entrance === "SW" ? "recommend" : "idle";
  syncSelectionToVisibleFloor();
  renderFloorPicker();
  renderMap();
  renderStatus();
}

function renderSuggestions(prefix) {
  const box = document.getElementById("suggestions");
  box.innerHTML = "";
  const p = normalizeRoomSearchInput(prefix || "");
  const matches = allRoomCodes()
    .filter(code => !p || code.startsWith(p))
    .slice(0, 4);

  if (matches.length === 0 && p.length >= 3) {
    const span = document.createElement("span");
    span.textContent = `No room found for "${p}".`;
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
  const code = normalizeRoomSearchInput(input.value);
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

  if (state.dest && !allRoomCodes().includes(state.dest)) {
    state.dest = null;
  }

  if (!state.dest) {
    state.route = null;
    state.mode = state.entrance === "SW" ? "recommend" : "idle";
    renderFloorPicker();
    renderMap();
    renderStatus();
    return;
  }

  if (state.entrance === "SW") {
    state.route = { path: RECOMMENDED_SW_TO_NW, distance: estimatePathDistance(RECOMMENDED_SW_TO_NW) };
    state.mode = "recommend";
    state.activeFloor = 1;
  } else {
    const result = dijkstra(state.graph, state.entranceNodeId, `ROOM-${state.dest}`);
    if (!result) {
      state.route = null;
      state.mode = "unreachable";
    } else {
      state.route = result;
      state.mode = "route";
      state.activeFloor = getFloorForRoomCode(state.dest) || 1;
    }
  }

  syncSelectionToVisibleFloor();
  renderFloorPicker();
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
  if (!graph?.nodes?.[startId] || !graph?.nodes?.[endId]) return null;

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
  renderFloorPicker();

  const title = document.getElementById("route-title");
  const steps = document.getElementById("steps");
  const message = document.getElementById("message");
  const dist = document.getElementById("stat-dist");
  const time = document.getElementById("stat-time");
  const visibleRoutePath = getVisibleRoutePath();
  const routeFloors = getRouteFloors(state.route?.path);
  const visibleFloorLabel = getFloorLabel(getVisibleFloor());
  const destinationFloor = state.dest ? getFloorForRoomCode(state.dest) : null;

  steps.innerHTML = "";
  dist.textContent = "--";
  time.textContent = "--";
  message.className = "message";

  if (state.mode === "route" && state.route && state.dest) {
    title.textContent = `${entrance.label} to ${state.dest}`;
    if (!visibleRoutePath.length) {
      message.classList.add("warn");
      message.textContent = `${visibleFloorLabel} is not used for this route. Switch to ${getFloorLabel(destinationFloor)} to see the arrival segment.`;
    } else if (routeFloors.length > 1) {
      message.textContent = `Showing the ${visibleFloorLabel.toLowerCase()} segment on the ${getMapSurfaceLabel()}.`;
    } else {
      message.textContent = `Shortest route shown on the ${getMapSurfaceLabel()}.`;
    }
    dist.textContent = Math.round(state.route.distance / 10);
    time.textContent = Math.max(5, Math.round(state.route.distance / 14));
    addRouteNarrative(state.route.path, entrance.label);
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
    message.textContent = "Please enter one of the listed room numbers.";
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
  message.textContent = `Floor 1 is calibrated, and Floor 2 is an approximate overlay traced from the floor-plan photo on the ${getMapSurfaceLabel()}.`;
  addStep("Select NW, NE, or SW on the input panel.");
  addStep("Enter a room such as EB138, EB211, or EB277.");
}

function addRouteNarrative(path, entranceLabel) {
  const nodes = (path || []).map(id => state.graph.nodes[id]).filter(Boolean);
  if (!nodes.length) return;

  addStep(`Start at ${entranceLabel}.`);

  let currentFloor = nodes[0].floor;
  const announcedLabels = new Set();

  for (let index = 1; index < nodes.length; index += 1) {
    const node = nodes[index];
    const previous = nodes[index - 1];

    if (node.floor !== currentFloor) {
      const stairLabel = node.kind === "stair"
        ? node.label
        : previous.kind === "stair"
          ? previous.label
          : "nearest stair";
      const direction = node.floor > currentFloor ? "up" : "down";
      addStep(`Take the ${stairLabel} ${direction} to ${getFloorLabel(node.floor)}.`);
      currentFloor = node.floor;
      continue;
    }

    if (!node.label || node.kind === "room" || node.kind === "stair") continue;

    const normalizedLabel = node.label.toLowerCase();
    if (announcedLabels.has(normalizedLabel)) continue;
    if (/hub|corridor|hall|path/i.test(node.label)) {
      addStep(`Continue via ${node.label}.`);
      announcedLabels.add(normalizedLabel);
    }
  }

  addStep(`Arrive at ${state.dest}.`);
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

  if (!window.L) {
    state.mapNote = "Leaflet fallback is not loaded, so the page requires the embedded Google Maps page script to show the basemap.";
    renderMapSourceNote();
    return;
  }

  initLeafletMap();
  renderMapSourceNote();
}

async function initGoogleMap() {
  if (!window.google?.maps?.Map || !window.google?.maps?.OverlayView || !window.google?.maps?.LatLngBounds) {
    state.mapNote = "Google Maps JS API is not available from the embedded page script, so the page is using the open fallback layer.";
    return false;
  }
  try {
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

    const buildingBounds = getBuildingBounds();
    const bounds = new google.maps.LatLngBounds(
      { lat: buildingBounds.south, lng: buildingBounds.west },
      { lat: buildingBounds.north, lng: buildingBounds.east }
    );
    state.map.fitBounds(bounds, 32);

    state.map.addListener("bounds_changed", renderMap);
    state.map.addListener("zoom_changed", renderMap);
    state.map.addListener("drag", renderMap);
    window.addEventListener("resize", syncOverlaySize);
    syncOverlaySize();
    state.mapNote = "Base layer: Google Maps satellite imagery. Indoor rooms, nodes, and routes are canvas overlays anchored near the EB building coordinate.";
    return true;
  } catch (error) {
    console.error("Failed to initialize Google Maps JS API", error);
    state.mapNote = "Google Maps JS API is present but failed during page-side initialization, so the page is using the open fallback layer.";
    return false;
  }
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
  const buildingBounds = getBuildingBounds();
  state.map.fitBounds(L.latLngBounds(
    L.latLng(buildingBounds.north, buildingBounds.west),
    L.latLng(buildingBounds.south, buildingBounds.east)
  ), {
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
  syncEditSurfaceBounds();

  const ctx = state.ctx;
  const rect = state.canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  drawNorthBadge(ctx);
  drawBase(ctx);
  drawCorridorAreas(ctx);
  drawEdges(ctx);
  drawRoomLinks(ctx);
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

  for (const area of getVisibleInaccessibleAreas()) {
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

function drawCorridorAreas(ctx) {
  if (!isLayerVisible("corridors")) return;
  const showLabels = state.editMode || getMapZoom() >= 20;

  for (const node of getCorridorNodesForFloor()) {
    const bounds = getCorridorLocalBounds(node);
    if (!bounds) continue;

    const isSelected = state.selectedCorridorId === node.id;
    const isHover = state.hoverCorridorId === node.id;
    const baseFill = node.kind === "stair"
      ? "rgba(255, 244, 224, 0.9)"
      : node.kind === "connector"
        ? "rgba(239, 244, 250, 0.9)"
        : "rgba(238, 244, 255, 0.86)";
    const baseStroke = node.kind === "stair"
      ? "rgba(203, 132, 34, 0.96)"
      : node.kind === "connector"
        ? "rgba(138, 158, 186, 0.96)"
        : "rgba(179, 197, 223, 0.96)";

    drawGeoRect(ctx, bounds.left, bounds.top, bounds.w, bounds.h, {
      fillStyle: isSelected && state.editMode
        ? "rgba(255, 242, 220, 0.95)"
        : baseFill,
      strokeStyle: isSelected
        ? "#f29325"
        : isHover && state.editMode
          ? "#0b1f3a"
          : baseStroke,
      lineWidth: isSelected ? 2.4 : isHover && state.editMode ? 1.9 : 1.1,
    });

    if (!showLabels && !isSelected && !isHover) continue;

    const point = projectLocalPoint(node.x, node.y);
    if (!point) continue;

    ctx.save();
    ctx.fillStyle = "#48556d";
    ctx.font = "700 10px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.label || node.id, point.x, point.y);
    ctx.restore();
  }
}

function drawEdges(ctx) {
  if (!isLayerVisible("edges")) return;
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

function getNonRoomNodesForFloor(floor = getVisibleFloor()) {
  return getNonRoomNodes().filter(node => getNodeFloor(node) === floor);
}

function getGraphNodeById(id) {
  return getNonRoomNodes().find(node => node.id === id) || null;
}

function getCorridorNodesForFloor(floor = getVisibleFloor()) {
  return WALKABLE_NODES.filter(node => getNodeFloor(node) === floor);
}

function getCorridorNodeById(id) {
  return WALKABLE_NODES.find(node => node.id === id) || null;
}

function getCorridorDimensions(node) {
  if (!node) return { w: DEFAULT_CORRIDOR_BLOCK_SIZE, h: DEFAULT_CORRIDOR_BLOCK_SIZE };
  if (Number.isFinite(node.w) && Number.isFinite(node.h)) {
    return {
      w: roundCorridorDimension(node.w, "w"),
      h: roundCorridorDimension(node.h, "h"),
    };
  }

  let horizontalReach = 0;
  let verticalReach = 0;

  for (const link of getNodeLinks(node)) {
    if (link.to.startsWith("ROOM-")) continue;
    const target = state.graph?.nodes?.[link.to] || getGraphNodeById(link.to);
    if (!target || target.floor !== getNodeFloor(node)) continue;

    const dx = Math.abs(target.x - node.x);
    const dy = Math.abs(target.y - node.y);
    if (dx >= dy) {
      horizontalReach = Math.max(horizontalReach, dx);
    } else {
      verticalReach = Math.max(verticalReach, dy);
    }
  }

  const width = horizontalReach
    ? Math.max(DEFAULT_CORRIDOR_BLOCK_SIZE, horizontalReach * 2 + DEFAULT_CORRIDOR_SPAN_PADDING)
    : DEFAULT_CORRIDOR_THICKNESS;
  const height = verticalReach
    ? Math.max(DEFAULT_CORRIDOR_BLOCK_SIZE, verticalReach * 2 + DEFAULT_CORRIDOR_SPAN_PADDING)
    : DEFAULT_CORRIDOR_THICKNESS;

  if (!horizontalReach && !verticalReach) {
    return { w: DEFAULT_CORRIDOR_BLOCK_SIZE, h: DEFAULT_CORRIDOR_BLOCK_SIZE };
  }

  return {
    w: roundCorridorDimension(width, "w"),
    h: roundCorridorDimension(height, "h"),
  };
}

function getCorridorLocalBounds(node) {
  if (!node) return null;

  const dimensions = getCorridorDimensions(node);
  return {
    center: { x: node.x, y: node.y },
    left: node.x - dimensions.w / 2,
    right: node.x + dimensions.w / 2,
    top: node.y - dimensions.h / 2,
    bottom: node.y + dimensions.h / 2,
    w: dimensions.w,
    h: dimensions.h,
  };
}

function getCorridorScreenPolygon(node) {
  const bounds = getCorridorLocalBounds(node);
  if (!bounds) return null;

  const polygon = [
    projectLocalPoint(bounds.left, bounds.top),
    projectLocalPoint(bounds.right, bounds.top),
    projectLocalPoint(bounds.right, bounds.bottom),
    projectLocalPoint(bounds.left, bounds.bottom),
  ];

  return polygon.some(point => !point) ? null : polygon;
}

function getCorridorResizeHandles(node) {
  const bounds = getCorridorLocalBounds(node);
  if (!bounds) return [];

  const handles = [
    { name: "nw", localPoint: { x: bounds.left, y: bounds.top } },
    { name: "ne", localPoint: { x: bounds.right, y: bounds.top } },
    { name: "se", localPoint: { x: bounds.right, y: bounds.bottom } },
    { name: "sw", localPoint: { x: bounds.left, y: bounds.bottom } },
  ].map(handle => ({
    ...handle,
    point: projectLocalPoint(handle.localPoint.x, handle.localPoint.y),
  }));

  return handles.filter(handle => Boolean(handle.point));
}

function pickCorridorResizeHandle(point, node) {
  if (!node) return null;

  let bestHandle = null;
  for (const handle of getCorridorResizeHandles(node)) {
    const distance = Math.hypot(handle.point.x - point.x, handle.point.y - point.y);
    if (distance > 16) continue;
    if (!bestHandle || distance < bestHandle.distance) {
      bestHandle = { ...handle, distance };
    }
  }

  return bestHandle;
}

function getOppositeCorridorCornerLocalPoint(node, handleName) {
  const bounds = getCorridorLocalBounds(node);
  if (!bounds) return null;

  switch (handleName) {
    case "nw":
      return { x: bounds.right, y: bounds.bottom };
    case "ne":
      return { x: bounds.left, y: bounds.bottom };
    case "se":
      return { x: bounds.left, y: bounds.top };
    case "sw":
      return { x: bounds.right, y: bounds.top };
    default:
      return null;
  }
}

function pickCorridorAtScreenPoint(x, y) {
  let bestMatch = null;

  for (const node of getCorridorNodesForFloor()) {
    const polygon = getCorridorScreenPolygon(node);
    if (!polygon || !pointInPolygon({ x, y }, polygon)) continue;

    const center = getEditableNodeScreenPoint(node.id);
    const distance = center ? Math.hypot(center.x - x, center.y - y) : 0;
    if (!bestMatch || distance < bestMatch.distance) {
      bestMatch = { node, distance };
    }
  }

  return bestMatch ? bestMatch.node : null;
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
  const node = getGraphNodeById(nodeId);
  if (!node) return "corridor";
  if (Object.values(ENTRANCES).some(entry => entry.id === nodeId)) return "entrance";
  if (SERVICE_POINTS.some(entry => entry.id === nodeId)) return "service";
  return node.kind || "corridor";
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
  const visibleFloor = getVisibleFloor();

  for (const node of getNonRoomNodesForFloor(visibleFloor)) {
    for (const link of getNodeLinks(node)) {
      if (link.to.startsWith("ROOM-")) continue;
      const target = state.graph.nodes[link.to];
      if (!target || target.floor !== visibleFloor) continue;
      const pairKey = [node.id, link.to].sort().join("::");
      if (seen.has(pairKey)) continue;
      segments.push({ from: node.id, to: link.to, kind: link.kind || "corridor" });
      seen.add(pairKey);
    }
  }

  return segments;
}

function getRenderableRoomLinks() {
  const seen = new Set();
  const segments = [];
  const visibleFloor = getVisibleFloor();

  for (const room of getRoomsForFloor(visibleFloor)) {
    for (const link of getRoomLinks(room)) {
      const from = `ROOM-${room.code}`;
      const to = link.to;
      const pairKey = [from, to].sort().join("::");
      if (seen.has(pairKey)) continue;

      const targetRecord = findEditableNodeRecord(to);
      const targetFloor = targetRecord?.type === "room"
        ? getFloorForRoomCode(targetRecord.data.code)
        : getNodeFloor(targetRecord?.data);
      if (!targetRecord || targetFloor !== visibleFloor) continue;

      segments.push({
        from,
        to,
        kind: targetRecord.kind === "room" ? "room-room" : (link.kind || "room"),
      });
      seen.add(pairKey);
    }
  }

  return segments;
}

function drawRoomLinks(ctx) {
  if (!isLayerVisible("edges")) return;
  for (const segment of getRenderableRoomLinks()) {
    const start = getEditableNodeLocalPoint(segment.from);
    const end = getEditableNodeLocalPoint(segment.to);
    if (!start || !end) continue;

    drawGeoLine(ctx, start.x, start.y, end.x, end.y, {
      strokeStyle: segment.kind === "room-room" ? "rgba(79, 122, 189, 0.9)" : "rgba(141, 166, 198, 0.95)",
      lineWidth: localUnitsToPixels(segment.kind === "room-room" ? 3 : 2),
      lineDash: segment.kind === "room-room" ? [8, 4] : [4, 4],
    });
  }
}

function drawRooms(ctx) {
  if (!isLayerVisible("rooms")) return;
  const dest = state.dest ? getRoom(state.dest) : null;
  const showLabels = state.editMode || getMapZoom() >= 19;
  const showNotes = state.editMode || getMapZoom() >= 20;

  for (const room of getVisibleRooms()) {
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
  }
}

function drawServicePoints(ctx) {
  if (!isLayerVisible("services")) return;
  for (const sp of SERVICE_POINTS.filter(point => getNodeFloor(point) === getVisibleFloor())) {
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
  if (!isLayerVisible("entrances")) return;
  if (getVisibleFloor() !== 1) return;

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
  const visiblePath = getVisibleRoutePath();

  if (!state.route || visiblePath.length < 2) {
    if (state.entrance === "SW" && getVisibleFloor() === 1) drawRecommendedPath(ctx);
    return;
  }

  drawPolyline(ctx, visiblePath, {
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
  const visibleRoutePath = getVisibleRoutePath();
  const start = visibleRoutePath.length
    ? state.graph.nodes[visibleRoutePath[0]]
    : (getVisibleFloor() === 1 ? state.graph.nodes[state.entranceNodeId] : null);
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
      if (getVisibleFloor() > 1 && start.kind === "stair") {
        ctx.fillStyle = "#c2690e";
        ctx.font = "700 11px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("Arrive via stair", point.x, point.y - 26);
      }
      ctx.restore();
    }
  }

  if (!state.dest) return;
  const destNode = state.graph.nodes[`ROOM-${state.dest}`];
  if (!destNode || state.mode === "recommend" || destNode.floor !== getVisibleFloor()) return;
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
  drawScreenRoundedRect(ctx, 16, 16, 176, 56, 10, {
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

function syncEditSurfaceBounds() {
  if (!state.editSurface) return;

  const polygon = getOverlayScreenPolygon();
  if (!state.editMode || !polygon) {
    state.editSurface.style.display = "none";
    return;
  }

  const padding = 20;
  const xs = polygon.map(point => point.x);
  const ys = polygon.map(point => point.y);
  const left = Math.max(0, Math.min(...xs) - padding);
  const top = Math.max(0, Math.min(...ys) - padding);
  const right = Math.max(...xs) + padding;
  const bottom = Math.max(...ys) + padding;

  state.editSurface.style.display = "block";
  state.editSurface.style.left = `${left}px`;
  state.editSurface.style.top = `${top}px`;
  state.editSurface.style.width = `${Math.max(1, right - left)}px`;
  state.editSurface.style.height = `${Math.max(1, bottom - top)}px`;
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
  const bounds = getRoomLocalBounds(room);
  if (!bounds) return null;

  const polygon = [
    projectLocalPoint(bounds.left, bounds.top),
    projectLocalPoint(bounds.right, bounds.top),
    projectLocalPoint(bounds.right, bounds.bottom),
    projectLocalPoint(bounds.left, bounds.bottom),
  ];

  return polygon.some(point => !point) ? null : polygon;
}

function getRoomLocalBounds(room) {
  const roomPoint = getRoomCenterLocalPoint(room);
  if (!roomPoint) return null;

  return {
    center: roomPoint,
    left: roomPoint.x - room.w / 2,
    right: roomPoint.x + room.w / 2,
    top: roomPoint.y - room.h / 2,
    bottom: roomPoint.y + room.h / 2,
  };
}

function getRoomResizeHandles(room) {
  const bounds = getRoomLocalBounds(room);
  if (!bounds) return [];

  const handles = [
    { name: "nw", localPoint: { x: bounds.left, y: bounds.top } },
    { name: "ne", localPoint: { x: bounds.right, y: bounds.top } },
    { name: "se", localPoint: { x: bounds.right, y: bounds.bottom } },
    { name: "sw", localPoint: { x: bounds.left, y: bounds.bottom } },
  ].map(handle => ({
    ...handle,
    point: projectLocalPoint(handle.localPoint.x, handle.localPoint.y),
  }));

  return handles.filter(handle => Boolean(handle.point));
}

function pickRoomResizeHandle(point, room) {
  if (!room) return null;

  let bestHandle = null;
  for (const handle of getRoomResizeHandles(room)) {
    const distance = Math.hypot(handle.point.x - point.x, handle.point.y - point.y);
    if (distance > 16) continue;
    if (!bestHandle || distance < bestHandle.distance) {
      bestHandle = { ...handle, distance };
    }
  }

  return bestHandle;
}

function getOppositeRoomCornerLocalPoint(room, handleName) {
  const bounds = getRoomLocalBounds(room);
  if (!bounds) return null;

  switch (handleName) {
    case "nw":
      return { x: bounds.right, y: bounds.bottom };
    case "ne":
      return { x: bounds.left, y: bounds.bottom };
    case "se":
      return { x: bounds.left, y: bounds.top };
    case "sw":
      return { x: bounds.right, y: bounds.top };
    default:
      return null;
  }
}

function pickRoomAtScreenPoint(x, y) {
  const rooms = getVisibleRooms();
  for (let index = rooms.length - 1; index >= 0; index -= 1) {
    const room = rooms[index];
    const polygon = getRoomScreenPolygon(room);
    if (polygon && pointInPolygon({ x, y }, polygon)) return room;
  }
  return null;
}

function getEditableNodeIds() {
  return [
    ...getNonRoomNodesForFloor(getVisibleFloor()).map(node => node.id),
    ...getVisibleRooms().map(room => `ROOM-${room.code}`),
  ];
}

function pickEditableNodeAtScreenPoint(x, y) {
  if (isLayerVisible("rooms")) {
    const room = pickRoomAtScreenPoint(x, y);
    if (room) return findEditableNodeRecord(`ROOM-${room.code}`);
  }

  if (isLayerVisible("corridors")) {
    const corridor = pickCorridorAtScreenPoint(x, y);
    if (corridor) return findEditableNodeRecord(corridor.id);
  }

  let bestMatch = null;

  for (const nodeId of getEditableNodeIds()) {
    const kind = getGraphNodeKind(nodeId);
    if (kind === "room" && !isLayerVisible("rooms")) continue;
    if ((kind === "corridor" || kind === "stair" || kind === "connector") && !isLayerVisible("corridors")) continue;
    if (kind === "entrance" && !isLayerVisible("entrances")) continue;
    if (kind === "service" && !isLayerVisible("services")) continue;

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
  return {
    north: northWest.lat,
    south: southEast.lat,
    west: northWest.lng,
    east: southEast.lng,
  };
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
  const providerLabel = state.mapProvider === "google" ? "Google Maps" : "Terrain map";
  return `${getFloorLabel(getVisibleFloor())} · ${providerLabel}`;
}

function getMapSurfaceLabel() {
  if (state.mapProvider === "google") return "Google Maps base layer";
  return "terrain map";
}

function drawEditorOverlay(ctx) {
  if (!state.editMode) return;

  if (state.editorTool === "link") {
    drawLinkEditorLinks(ctx);
    drawLinkEditorNodes(ctx);
    drawLinkEditorPreviewLine(ctx);
    drawSelectedNodeBadge(ctx, state.selectedNodeId || state.hoverNodeId);
    return;
  }

  drawOverlayFrame(ctx);

  if (state.overlaySelected || state.draggingOverlay) {
    drawOverlayBadge(ctx);
    return;
  }

  const roomId = state.selectedRoomCode ? `ROOM-${state.selectedRoomCode}` : null;
  if (state.editorTool === "move" && state.selectedRoomCode) {
    drawSelectedRoomResizeHandles(ctx, getRoom(state.selectedRoomCode));
  } else if (state.editorTool === "move" && state.selectedCorridorId) {
    drawSelectedCorridorResizeHandles(ctx, getCorridorNodeById(state.selectedCorridorId));
  }
  drawSelectedNodeBadge(ctx, roomId || state.selectedCorridorId);
}

function drawSelectedRoomResizeHandles(ctx, room) {
  if (!room) return;

  for (const handle of getRoomResizeHandles(room)) {
    const isActive = handle.name === state.roomResizeHandle || handle.name === state.draggingRoomResize?.handle;
    drawScreenRoundedRect(ctx, handle.point.x - 7, handle.point.y - 7, 14, 14, 4, {
      fillStyle: isActive ? "#f29325" : "rgba(11, 31, 58, 0.78)",
      strokeStyle: "#ffffff",
      lineWidth: 2,
    });
  }
}

function drawSelectedCorridorResizeHandles(ctx, node) {
  if (!node) return;

  for (const handle of getCorridorResizeHandles(node)) {
    const isActive = handle.name === state.corridorResizeHandle || handle.name === state.draggingCorridorResize?.handle;
    drawScreenRoundedRect(ctx, handle.point.x - 7, handle.point.y - 7, 14, 14, 4, {
      fillStyle: isActive ? "#f29325" : "rgba(11, 31, 58, 0.78)",
      strokeStyle: "#ffffff",
      lineWidth: 2,
    });
  }
}

function drawOverlayFrame(ctx) {
  const polygon = getOverlayScreenPolygon();
  if (!polygon) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (let index = 1; index < polygon.length; index += 1) {
    ctx.lineTo(polygon[index].x, polygon[index].y);
  }
  ctx.closePath();
  ctx.strokeStyle = state.overlaySelected || state.draggingOverlay ? "#f29325" : "rgba(11, 31, 58, 0.42)";
  ctx.lineWidth = state.overlaySelected || state.draggingOverlay ? 2.5 : 1.2;
  ctx.setLineDash([8, 6]);
  ctx.stroke();
  ctx.restore();

  for (const handle of getOverlayResizeHandles()) {
    const isActive = handle.name === state.overlayResizeHandle || handle.name === state.draggingOverlay?.handle;
    ctx.save();
    ctx.beginPath();
    ctx.arc(handle.point.x, handle.point.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? "#f29325" : "rgba(11, 31, 58, 0.78)";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function getOverlayScreenPolygon() {
  const polygon = [
    projectLocalPoint(BUILDING_SHELL.x, BUILDING_SHELL.y),
    projectLocalPoint(BUILDING_SHELL.x + BUILDING_SHELL.w, BUILDING_SHELL.y),
    projectLocalPoint(BUILDING_SHELL.x + BUILDING_SHELL.w, BUILDING_SHELL.y + BUILDING_SHELL.h),
    projectLocalPoint(BUILDING_SHELL.x, BUILDING_SHELL.y + BUILDING_SHELL.h),
  ];

  return polygon.some(point => !point) ? null : polygon;
}

function getOverlayResizeHandles() {
  const polygon = getOverlayScreenPolygon();
  if (!polygon) return [];

  return [
    { name: "nw", point: polygon[0] },
    { name: "ne", point: polygon[1] },
    { name: "se", point: polygon[2] },
    { name: "sw", point: polygon[3] },
  ];
}

function pickOverlayResizeHandle(point) {
  let bestHandle = null;
  for (const handle of getOverlayResizeHandles()) {
    const distance = Math.hypot(handle.point.x - point.x, handle.point.y - point.y);
    if (distance > 16) continue;
    if (!bestHandle || distance < bestHandle.distance) {
      bestHandle = { ...handle, distance };
    }
  }
  return bestHandle;
}

function getOverlayScreenCenter() {
  return projectLocalPoint(BUILDING_SHELL.x + BUILDING_SHELL.w / 2, BUILDING_SHELL.y + BUILDING_SHELL.h / 2);
}

function drawOverlayBadge(ctx) {
  const point = getOverlayScreenCenter();
  if (!point) return;

  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, 9, 0, Math.PI * 2);
  ctx.fillStyle = "#f29325";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();

  const badgeWidth = 230;
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
  ctx.fillText("Indoor overlay anchor", badgeX + 12, badgeY + 16);
  ctx.fillStyle = "#d7e1f1";
  ctx.font = "700 10px Arial, sans-serif";
  ctx.fillText(`${formatCoordinate(GEO_REFERENCE.centerLat)}, ${formatCoordinate(GEO_REFERENCE.centerLng)}`, badgeX + 12, badgeY + 32);
  ctx.restore();
}

function drawLinkEditorLinks(ctx) {
  const selectedRecord = state.selectedNodeId ? findEditableNodeRecord(state.selectedNodeId) : null;
  if (!selectedRecord) return;

  const origin = getEditableNodeScreenPoint(selectedRecord.id);
  if (!origin) return;

  const links = getLinksForRecord(selectedRecord);
  for (const link of links) {
    const target = getEditableNodeScreenPoint(link.to);
    if (!target) continue;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = "rgba(36, 178, 96, 0.7)";
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();
  }
}

function drawLinkEditorPreviewLine(ctx) {
  if (!state.selectedNodeId || !state.hoverNodeId || state.selectedNodeId === state.hoverNodeId) return;

  const origin = getEditableNodeScreenPoint(state.selectedNodeId);
  const target = getEditableNodeScreenPoint(state.hoverNodeId);
  if (!origin || !target) return;

  const selectedRecord = findEditableNodeRecord(state.selectedNodeId);
  const willRemove = selectedRecord && hasLinkTo(selectedRecord, state.hoverNodeId);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(target.x, target.y);
  ctx.strokeStyle = willRemove ? "rgba(209, 55, 55, 0.75)" : "rgba(36, 178, 96, 0.75)";
  ctx.lineWidth = 2.2;
  ctx.setLineDash([6, 5]);
  ctx.stroke();
  ctx.restore();
}

function drawLinkEditorNodes(ctx) {
  const selectedRecord = state.selectedNodeId ? findEditableNodeRecord(state.selectedNodeId) : null;
  const neighborIds = selectedRecord
    ? new Set(getLinksForRecord(selectedRecord).map(l => l.to))
    : new Set();
  const hoverIsRemove = state.hoverNodeId && selectedRecord && hasLinkTo(selectedRecord, state.hoverNodeId);

  for (const nodeId of getEditableNodeIds()) {
    const kind = getGraphNodeKind(nodeId);
    if (kind === "room" && !isLayerVisible("rooms")) continue;
    if ((kind === "corridor" || kind === "stair" || kind === "connector") && !isLayerVisible("corridors")) continue;
    if (kind === "entrance" && !isLayerVisible("entrances")) continue;
    if (kind === "service" && !isLayerVisible("services")) continue;

    const point = getEditableNodeScreenPoint(nodeId);
    const record = findEditableNodeRecord(nodeId);
    if (!point || !record) continue;

    const isSelected = state.selectedNodeId === nodeId;
    const isHover = state.hoverNodeId === nodeId;
    const isNeighbor = neighborIds.has(nodeId);
    const radius = record.kind === "room" ? 7 : 5;

    let fillColor;
    if (isSelected) {
      fillColor = "#f29325";
    } else if (isHover && hoverIsRemove) {
      fillColor = "#d13737";
    } else if (isHover) {
      fillColor = "#24b260";
    } else if (isNeighbor) {
      fillColor = "#24b260";
    } else {
      fillColor = "rgba(11, 31, 58, 0.45)";
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(point.x, point.y, isNeighbor || isSelected ? radius + 1.5 : radius, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
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

  const links = getLinksForRecord(record);
  const linkInfo = state.editorTool === "link"
    ? `  ·  ${links.length} link${links.length !== 1 ? "s" : ""}`
    : "";
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
  ctx.fillText(record.label + linkInfo, badgeX + 12, badgeY + 16);
  ctx.fillStyle = "#d7e1f1";
  ctx.font = "700 10px Arial, sans-serif";
  ctx.fillText(`${record.kind}  ·  ${formatCoordinate(latLng.lat)}, ${formatCoordinate(latLng.lng)}`, badgeX + 12, badgeY + 32);
  ctx.restore();
}

function setEditMode(enabled) {
  if (state.demoMode) return;

  state.editMode = enabled;
  state.hoverRoomCode = null;
  state.hoverCorridorId = null;
  state.hoverNodeId = null;
  state.roomResizeHandle = null;
  state.corridorResizeHandle = null;

  if (!enabled) {
    state.draggingRoomCode = null;
    state.draggingRoomResize = null;
    state.draggingCorridorId = null;
    state.draggingCorridorResize = null;
    state.draggingOverlay = null;
    state.dragOffset = null;
    state.overlaySelected = false;
    state.overlayResizeHandle = null;
    state.selectedCorridorId = null;
    state.selectedNodeId = null;
    state.mapSurface?.classList.remove("dragging");
    setEditorMessage("Layout editing is off.");
  } else {
    const preferredRoom = state.dest && getFloorForRoomCode(state.dest) === getVisibleFloor() ? state.dest : null;
    state.selectedRoomCode = state.selectedRoomCode || preferredRoom || getVisibleRooms()[0]?.code || null;
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
  state.draggingRoomResize = null;
  state.draggingCorridorId = null;
  state.draggingCorridorResize = null;
  state.draggingOverlay = null;
  state.dragOffset = null;
  state.overlaySelected = false;
  state.overlayResizeHandle = null;
  state.roomResizeHandle = null;
  state.corridorResizeHandle = null;
  state.hoverRoomCode = null;
  state.hoverCorridorId = null;
  state.hoverNodeId = null;

  if (tool === "move") {
    state.selectedNodeId = null;
    const preferredRoom = state.dest && getFloorForRoomCode(state.dest) === getVisibleFloor() ? state.dest : null;
    if (!state.selectedRoomCode && !state.selectedCorridorId) {
      state.selectedRoomCode = preferredRoom || getVisibleRooms()[0]?.code || null;
    }
    setEditorMessage(
      canSaveRoomDataToFile()
        ? "Move / Resize Layout is active. Drag a room or corridor to move it, drag corner handles to resize width and height, or use the selected-item inputs before saving back to data.js."
        : "Move / Resize Layout is active. Drag a room or corridor to move it, drag corner handles to resize width and height, or use the selected-item inputs. Direct file save requires the local editor server.",
      canSaveRoomDataToFile() ? "" : "warn"
    );
  } else if (tool === "add-room") {
    state.selectedCorridorId = null;
    state.selectedNodeId = null;
    setEditorMessage(
      "Add Room is active. Fill in the draft below, then click inside the indoor frame to place a new room. The new room will auto-link to the nearest non-room node.",
      ""
    );
  } else {
    state.selectedNodeId = state.selectedRoomCode
      ? `ROOM-${state.selectedRoomCode}`
      : state.selectedCorridorId || state.selectedNodeId;
    state.selectedRoomCode = null;
    state.selectedCorridorId = null;
    setEditorMessage(
      "Edit Links is active. Click a room, corridor, stair, or node to select it, then click another item to add or remove a bidirectional link.",
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
  if (state.editorTool === "add-room") {
    handleAddRoomPointerDown(point);
    event.preventDefault();
    return;
  }

  if (state.editorTool === "link") {
    handleLinkEditorPointerDown(point);
    event.preventDefault();
    return;
  }

  const selectedRoom = state.selectedRoomCode ? getRoom(state.selectedRoomCode) : null;
  const selectedCorridor = state.selectedCorridorId ? getCorridorNodeById(state.selectedCorridorId) : null;
  const roomResizeHandle = pickRoomResizeHandle(point, selectedRoom);
  if (roomResizeHandle && selectedRoom) {
    const anchorLocalPoint = getOppositeRoomCornerLocalPoint(selectedRoom, roomResizeHandle.name);
    if (!anchorLocalPoint) return;

    state.overlaySelected = false;
    state.overlayResizeHandle = null;
    state.hoverRoomCode = selectedRoom.code;
    state.roomResizeHandle = roomResizeHandle.name;
    state.draggingRoomCode = null;
    state.draggingRoomResize = {
      roomCode: selectedRoom.code,
      handle: roomResizeHandle.name,
      anchorLocalPoint,
      didMove: false,
    };
    state.mapSurface?.classList.add("dragging");
    safeSetPointerCapture(state.editSurface, event.pointerId);
    setEditorMessage(`Resizing ${selectedRoom.code}. Drag the corner handle or use the width and height inputs below.`, "");
    renderEditorState();
    renderMap();
    event.preventDefault();
    return;
  }

  const corridorResizeHandle = pickCorridorResizeHandle(point, selectedCorridor);
  if (corridorResizeHandle && selectedCorridor) {
    const anchorLocalPoint = getOppositeCorridorCornerLocalPoint(selectedCorridor, corridorResizeHandle.name);
    if (!anchorLocalPoint) return;

    state.selectedRoomCode = null;
    state.overlaySelected = false;
    state.overlayResizeHandle = null;
    state.hoverCorridorId = selectedCorridor.id;
    state.corridorResizeHandle = corridorResizeHandle.name;
    state.draggingCorridorId = null;
    state.draggingCorridorResize = {
      nodeId: selectedCorridor.id,
      handle: corridorResizeHandle.name,
      anchorLocalPoint,
      didMove: false,
    };
    state.mapSurface?.classList.add("dragging");
    safeSetPointerCapture(state.editSurface, event.pointerId);
    setEditorMessage(`Resizing ${selectedCorridor.label || selectedCorridor.id}. Drag the corner handle or use the width and height inputs below.`, "");
    renderEditorState();
    renderMap();
    event.preventDefault();
    return;
  }

  const resizeHandle = pickOverlayResizeHandle(point);
  if (resizeHandle) {
    const center = getOverlayScreenCenter();
    if (!center) return;

    state.selectedRoomCode = null;
    state.overlaySelected = true;
    state.overlayResizeHandle = resizeHandle.name;
    state.draggingOverlay = {
      action: "resize",
      handle: resizeHandle.name,
      didMove: false,
      startGeoReference: {
        centerLat: GEO_REFERENCE.centerLat,
        centerLng: GEO_REFERENCE.centerLng,
        unitsPerMeter: GEO_REFERENCE.unitsPerMeter,
      },
      startCenterScreen: center,
      startHandleDistance: Math.max(24, Math.hypot(resizeHandle.point.x - center.x, resizeHandle.point.y - center.y)),
      roomLocalPointSnapshot: cloneRoomLocalPointSnapshot(),
    };
    state.mapSurface?.classList.add("dragging");
    safeSetPointerCapture(state.editSurface, event.pointerId);
    setEditorMessage("Resizing the indoor overlay. Release to keep the new size.");
    renderEditorState();
    renderMap();
    event.preventDefault();
    return;
  }

  const room = pickRoomAtScreenPoint(point.x, point.y);
  const corridor = room ? null : pickCorridorAtScreenPoint(point.x, point.y);
  state.selectedRoomCode = room ? room.code : null;
  state.selectedCorridorId = corridor ? corridor.id : null;
  state.hoverRoomCode = room ? room.code : null;
  state.hoverCorridorId = corridor ? corridor.id : null;
  state.overlaySelected = false;
  state.overlayResizeHandle = null;
  state.roomResizeHandle = null;
  state.corridorResizeHandle = null;

  if (!room && !corridor && isScreenPointInsideOverlay(point)) {
    const startPointerLatLng = containerPointToLatLng(point.x, point.y);
    if (!startPointerLatLng) return;

    state.selectedRoomCode = null;
    state.selectedCorridorId = null;
    state.draggingOverlay = {
      action: "move",
      didMove: false,
      startPointerLatLng,
      startGeoReference: {
        centerLat: GEO_REFERENCE.centerLat,
        centerLng: GEO_REFERENCE.centerLng,
        unitsPerMeter: GEO_REFERENCE.unitsPerMeter,
      },
      roomLatLngSnapshot: cloneRoomLatLngSnapshot(),
    };
    state.overlaySelected = true;
    state.mapSurface?.classList.add("dragging");
    safeSetPointerCapture(state.editSurface, event.pointerId);
    setEditorMessage("Dragging the indoor overlay. Release to keep the new anchor position.");
    renderEditorState();
    renderMap();
    event.preventDefault();
    return;
  }

  if (!room && !corridor) {
    setEditorMessage("Drag a room or corridor to move it, drag a selected corner to resize width and height, or drag inside the overlay frame to move the whole layer.");
    renderEditorState();
    renderMap();
    return;
  }

  const center = room
    ? getRoomCenterScreenPoint(room)
    : getEditableNodeScreenPoint(corridor.id);
  state.draggingRoomCode = room ? room.code : null;
  state.draggingCorridorId = corridor ? corridor.id : null;
  state.dragOffset = center ? { x: point.x - center.x, y: point.y - center.y } : { x: 0, y: 0 };
  state.mapSurface?.classList.add("dragging");
  safeSetPointerCapture(state.editSurface, event.pointerId);
  setEditorMessage(`Dragging ${(room?.code || corridor?.label || corridor?.id)}. Release to keep the new saved position.`);
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
    if (state.selectedNodeId) {
      const links = getLinksForRecord(record);
      setEditorMessage(
        `Selected ${record.label} (${links.length} neighbor${links.length !== 1 ? "s" : ""}). Click another node to add/remove a link. Green = connected, click to disconnect.`,
        ""
      );
    } else {
      setEditorMessage("Node selection cleared.", "");
    }
    renderEditorState();
    renderMap();
    return;
  }

  const result = toggleBidirectionalLink(state.selectedNodeId, record.id);
  if (result) {
    const source = findEditableNodeRecord(state.selectedNodeId);
    const sourceLinks = getLinksForRecord(source);
    const verb = result === "added" ? "Connected" : "Disconnected";
    const tone = result === "added" ? "success" : "warn";
    setEditorMessage(
      `${verb} ${source?.label || state.selectedNodeId} ↔ ${record.label}. ${source?.label} now has ${sourceLinks.length} neighbor${sourceLinks.length !== 1 ? "s" : ""}.`,
      tone
    );
    markEditorDirty();
    refreshGraphAndRoute();
    renderEditorState();
  }
}

function handleAddRoomPointerDown(point) {
  if (!isScreenPointInsideOverlay(point)) {
    setEditorMessage("Click inside the indoor overlay frame to place the new room.", "warn");
    renderEditorState();
    renderMap();
    return;
  }

  const draft = getNewRoomDraft();
  const validationError = validateNewRoomDraft(draft);
  if (validationError) {
    setEditorMessage(validationError, "warn");
    renderEditorState();
    return;
  }

  const latLng = containerPointToLatLng(point.x, point.y);
  if (!latLng) {
    setEditorMessage("Could not convert the clicked point into map coordinates.", "warn");
    renderEditorState();
    return;
  }

  const localPoint = latLngToLocalPoint(latLng.lat, latLng.lng);
  const room = {
    code: draft.code,
    lat: roundCoordinate(latLng.lat),
    lng: roundCoordinate(latLng.lng),
    w: draft.w,
    h: draft.h,
    zone: draft.zone,
    links: [],
  };

  if (draft.note) {
    room.note = draft.note;
  }

  getRoomsForFloor(getVisibleFloor()).push(room);

  const roomRecord = findEditableNodeRecord(`ROOM-${room.code}`);
  const nearestNodeId = findNearestAttachableNodeId(localPoint);
  if (roomRecord && nearestNodeId) {
    const targetRecord = findEditableNodeRecord(nearestNodeId);
    addLinkToRecord(roomRecord, nearestNodeId, "room");
    if (targetRecord) {
      addLinkToRecord(targetRecord, roomRecord.id, inferLinkKind(targetRecord, roomRecord));
    }
  }

  state.selectedRoomCode = room.code;
  markEditorDirty();
  refreshGraphAndRoute();
  setEditorMessage(
    nearestNodeId
      ? `Added ${room.code} and linked it to ${findEditableNodeRecord(nearestNodeId)?.label || nearestNodeId}. Use Edit Links if you want to change that connection.`
      : `Added ${room.code}. No nearby node was linked automatically, so connect it manually in Edit Links.`,
    "success"
  );
  renderEditorState();
  renderMap();
}

function handleEditorPointerMove(event) {
  if (!state.editMode || isEditorControlTarget(event.target)) return;

  const point = getSurfacePointFromEvent(event);

  if (state.editorTool === "add-room") {
    const room = pickRoomAtScreenPoint(point.x, point.y);
    const nextHover = room ? room.code : null;
    if (nextHover !== state.hoverRoomCode || state.hoverCorridorId) {
      state.hoverRoomCode = nextHover;
      state.hoverCorridorId = null;
      renderMap();
    }
    return;
  }

  if (state.editorTool === "link") {
    const record = pickEditableNodeAtScreenPoint(point.x, point.y);
    const nextHover = record ? record.id : null;
    if (nextHover !== state.hoverNodeId) {
      state.hoverNodeId = nextHover;
      renderMap();
    }
    return;
  }

  if (state.draggingRoomResize) {
    const latLng = containerPointToLatLng(point.x, point.y);
    if (!latLng) return;

    const localPoint = latLngToLocalPoint(latLng.lat, latLng.lng);
    if (!localPoint) return;

    const changed = resizeRoomFromHandle(
      state.draggingRoomResize.roomCode,
      state.draggingRoomResize.handle,
      state.draggingRoomResize.anchorLocalPoint,
      localPoint
    );
    state.draggingRoomResize.didMove = state.draggingRoomResize.didMove || changed;
    event.preventDefault();
    return;
  }

  if (state.draggingCorridorResize) {
    const latLng = containerPointToLatLng(point.x, point.y);
    if (!latLng) return;

    const localPoint = latLngToLocalPoint(latLng.lat, latLng.lng);
    if (!localPoint) return;

    const changed = resizeCorridorFromHandle(
      state.draggingCorridorResize.nodeId,
      state.draggingCorridorResize.handle,
      state.draggingCorridorResize.anchorLocalPoint,
      localPoint
    );
    state.draggingCorridorResize.didMove = state.draggingCorridorResize.didMove || changed;
    event.preventDefault();
    return;
  }

  if (state.draggingOverlay) {
    if (state.draggingOverlay.action === "resize") {
      const center = state.draggingOverlay.startCenterScreen;
      const nextDistance = Math.max(20, Math.hypot(point.x - center.x, point.y - center.y));
      const scale = clamp(nextDistance / state.draggingOverlay.startHandleDistance, 0.25, 8);
      applyOverlayScale(
        state.draggingOverlay.startGeoReference,
        state.draggingOverlay.roomLocalPointSnapshot,
        state.draggingOverlay.startGeoReference.unitsPerMeter / scale
      );
      state.draggingOverlay.didMove = state.draggingOverlay.didMove || Math.abs(scale - 1) > 1e-4;
    } else {
      const latLng = containerPointToLatLng(point.x, point.y);
      if (!latLng) return;

      const deltaLat = latLng.lat - state.draggingOverlay.startPointerLatLng.lat;
      const deltaLng = latLng.lng - state.draggingOverlay.startPointerLatLng.lng;
      applyOverlayShift(state.draggingOverlay.startGeoReference, state.draggingOverlay.roomLatLngSnapshot, deltaLat, deltaLng);
      state.draggingOverlay.didMove = state.draggingOverlay.didMove || Math.abs(deltaLat) > 1e-10 || Math.abs(deltaLng) > 1e-10;
    }
    markEditorDirty();
    renderEditorState();
    renderMap();
    event.preventDefault();
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

  if (state.draggingCorridorId) {
    const targetPoint = {
      x: point.x - (state.dragOffset?.x || 0),
      y: point.y - (state.dragOffset?.y || 0),
    };
    const latLng = containerPointToLatLng(targetPoint.x, targetPoint.y);
    if (!latLng) return;
    const localPoint = latLngToLocalPoint(latLng.lat, latLng.lng);
    if (!localPoint) return;
    updateCorridorPosition(state.draggingCorridorId, localPoint.x, localPoint.y);
    event.preventDefault();
    return;
  }

  const room = pickRoomAtScreenPoint(point.x, point.y);
  const corridor = room ? null : pickCorridorAtScreenPoint(point.x, point.y);
  const nextHover = room ? room.code : null;
  const nextCorridorHover = corridor ? corridor.id : null;
  const nextResizeHandle = state.selectedRoomCode ? pickRoomResizeHandle(point, getRoom(state.selectedRoomCode))?.name || null : null;
  const nextCorridorResizeHandle = state.selectedCorridorId ? pickCorridorResizeHandle(point, getCorridorNodeById(state.selectedCorridorId))?.name || null : null;
  if (nextHover !== state.hoverRoomCode || nextResizeHandle !== state.roomResizeHandle || nextCorridorHover !== state.hoverCorridorId || nextCorridorResizeHandle !== state.corridorResizeHandle) {
    state.hoverRoomCode = nextHover;
    state.hoverCorridorId = nextCorridorHover;
    state.roomResizeHandle = nextResizeHandle;
    state.corridorResizeHandle = nextCorridorResizeHandle;
    renderMap();
  }
}

function handleEditorPointerUp(event) {
  if (state.editorTool !== "move") return;

  if (state.draggingRoomResize) {
    const roomCode = state.draggingRoomResize.roomCode;
    const didMove = state.draggingRoomResize.didMove;
    state.draggingRoomResize = null;
    state.roomResizeHandle = null;
    safeReleasePointerCapture(state.editSurface, event.pointerId);
    state.mapSurface?.classList.remove("dragging");
    setEditorMessage(
      didMove
        ? `Resized ${roomCode}. Save to data.js to persist the new width and height, or reset unsaved changes to revert.`
        : `Selected ${roomCode}. Drag a corner handle to resize it or use the width and height inputs below.`,
      didMove ? "success" : ""
    );
    renderEditorState();
    renderMap();
    return;
  }

  if (state.draggingCorridorResize) {
    const nodeId = state.draggingCorridorResize.nodeId;
    const label = findEditableNodeRecord(nodeId)?.label || nodeId;
    const didMove = state.draggingCorridorResize.didMove;
    state.draggingCorridorResize = null;
    state.corridorResizeHandle = null;
    safeReleasePointerCapture(state.editSurface, event.pointerId);
    state.mapSurface?.classList.remove("dragging");
    setEditorMessage(
      didMove
        ? `Resized ${label}. Save to data.js to persist the new width and height, or reset unsaved changes to revert.`
        : `Selected ${label}. Drag a corner handle to resize it or use the width and height inputs below.`,
      didMove ? "success" : ""
    );
    renderEditorState();
    renderMap();
    return;
  }

  if (state.draggingOverlay) {
    const action = state.draggingOverlay.action;
    const didMove = state.draggingOverlay.didMove;
    state.draggingOverlay = null;
    state.overlayResizeHandle = null;
    safeReleasePointerCapture(state.editSurface, event.pointerId);
    state.mapSurface?.classList.remove("dragging");
    setEditorMessage(
      didMove
        ? action === "resize"
          ? "Resized the indoor overlay. Save to data.js to persist the new scale, or reset unsaved changes to revert."
          : "Moved the indoor overlay. Save to data.js to persist the new anchor, or reset unsaved changes to revert."
        : "Indoor overlay selected. Drag inside the frame to move it, or drag a corner handle to resize it.",
      didMove ? "" : ""
    );
    renderEditorState();
    renderMap();
    return;
  }

  if (state.draggingCorridorId) {
    const nodeId = state.draggingCorridorId;
    const label = findEditableNodeRecord(nodeId)?.label || nodeId;
    state.draggingCorridorId = null;
    state.dragOffset = null;
    safeReleasePointerCapture(state.editSurface, event.pointerId);
    state.mapSurface?.classList.remove("dragging");
    setEditorMessage(`Moved ${label}. Save to data.js to persist it, or reset unsaved changes to revert.`, "success");
    renderEditorState();
    renderMap();
    return;
  }

  if (!state.draggingRoomCode) return;

  const roomCode = state.draggingRoomCode;
  state.draggingRoomCode = null;
  state.dragOffset = null;
  safeReleasePointerCapture(state.editSurface, event.pointerId);
  state.mapSurface?.classList.remove("dragging");
  setEditorMessage(`Moved ${roomCode}. Save to data.js to persist it, or reset unsaved changes to revert.`);
  renderEditorState();
  renderMap();
}

function handleEditorPointerLeave() {
  if (!state.editMode || state.draggingRoomCode || state.draggingRoomResize || state.draggingCorridorId || state.draggingCorridorResize || state.draggingOverlay) return;
  if (state.overlayResizeHandle) {
    state.overlayResizeHandle = null;
    renderMap();
  }
  if (state.roomResizeHandle) {
    state.roomResizeHandle = null;
    renderMap();
  }
  if (state.corridorResizeHandle) {
    state.corridorResizeHandle = null;
    renderMap();
  }
  if (state.editorTool === "link") {
    if (state.hoverNodeId) {
      state.hoverNodeId = null;
      renderMap();
    }
    return;
  }

  if (state.editorTool === "add-room") {
    if (state.hoverRoomCode) {
      state.hoverRoomCode = null;
      renderMap();
    }
    if (state.hoverCorridorId) {
      state.hoverCorridorId = null;
      renderMap();
    }
    return;
  }

  if (state.hoverRoomCode || state.hoverCorridorId) {
    state.hoverRoomCode = null;
    state.hoverCorridorId = null;
    renderMap();
  }
}

function updateRoomPosition(roomCode, lat, lng) {
  return updateRoomGeometry(roomCode, { lat, lng });
}

function updateCorridorPosition(nodeId, x, y) {
  return updateCorridorGeometry(nodeId, { x, y });
}

function updateRoomGeometry(roomCode, changes) {
  const room = getRoom(roomCode);
  if (!room) return false;

  if (changes.centerLocalPoint) {
    const latLng = localPointToLatLng(changes.centerLocalPoint.x, changes.centerLocalPoint.y);
    if (!latLng) return false;
    room.lat = roundCoordinate(latLng.lat);
    room.lng = roundCoordinate(latLng.lng);
  } else {
    if (typeof changes.lat === "number") room.lat = roundCoordinate(changes.lat);
    if (typeof changes.lng === "number") room.lng = roundCoordinate(changes.lng);
  }

  if (changes.w != null) room.w = roundRoomDimension(changes.w, "w");
  if (changes.h != null) room.h = roundRoomDimension(changes.h, "h");

  markEditorDirty();
  state.graph = buildGraph();

  if (state.dest === roomCode) {
    refreshGraphAndRoute();
  } else {
    renderMap();
  }

  renderEditorState();
  return true;
}

function updateCorridorGeometry(nodeId, changes) {
  const node = getCorridorNodeById(nodeId);
  if (!node) return false;

  if (typeof changes.x === "number") node.x = Math.round(clamp(changes.x, BUILDING_SHELL.x, BUILDING_SHELL.x + BUILDING_SHELL.w));
  if (typeof changes.y === "number") node.y = Math.round(clamp(changes.y, BUILDING_SHELL.y, BUILDING_SHELL.y + BUILDING_SHELL.h));
  if (changes.centerLocalPoint) {
    node.x = Math.round(clamp(changes.centerLocalPoint.x, BUILDING_SHELL.x, BUILDING_SHELL.x + BUILDING_SHELL.w));
    node.y = Math.round(clamp(changes.centerLocalPoint.y, BUILDING_SHELL.y, BUILDING_SHELL.y + BUILDING_SHELL.h));
  }

  if (changes.w != null) node.w = roundCorridorDimension(changes.w, "w");
  if (changes.h != null) node.h = roundCorridorDimension(changes.h, "h");

  markEditorDirty();
  state.graph = buildGraph();

  if (state.dest) {
    refreshGraphAndRoute();
  } else {
    renderMap();
  }

  renderEditorState();
  return true;
}

function resizeRoomFromHandle(roomCode, handleName, anchorLocalPoint, pointerLocalPoint) {
  if (!anchorLocalPoint || !pointerLocalPoint) return false;

  let left;
  let right;
  let top;
  let bottom;

  if (handleName.includes("w")) {
    right = anchorLocalPoint.x;
    left = Math.min(pointerLocalPoint.x, right - MIN_ROOM_DIMENSION);
  } else {
    left = anchorLocalPoint.x;
    right = Math.max(pointerLocalPoint.x, left + MIN_ROOM_DIMENSION);
  }

  if (handleName.includes("n")) {
    bottom = anchorLocalPoint.y;
    top = Math.min(pointerLocalPoint.y, bottom - MIN_ROOM_DIMENSION);
  } else {
    top = anchorLocalPoint.y;
    bottom = Math.max(pointerLocalPoint.y, top + MIN_ROOM_DIMENSION);
  }

  return updateRoomGeometry(roomCode, {
    centerLocalPoint: { x: (left + right) / 2, y: (top + bottom) / 2 },
    w: right - left,
    h: bottom - top,
  });
}

function resizeCorridorFromHandle(nodeId, handleName, anchorLocalPoint, pointerLocalPoint) {
  if (!anchorLocalPoint || !pointerLocalPoint) return false;

  let left;
  let right;
  let top;
  let bottom;

  if (handleName.includes("w")) {
    right = anchorLocalPoint.x;
    left = Math.min(pointerLocalPoint.x, right - MIN_CORRIDOR_DIMENSION);
  } else {
    left = anchorLocalPoint.x;
    right = Math.max(pointerLocalPoint.x, left + MIN_CORRIDOR_DIMENSION);
  }

  if (handleName.includes("n")) {
    bottom = anchorLocalPoint.y;
    top = Math.min(pointerLocalPoint.y, bottom - MIN_CORRIDOR_DIMENSION);
  } else {
    top = anchorLocalPoint.y;
    bottom = Math.max(pointerLocalPoint.y, top + MIN_CORRIDOR_DIMENSION);
  }

  return updateCorridorGeometry(nodeId, {
    centerLocalPoint: { x: (left + right) / 2, y: (top + bottom) / 2 },
    w: right - left,
    h: bottom - top,
  });
}

function updateSelectedGeometryDimensionsFromInputs() {
  if (!state.editMode || state.editorTool !== "move") return;

  const room = state.selectedRoomCode ? getRoom(state.selectedRoomCode) : null;
  const corridor = !room && state.selectedCorridorId ? getCorridorNodeById(state.selectedCorridorId) : null;
  const widthField = document.getElementById("selected-room-width");
  const heightField = document.getElementById("selected-room-height");
  if ((!room && !corridor) || !widthField || !heightField) return;

  if (widthField.value === "" || heightField.value === "") {
    renderEditorState();
    return;
  }

  const nextWidth = Number(widthField.value);
  const nextHeight = Number(heightField.value);
  const validationError = room
    ? validateRoomDimensions(nextWidth, nextHeight)
    : validateCorridorDimensions(nextWidth, nextHeight);
  if (validationError) {
    setEditorMessage(validationError, "warn");
    renderEditorState();
    return;
  }

  const width = room ? roundRoomDimension(nextWidth, "w") : roundCorridorDimension(nextWidth, "w");
  const height = room ? roundRoomDimension(nextHeight, "h") : roundCorridorDimension(nextHeight, "h");
  const currentDimensions = room ? { w: room.w, h: room.h } : getCorridorDimensions(corridor);
  if (currentDimensions.w === width && currentDimensions.h === height) return;

  const label = room ? room.code : (corridor.label || corridor.id);
  setEditorMessage(`Updated ${label} size to ${width} x ${height} local units.`, "success");
  if (room) {
    updateRoomGeometry(room.code, { w: width, h: height });
  } else {
    updateCorridorGeometry(corridor.id, { w: width, h: height });
  }
}

function cloneRoomLocalPointSnapshot() {
  const snapshot = {};
  for (const [floor, rooms] of Object.entries(ROOM_DATA)) {
    snapshot[floor] = rooms.map(room => ({ code: room.code, ...getRoomLocalPoint(room) }));
  }
  return snapshot;
}

function isScreenPointInsideOverlay(point) {
  const latLng = containerPointToLatLng(point.x, point.y);
  if (!latLng) return false;
  const localPoint = latLngToLocalPoint(latLng.lat, latLng.lng);
  return isLocalPointInsideBuilding(localPoint);
}

function isLocalPointInsideBuilding(point) {
  if (!point) return false;
  return point.x >= BUILDING_SHELL.x && point.x <= BUILDING_SHELL.x + BUILDING_SHELL.w
    && point.y >= BUILDING_SHELL.y && point.y <= BUILDING_SHELL.y + BUILDING_SHELL.h;
}

function cloneRoomLatLngSnapshot() {
  const snapshot = {};
  for (const [floor, rooms] of Object.entries(ROOM_DATA)) {
    snapshot[floor] = rooms.map(room => ({ code: room.code, lat: room.lat, lng: room.lng }));
  }
  return snapshot;
}

function applyOverlayScale(startGeoReference, roomLocalPointSnapshot, nextUnitsPerMeter) {
  GEO_REFERENCE.centerLat = roundCoordinate(startGeoReference.centerLat);
  GEO_REFERENCE.centerLng = roundCoordinate(startGeoReference.centerLng);
  GEO_REFERENCE.unitsPerMeter = roundUnitsPerMeter(nextUnitsPerMeter);

  for (const [floor, rooms] of Object.entries(ROOM_DATA)) {
    const snapshotRooms = roomLocalPointSnapshot[floor] || [];
    rooms.forEach((room, index) => {
      const startRoom = snapshotRooms[index];
      if (!startRoom) return;
      const latLng = localPointToLatLngUsingReference(startRoom.x, startRoom.y, GEO_REFERENCE);
      room.lat = roundCoordinate(latLng.lat);
      room.lng = roundCoordinate(latLng.lng);
    });
  }
}

function applyOverlayShift(startGeoReference, roomLatLngSnapshot, deltaLat, deltaLng) {
  GEO_REFERENCE.centerLat = roundCoordinate(startGeoReference.centerLat + deltaLat);
  GEO_REFERENCE.centerLng = roundCoordinate(startGeoReference.centerLng + deltaLng);
  GEO_REFERENCE.unitsPerMeter = roundUnitsPerMeter(startGeoReference.unitsPerMeter);

  for (const [floor, rooms] of Object.entries(ROOM_DATA)) {
    const snapshotRooms = roomLatLngSnapshot[floor] || [];
    rooms.forEach((room, index) => {
      const startRoom = snapshotRooms[index];
      if (!startRoom) return;
      room.lat = roundCoordinate(startRoom.lat + deltaLat);
      room.lng = roundCoordinate(startRoom.lng + deltaLng);
    });
  }
}

function resetUnsavedRoomData() {
  if (!state.dirtyRoomLayout || !state.roomLayoutResetData) return;

  applyEditorDataSnapshot(state.roomLayoutResetData);
  state.dirtyRoomLayout = false;
  state.graph = buildGraph();
  setEditorMessage("Unsaved layout edits were reverted.", "success");
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
    setEditorMessage(`Saved updated overlay anchor, node links, room positions, and room sizes back to data.js at ${new Date(result.savedAt).toLocaleTimeString()}.`, "success");
  } catch (error) {
    console.error("Failed to save layout data blocks", error);
    setEditorMessage(`Save failed: ${error.message}`, "warn");
  } finally {
    state.saveInFlight = false;
    renderEditorState();
  }
}

function renderEditorState() {
  if (state.demoMode) return;

  const toggle = document.getElementById("toggle-edit-mode");
  const deleteSelected = document.getElementById("delete-selected");
  const save = document.getElementById("save-room-data");
  const copy = document.getElementById("copy-room-data");
  const reset = document.getElementById("reset-room-data");
  const moveTool = document.getElementById("room-edit-tool");
  const addRoomTool = document.getElementById("add-room-tool");
  const linkTool = document.getElementById("link-edit-tool");
  const message = document.getElementById("editor-message");
  const selectedRoomSizeForm = document.getElementById("selected-room-size-form");
  const selectedRoomWidth = document.getElementById("selected-room-width");
  const selectedRoomHeight = document.getElementById("selected-room-height");
  const selectedRoomSizeHint = document.getElementById("selected-room-size-hint");
  const selection = document.getElementById("editor-selection");
  const neighbors = document.getElementById("editor-neighbors");
  const exportBox = document.getElementById("editor-export");
  const newRoomCode = document.getElementById("new-room-code");
  const newRoomWidth = document.getElementById("new-room-width");
  const newRoomHeight = document.getElementById("new-room-height");
  const newRoomZone = document.getElementById("new-room-zone");
  const newRoomNote = document.getElementById("new-room-note");

  if (!toggle || !deleteSelected || !save || !copy || !reset || !moveTool || !addRoomTool || !linkTool || !message || !selection || !neighbors || !exportBox) return;

  const selectedMoveRecord = state.selectedRoomCode
    ? findEditableNodeRecord(`ROOM-${state.selectedRoomCode}`)
    : state.selectedCorridorId
      ? findEditableNodeRecord(state.selectedCorridorId)
      : null;
  const selectedRecord = state.editorTool === "link"
    ? findEditableNodeRecord(state.selectedNodeId)
    : selectedMoveRecord;
  const selectedOverlayLatLng = state.overlaySelected ? { lat: GEO_REFERENCE.centerLat, lng: GEO_REFERENCE.centerLng } : null;
  const selectedLatLng = selectedRecord ? getEditableNodeLatLng(selectedRecord.id) : null;
  const selectedLinks = selectedRecord ? getLinksForRecord(selectedRecord) : [];
  const selectedRoom = state.editorTool === "move" && state.selectedRoomCode ? getRoom(state.selectedRoomCode) : null;
  const selectedCorridor = state.editorTool === "move" && state.selectedCorridorId ? getCorridorNodeById(state.selectedCorridorId) : null;
  const selectedGeometryDimensions = selectedRoom
    ? { w: selectedRoom.w, h: selectedRoom.h }
    : selectedCorridor
      ? getCorridorDimensions(selectedCorridor)
      : null;
  const selectedLayoutRecord = getSelectedLayoutRecord();
  const roomDraft = getNewRoomDraft();
  const roomDraftSummary = `${roomDraft.code || "--"} · ${roomDraft.w || "--"} x ${roomDraft.h || "--"} · ${roomDraft.zone || "--"}`;

  toggle.textContent = state.editMode ? "Disable Layout Editing" : "Enable Layout Editing";
  deleteSelected.disabled = !state.editMode || state.saveInFlight || !selectedLayoutRecord;
  save.disabled = !state.dirtyRoomLayout || state.saveInFlight || !canSaveRoomDataToFile();
  copy.disabled = state.saveInFlight;
  reset.disabled = !state.dirtyRoomLayout || state.saveInFlight;
  moveTool.classList.toggle("active-tool", state.editorTool === "move");
  addRoomTool.classList.toggle("active-tool", state.editorTool === "add-room");
  linkTool.classList.toggle("active-tool", state.editorTool === "link");

  [newRoomCode, newRoomWidth, newRoomHeight, newRoomZone, newRoomNote].forEach(field => {
    if (!field) return;
    field.disabled = !state.editMode || state.saveInFlight;
  });

  if (selectedRoomSizeForm) {
    selectedRoomSizeForm.hidden = !state.editMode || state.editorTool !== "move";
  }

  [selectedRoomWidth, selectedRoomHeight].forEach(field => {
    if (!field) return;
    field.disabled = !selectedGeometryDimensions || !state.editMode || state.saveInFlight;
  });

  if (selectedRoomWidth) {
    selectedRoomWidth.value = selectedGeometryDimensions ? String(Math.round(selectedGeometryDimensions.w)) : "";
  }

  if (selectedRoomHeight) {
    selectedRoomHeight.value = selectedGeometryDimensions ? String(Math.round(selectedGeometryDimensions.h)) : "";
  }

  if (selectedRoomSizeHint) {
    selectedRoomSizeHint.textContent = selectedRoom
      ? `Selected ${selectedRoom.code}. Drag any room corner handle on the map or type width and height here.`
      : selectedCorridor
        ? `Selected ${selectedCorridor.label || selectedCorridor.id}. Drag any corridor corner handle on the map or type width and height here.`
        : "Select a room or corridor in Move / Resize Layout to edit its width and height.";
  }

  message.className = `editor-message${state.editorTone ? ` ${state.editorTone}` : ""}`;
  message.textContent = state.editorMessage;

  selection.textContent = selectedOverlayLatLng
    ? `Selected overlay · lat ${formatCoordinate(selectedOverlayLatLng.lat)} · lng ${formatCoordinate(selectedOverlayLatLng.lng)} · scale ${GEO_REFERENCE.unitsPerMeter.toFixed(3)} units/m` 
    : state.editorTool === "add-room"
    ? `Add room draft (${getFloorLabel(getVisibleFloor())}): ${roomDraftSummary}`
    : selectedRoom && selectedLatLng
    ? `Selected room: ${selectedRoom.code} · ${getFloorLabel(getFloorForRoomCode(selectedRoom.code) || getVisibleFloor())} · ${selectedRoom.w} x ${selectedRoom.h} local units · lat ${formatCoordinate(selectedLatLng.lat)} · lng ${formatCoordinate(selectedLatLng.lng)}`
    : selectedCorridor && selectedLatLng && selectedGeometryDimensions
    ? `Selected corridor: ${selectedCorridor.label || selectedCorridor.id} · ${getFloorLabel(getNodeFloor(selectedCorridor))} · ${selectedGeometryDimensions.w} x ${selectedGeometryDimensions.h} local units · x ${Math.round(selectedCorridor.x)} · y ${Math.round(selectedCorridor.y)}`
    : selectedRecord && selectedLatLng
    ? `Selected ${selectedRecord.kind}: ${selectedRecord.label} · lat ${formatCoordinate(selectedLatLng.lat)} · lng ${formatCoordinate(selectedLatLng.lng)}`
    : "Selected item: --";

  neighbors.textContent = selectedOverlayLatLng
    ? "Neighbors: Drag inside the frame to move the overlay, or drag a corner handle to resize the whole indoor layer uniformly."
    : state.editorTool === "add-room"
    ? "Links: A new room is created where you click and will automatically connect to the nearest entrance, service point, or corridor node. After that, use Edit Links to refine room-to-room or room-to-node connections."
    : selectedRoom
    ? `Neighbors: ${selectedLinks.length ? selectedLinks.map(link => findEditableNodeRecord(link.to)?.label || link.to).join(", ") : "--"}. Drag the room to move it, drag a corner handle to resize it, or type width and height above.`
    : selectedCorridor
    ? `Neighbors: ${selectedLinks.length ? selectedLinks.map(link => findEditableNodeRecord(link.to)?.label || link.to).join(", ") : "--"}. Drag the corridor block to move it, drag a corner handle to resize it, use Edit Links to redesign connectivity, or delete it from the toolbar.`
    : selectedRecord
    ? `Neighbors: ${selectedLinks.length ? selectedLinks.map(link => findEditableNodeRecord(link.to)?.label || link.to).join(", ") : "--"}`
    : "Neighbors: --";

  exportBox.value = state.editMode || state.dirtyRoomLayout ? generateEditableDataSource() : "";
  state.mapSurface?.classList.toggle("editing", state.editMode);
  state.mapSurface?.classList.toggle("dragging", Boolean(state.draggingRoomCode || state.draggingRoomResize || state.draggingCorridorId || state.draggingCorridorResize || state.draggingOverlay));
}

function generateEditableDataSource() {
  const blocks = generateEditableDataBlocks();
  return [blocks.GEO_REFERENCE, blocks.ENTRANCES, blocks.SERVICE_POINTS, blocks.WALKABLE_NODES, blocks.ROOM_DATA].join("\n\n");
}

function generateEditableDataBlocks() {
  return {
    GEO_REFERENCE: generateGeoReferenceBlock(),
    ENTRANCES: generateEntrancesBlock(),
    SERVICE_POINTS: generateServicePointsBlock(),
    WALKABLE_NODES: generateWalkableNodesBlock(),
    ROOM_DATA: generateRoomDataBlock(),
  };
}

function generateGeoReferenceBlock() {
  return [
    "const GEO_REFERENCE = {",
    `  centerLat: ${formatCoordinate(GEO_REFERENCE.centerLat)},`,
    `  centerLng: ${formatCoordinate(GEO_REFERENCE.centerLng)},`,
    `  unitsPerMeter: ${GEO_REFERENCE.unitsPerMeter},`,
    `  minZoom: ${GEO_REFERENCE.minZoom},`,
    `  initialZoom: ${GEO_REFERENCE.initialZoom},`,
    `  maxZoom: ${GEO_REFERENCE.maxZoom},`,
    `  tileUrl: ${JSON.stringify(GEO_REFERENCE.tileUrl)},`,
    `  tileAttribution: ${JSON.stringify(GEO_REFERENCE.tileAttribution)},`,
    "};",
  ].join("\n");
}

function generateEntrancesBlock() {
  const entries = Object.entries(ENTRANCES)
    .map(([key, value]) => `  ${key}: ${formatGraphNodeEntry(value, ["id", "label", "x", "y", "hint", "links"] )},`)
    .join("\n");
  return `const ENTRANCES = {\n${entries}\n};`;
}

function generateServicePointsBlock() {
  const entries = SERVICE_POINTS.map(point => `  ${formatGraphNodeEntry(point, ["id", "label", "x", "y", "floor", "entrance", "links"] )},`).join("\n");
  return `const SERVICE_POINTS = [\n${entries}\n];`;
}

function generateWalkableNodesBlock() {
  const entries = WALKABLE_NODES.map(node => `  ${formatGraphNodeEntry(node, ["id", "floor", "kind", "x", "y", "w", "h", "label", "links"] )},`).join("\n");
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
    geoReference: JSON.parse(JSON.stringify(GEO_REFERENCE)),
    entrances: JSON.parse(JSON.stringify(ENTRANCES)),
    servicePoints: JSON.parse(JSON.stringify(SERVICE_POINTS)),
    walkableNodes: JSON.parse(JSON.stringify(WALKABLE_NODES)),
    roomData: JSON.parse(JSON.stringify(ROOM_DATA)),
  };
}

function applyEditorDataSnapshot(snapshot) {
  Object.assign(GEO_REFERENCE, JSON.parse(JSON.stringify(snapshot.geoReference)));

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

function getNewRoomDraft() {
  return {
    code: normalizeRoomCodeInput(document.getElementById("new-room-code")?.value || ""),
    w: Number(document.getElementById("new-room-width")?.value || 0),
    h: Number(document.getElementById("new-room-height")?.value || 0),
    zone: String(document.getElementById("new-room-zone")?.value || "center").trim() || "center",
    note: String(document.getElementById("new-room-note")?.value || "").trim(),
  };
}

function validateNewRoomDraft(draft) {
  if (!draft.code) return "Room code is required before placing a new room.";
  if (allRoomCodes().includes(draft.code)) return `Room ${draft.code} already exists.`;
  if (getFloorForRoomCode(draft.code) !== getVisibleFloor()) {
    return `Room ${draft.code} does not match ${getFloorLabel(getVisibleFloor())}.`;
  }
  if (!Number.isFinite(draft.w) || draft.w < 24) return "Room width must be at least 24 local units.";
  if (!Number.isFinite(draft.h) || draft.h < 24) return "Room height must be at least 24 local units.";
  return "";
}

function findNearestAttachableNodeId(localPoint) {
  let bestMatch = null;

  for (const node of getNonRoomNodesForFloor(getVisibleFloor())) {
    const distance = Math.hypot(node.x - localPoint.x, node.y - localPoint.y);
    if (!bestMatch || distance < bestMatch.distance) {
      bestMatch = { id: node.id, distance };
    }
  }

  return bestMatch ? bestMatch.id : null;
}

function getSelectedLayoutRecord() {
  if (state.editorTool === "move") {
    if (state.selectedRoomCode) return findEditableNodeRecord(`ROOM-${state.selectedRoomCode}`);
    if (state.selectedCorridorId) return findEditableNodeRecord(state.selectedCorridorId);
  }

  if (state.editorTool === "link" && state.selectedNodeId) {
    const record = findEditableNodeRecord(state.selectedNodeId);
    return isDeletableLayoutRecord(record) ? record : null;
  }

  return null;
}

function isDeletableLayoutRecord(record) {
  return Boolean(record && (record.type === "room" || record.type === "node" && Boolean(getCorridorNodeById(record.id))));
}

function deleteSelectedLayoutItem() {
  const record = getSelectedLayoutRecord();
  if (!record || !isDeletableLayoutRecord(record)) {
    setEditorMessage("Select a room or corridor block before deleting it.", "warn");
    renderEditorState();
    return;
  }

  const label = record.type === "room" ? record.data.code : (record.data.label || record.id);
  const confirmed = window.confirm(`Delete ${label} and remove all of its links?`);
  if (!confirmed) return;

  detachLinksFromTarget(record.id);

  if (record.type === "room") {
    const floor = getFloorForRoomCode(record.data.code);
    const rooms = getRoomsForFloor(floor);
    const index = rooms.findIndex(room => room.code === record.data.code);
    if (index >= 0) rooms.splice(index, 1);
  } else {
    const index = WALKABLE_NODES.findIndex(node => node.id === record.id);
    if (index >= 0) WALKABLE_NODES.splice(index, 1);
  }

  if (state.dest === record.data.code) {
    state.dest = null;
  }

  state.selectedRoomCode = null;
  state.selectedCorridorId = null;
  state.selectedNodeId = null;
  state.hoverRoomCode = null;
  state.hoverCorridorId = null;
  markEditorDirty();
  refreshGraphAndRoute();
  setEditorMessage(`Deleted ${label}.`, "success");
  renderEditorState();
  renderMap();
}

function detachLinksFromTarget(targetId) {
  for (const roomCode of allRoomCodes()) {
    const room = getRoom(roomCode);
    if (room) removeLinkFromRecord({ type: "room", data: room }, targetId);
  }

  for (const node of getNonRoomNodes()) {
    removeLinkFromRecord({ type: "node", data: node }, targetId);
  }
}

function toggleBidirectionalLink(aId, bId) {
  const source = findEditableNodeRecord(aId);
  const target = findEditableNodeRecord(bId);
  if (!source || !target || source.id === target.id) return null;

  const kind = inferLinkKind(source, target);
  const hasExisting = hasLinkTo(source, target.id);

  if (hasExisting) {
    removeLinkFromRecord(source, target.id);
    removeLinkFromRecord(target, source.id);
    return "removed";
  } else {
    addLinkToRecord(source, target.id, kind);
    addLinkToRecord(target, source.id, kind);
    return "added";
  }
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

function roundUnitsPerMeter(value) {
  return Number(clamp(value, 1, 200).toFixed(6));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function validateRoomDimensions(width, height) {
  if (!Number.isFinite(width) || width < MIN_ROOM_DIMENSION) {
    return `Room width must be at least ${MIN_ROOM_DIMENSION} local units.`;
  }
  if (!Number.isFinite(height) || height < MIN_ROOM_DIMENSION) {
    return `Room height must be at least ${MIN_ROOM_DIMENSION} local units.`;
  }
  return "";
}

function validateCorridorDimensions(width, height) {
  if (!Number.isFinite(width) || width < MIN_CORRIDOR_DIMENSION) {
    return `Corridor width must be at least ${MIN_CORRIDOR_DIMENSION} local units.`;
  }
  if (!Number.isFinite(height) || height < MIN_CORRIDOR_DIMENSION) {
    return `Corridor height must be at least ${MIN_CORRIDOR_DIMENSION} local units.`;
  }
  return "";
}

function roundRoomDimension(value, axis) {
  const numeric = Number(value);
  const max = axis === "w" ? BUILDING_SHELL.w : BUILDING_SHELL.h;
  if (!Number.isFinite(numeric)) return MIN_ROOM_DIMENSION;
  return Math.round(clamp(numeric, MIN_ROOM_DIMENSION, max));
}

function roundCorridorDimension(value, axis) {
  const numeric = Number(value);
  const max = axis === "w" ? BUILDING_SHELL.w : BUILDING_SHELL.h;
  if (!Number.isFinite(numeric)) return MIN_CORRIDOR_DIMENSION;
  return Math.round(clamp(numeric, MIN_CORRIDOR_DIMENSION, max));
}

function localPointToLatLngUsingReference(x, y, reference) {
  const latMeters = (MAP.height / 2 - y) / reference.unitsPerMeter;
  const lngMeters = (x - MAP.width / 2) / reference.unitsPerMeter;
  return {
    lat: reference.centerLat + latMeters / 111320,
    lng: reference.centerLng + lngMeters / (111320 * Math.cos(reference.centerLat * Math.PI / 180)),
  };
}

function roundCoordinate(value) {
  return Number(Number(value).toFixed(9));
}

function safeSetPointerCapture(element, pointerId) {
  if (!element?.setPointerCapture || pointerId == null) return;
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // Ignore synthetic or unsupported pointer-capture failures.
  }
}

function safeReleasePointerCapture(element, pointerId) {
  if (!element?.releasePointerCapture || pointerId == null) return;
  try {
    element.releasePointerCapture(pointerId);
  } catch {
    // Ignore synthetic or unsupported pointer-capture failures.
  }
}

function renderMapSourceNote() {
  const note = document.getElementById("map-source-note");
  if (!note) return;
  note.textContent = state.mapNote;
}
