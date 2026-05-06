/* Demo-mode flow, routing, and top-level UI wiring. */

function startCampusCompassApp() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeCampusCompassApp, { once: true });
    return;
  }

  initializeCampusCompassApp();
}

async function initializeCampusCompassApp() {
  if (state.appStarted) return;
  state.appStarted = true;

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
}

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

  // Keep link-editor selection across floor changes for cross-floor linking.
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
      state.recommendation = null;
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

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") tryRoute();
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
  if (node?.id && (node.id.includes("SERVICE") || node.entrance)) return "all";
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
  return (path || []).filter(id => {
    const floor = getNodeFloor(state.graph?.nodes[id]);
    return floor === getVisibleFloor() || floor === "all";
  });
}

function clearRoute() {
  state.dest = null;
  state.activeFloor = 1;
  state.route = null;
  state.recommendation = null;
  state.mode = state.entrance === "SW" ? "recommend" : "idle";
  syncSelectionToVisibleFloor();
  renderFloorPicker();
  renderMap();
  renderStatus();
}

function renderSuggestions(prefix) {
  const box = document.getElementById("suggestions");
  box.innerHTML = "";
  const normalizedPrefix = normalizeRoomSearchInput(prefix || "");
  const matches = allRoomCodes()
    .filter(code => !normalizedPrefix || code.startsWith(normalizedPrefix))
    .slice(0, 4);

  if (matches.length === 0 && normalizedPrefix.length >= 3) {
    const span = document.createElement("span");
    span.textContent = `No room found for "${normalizedPrefix}".`;
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
    state.recommendation = null;
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
    state.recommendation = null;
    state.mode = state.entrance === "SW" ? "recommend" : "idle";
    renderFloorPicker();
    renderMap();
    renderStatus();
    return;
  }

  if (state.entrance === "SW") {
    applySouthWestRoutingDecision();
  } else {
    state.recommendation = null;
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

function applySouthWestRoutingDecision() {
  const destinationFloor = getFloorForRoomCode(state.dest) || 1;
  const recommendedPathDistance = estimatePathDistance(RECOMMENDED_SW_TO_NW);

  if (destinationFloor === 1) {
    state.route = { path: RECOMMENDED_SW_TO_NW, distance: recommendedPathDistance };
    state.recommendation = null;
    state.mode = "recommend";
    state.activeFloor = 1;
    return;
  }

  const directFromSw = dijkstra(state.graph, ENTRANCES.SW.id, `ROOM-${state.dest}`);
  const fromNwToDestination = dijkstra(state.graph, ENTRANCES.NW.id, `ROOM-${state.dest}`);
  const northWestTotalDistance = fromNwToDestination
    ? recommendedPathDistance + fromNwToDestination.distance
    : Infinity;
  const usesSouthWestStair = Boolean(directFromSw?.path?.includes("F2-SW-STAIR"));
  const shouldUseSouthWestStair = Boolean(directFromSw)
    && usesSouthWestStair
    && directFromSw.distance <= northWestTotalDistance;

  if (shouldUseSouthWestStair || (directFromSw && !fromNwToDestination)) {
    state.route = directFromSw;
    state.recommendation = null;
    state.mode = "route";
    state.activeFloor = destinationFloor;
    return;
  }

  if (fromNwToDestination) {
    state.route = { path: RECOMMENDED_SW_TO_NW, distance: recommendedPathDistance };
    state.recommendation = {
      viaEntrance: "NW",
      continuation: fromNwToDestination,
    };
    state.mode = "recommend";
    state.activeFloor = 1;
    return;
  }

  state.route = null;
  state.recommendation = null;
  state.mode = "unreachable";
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
  setTimeout(() => {
    el.style.borderColor = "";
  }, 600);
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
    const [distance, nodeId] = pq.shift();
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    if (nodeId === endId) break;

    for (const { to, w } of graph.edges[nodeId] || []) {
      if (visited.has(to)) continue;
      const nextDistance = distance + w;
      if (nextDistance < dist[to]) {
        dist[to] = nextDistance;
        prev[to] = nodeId;
        pq.push([nextDistance, to]);
      }
    }
  }

  if (dist[endId] === Infinity) return null;

  const path = [];
  let currentId = endId;
  while (currentId !== undefined) {
    path.unshift(currentId);
    currentId = prev[currentId];
  }
  return { path, distance: dist[endId] };
}

function estimatePathDistance(path) {
  let total = 0;
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = state.graph.nodes[path[index]];
    const end = state.graph.nodes[path[index + 1]];
    if (start && end) total += Math.hypot(start.x - end.x, start.y - end.y);
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
    const continuation = state.recommendation?.continuation;
    if (state.dest && continuation) {
      const destinationFloorNumber = getFloorForRoomCode(state.dest) || 1;
      if (destinationFloorNumber > 1 && getVisibleFloor() === 1) {
        message.textContent = "Dashed line shows Floor 1 guidance from SW to NW, and the solid line previews the NW-to-destination route. Switch to Floor 2 for the detailed arrival segment.";
      } else {
        message.textContent = "Dashed line shows Floor 1 guidance from SW to NW. Then continue to the destination from the North-West Entrance.";
      }
    } else if (state.dest && (getFloorForRoomCode(state.dest) || 1) > 1) {
      message.textContent = "For this Floor 2 destination, the North-West stair approach is shorter. Please go to the North-West Entrance first.";
    } else {
      message.textContent = "From the South-West Entrance, please go to the North-West Entrance first.";
    }
    if (state.route) {
      dist.textContent = Math.round(state.route.distance / 10);
      time.textContent = Math.max(10, Math.round(state.route.distance / 14));
    }
    addStep("You are at the South-West Entrance.");
    addStep("Go to the North-West Entrance before starting indoor navigation.");
    if (state.dest) addStep(`Then navigate to ${state.dest} from the North-West Entrance.`);
    if (continuation) {
      addStep(`After reaching NW, shortest route to ${state.dest} is about ${Math.round(continuation.distance / 10)} m (${Math.max(5, Math.round(continuation.distance / 14))} min).`);
      addRouteNarrative(continuation.path, ENTRANCES.NW.label);
    }
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
    message.textContent = "South-West users should go to the North-West Entrance by default.";
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

window.addEventListener("load", () => {
  void initializeCampusCompassApp();
}, { once: true });