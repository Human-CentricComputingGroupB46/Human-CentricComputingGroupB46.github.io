/* Map setup, projection helpers, and canvas rendering. */

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

  if (!isLayerVisible("zones")) return;

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

    const strokeStyle = segment.isCrossFloor
      ? "rgba(220, 100, 100, 0.9)"
      : (segment.kind === "doorway" ? "rgba(107, 123, 146, 0.98)" : "rgba(169, 194, 227, 0.95)");
    const lineWidth = segment.isCrossFloor
      ? localUnitsToPixels(6)
      : (segment.kind === "doorway" ? localUnitsToPixels(4) : localUnitsToPixels(18));
    const lineDash = segment.isCrossFloor
      ? [10, 10]
      : (segment.kind === "doorway" ? [7, 6] : []);

    drawGeoLine(ctx, a.x, a.y, b.x, b.y, {
      strokeStyle,
      lineWidth,
      lineDash,
    });
  }
}

function getNonRoomNodes() {
  return [...Object.values(ENTRANCES), ...SERVICE_POINTS, ...WALKABLE_NODES];
}

function getNonRoomNodesForFloor(floor = getVisibleFloor()) {
  return getNonRoomNodes().filter(node => getNodeFloor(node) === floor || getNodeFloor(node) === "all");
}

function getGraphNodeById(id) {
  return getNonRoomNodes().find(node => node.id === id) || null;
}

function getCorridorNodesForFloor(floor = getVisibleFloor()) {
  return WALKABLE_NODES.filter(node => getNodeFloor(node) === floor || getNodeFloor(node) === "all");
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
  if (!isLayerVisible("corridors") && !isLayerVisible("services")) return null;
  let bestMatch = null;

  for (const node of getNonRoomNodesForFloor()) {
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
      const targetFloor = getNodeFloor(target);
      const isCrossFloor = targetFloor !== visibleFloor && targetFloor !== "all";
      const isActivelySelected = state.editMode && (state.selectedNodeId === node.id || state.selectedNodeId === link.to);
      if (!target || (isCrossFloor && !isActivelySelected)) continue;
      const pairKey = [node.id, link.to].sort().join("::");
      if (seen.has(pairKey)) continue;
      segments.push({ from: node.id, to: link.to, kind: link.kind || "corridor", isCrossFloor });
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
      const isCrossFloor = targetFloor !== visibleFloor && targetFloor !== "all";
      const isActivelySelected = state.editMode && (state.selectedNodeId === from || state.selectedNodeId === to);
      if (!targetRecord || (isCrossFloor && !isActivelySelected)) continue;

      segments.push({
        from,
        to,
        isCrossFloor,
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

    const strokeStyle = segment.isCrossFloor
      ? "rgba(220, 100, 100, 0.9)"
      : (segment.kind === "room-room" ? "rgba(79, 122, 189, 0.9)" : "rgba(141, 166, 198, 0.95)");
    const lineWidth = segment.isCrossFloor
      ? localUnitsToPixels(4)
      : localUnitsToPixels(segment.kind === "room-room" ? 3 : 2);
    const lineDash = segment.isCrossFloor
      ? [12, 6]
      : (segment.kind === "room-room" ? [8, 4] : [4, 4]);

    drawGeoLine(ctx, start.x, start.y, end.x, end.y, {
      strokeStyle,
      lineWidth,
      lineDash,
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
  for (const servicePoint of SERVICE_POINTS.filter(point => getNodeFloor(point) === getVisibleFloor() || getNodeFloor(point) === "all")) {
    const point = projectLocalPoint(servicePoint.x, servicePoint.y);
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
  if (state.mode === "recommend") {
    if (state.entrance === "SW" && getVisibleFloor() === 1) {
      drawRecommendedPath(ctx);
    }

    const continuationPath = state.recommendation?.continuation?.path;
    const continuationToDraw = getVisibleRoutePath(continuationPath);
    if (continuationToDraw.length >= 2) {
      drawPolyline(ctx, continuationToDraw, {
        strokeStyle: "#f29325",
        lineWidth: 7,
        lineDash: [],
      });
    }
    return;
  }

  const visiblePath = getVisibleRoutePath();
  if (!state.route || visiblePath.length < 2) return;

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
  const defaultVisiblePath = getVisibleRoutePath();
  const continuationVisiblePath = state.mode === "recommend"
    ? getVisibleRoutePath(state.recommendation?.continuation?.path)
    : [];
  const markerPath = continuationVisiblePath.length && getVisibleFloor() > 1
    ? continuationVisiblePath
    : defaultVisiblePath;
  const start = markerPath.length
    ? state.graph.nodes[markerPath[0]]
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
  if (!destNode || destNode.floor !== getVisibleFloor()) return;
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
  if (!isLayerVisible("rooms")) return null;
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

function renderMapSourceNote() {
  const note = document.getElementById("map-source-note");
  if (!note) return;
  note.textContent = state.mapNote;
}