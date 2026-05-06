/* Design-mode editor, geometry mutation, and data export helpers. */

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
    ? new Set(getLinksForRecord(selectedRecord).map(link => link.to))
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
    } else if (isHover || isNeighbor) {
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

  document.addEventListener("keydown", event => {
    if (!state.editMode) return;
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA" || event.target.tagName === "SELECT") return;
    if (event.key === "Backspace" || event.key === "Delete") {
      deleteSelectedLayoutItem();
      event.preventDefault();
    }
  });

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
  state.editSurface.addEventListener("wheel", event => {
    if (!state.editMode || !state.map) return;
    const delta = Math.sign(event.deltaY);
    if (state.mapProvider === "google") {
      state.map.setZoom(state.map.getZoom() - delta);
    } else if (state.map.setZoom && state.map.getZoom) {
      state.map.setZoom(state.map.getZoom() - delta);
    }
    event.preventDefault();
  }, { passive: false });

  wireLayerFilter();
}

function wireLayerFilter() {
  const fieldset = document.querySelector(".editor-layer-filter");
  if (!fieldset) return;
  fieldset.addEventListener("change", event => {
    const cb = event.target.closest("input[data-layer]");
    if (!cb) return;
    state.visibleLayers[cb.dataset.layer] = cb.checked;
    deselectHiddenLayerObjects();
    renderEditorState();
    renderMap();
  });
}

function deselectHiddenLayerObjects() {
  if (state.selectedRoomCode && !isLayerVisible("rooms")) {
    state.selectedRoomCode = null;
    state.draggingRoomCode = null;
    state.draggingRoomResize = null;
    state.hoverRoomCode = null;
    state.roomResizeHandle = null;
  }
  if (state.selectedCorridorId && !isLayerVisible("corridors")) {
    state.selectedCorridorId = null;
    state.draggingCorridorId = null;
    state.draggingCorridorResize = null;
    state.hoverCorridorId = null;
    state.corridorResizeHandle = null;
  }
  if (state.selectedNodeId) {
    const record = findEditableNodeRecord(state.selectedNodeId);
    if (record) {
      const layer = record.type === "room" ? "rooms"
        : record.type === "corridor" ? "corridors"
        : record.type === "entrance" ? "entrances"
        : record.type === "service" ? "services"
        : null;
      if (layer && !isLayerVisible(layer)) {
        state.selectedNodeId = null;
        state.hoverNodeId = null;
      }
    }
  }
}

function isLayerVisible(layer) {
  if (state.demoMode || !state.editMode) return true;
  return state.visibleLayers[layer] !== false;
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
    state.draggingMap = null;
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
  state.draggingMap = null;
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
        ? "Move/Resize: Drag to move, handles to resize. Select & press Delete to remove. Drag empty space to pan, wheel to zoom. Shift-drag map to move overlay."
        : "Move/Resize: Drag to move, handles to resize. Select & press Delete to remove. Drag empty space to pan, wheel to zoom.",
      canSaveRoomDataToFile() ? "" : "warn"
    );
  } else if (tool === "add-room") {
    state.selectedCorridorId = null;
    state.selectedNodeId = null;
    setEditorMessage(
      "Add Room is active. Click inside map to place a new room. Drag empty space to pan, wheel to zoom.",
      ""
    );
  } else {
    state.selectedNodeId = state.selectedRoomCode
      ? `ROOM-${state.selectedRoomCode}`
      : state.selectedCorridorId || state.selectedNodeId;
    state.selectedRoomCode = null;
    state.selectedCorridorId = null;
    setEditorMessage(
      "Edit Links is active. Click a node, then click another to connect. Drag empty space to pan, wheel to zoom.",
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
    if (!handleAddRoomPointerDown(point)) {
      startMapPanning(point, event);
    }
    return;
  }

  if (state.editorTool === "link") {
    if (!handleLinkEditorPointerDown(point)) {
      startMapPanning(point, event);
    }
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

  if (!room && !corridor && isScreenPointInsideOverlay(point) && event.shiftKey) {
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
    startMapPanning(point, event);
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
    return false;
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
    return true;
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
  return true;
}

function startMapPanning(point, event) {
  state.selectedRoomCode = null;
  state.selectedCorridorId = null;
  state.draggingMap = { lastPoint: point };
  state.mapSurface?.classList.add("dragging-map");
  safeSetPointerCapture(state.editSurface, event.pointerId);
  setEditorMessage("Dragging the map viewport...");
  renderEditorState();
  renderMap();
  event.preventDefault();
}

function handleAddRoomPointerDown(point) {
  if (!isScreenPointInsideOverlay(point)) return false;

  const draft = getNewRoomDraft();
  const validationError = validateNewRoomDraft(draft);
  if (validationError) {
    setEditorMessage(validationError, "warn");
    renderEditorState();
    return true;
  }

  const latLng = containerPointToLatLng(point.x, point.y);
  if (!latLng) {
    setEditorMessage("Could not convert the clicked point into map coordinates.", "warn");
    renderEditorState();
    return true;
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
  return true;
}

function handleEditorPointerMove(event) {
  if (!state.editMode || isEditorControlTarget(event.target)) return;

  const point = getSurfacePointFromEvent(event);

  if (state.draggingMap) {
    const dx = point.x - state.draggingMap.lastPoint.x;
    const dy = point.y - state.draggingMap.lastPoint.y;
    if (state.mapProvider === "google") {
      state.map.panBy(-dx, -dy);
    } else if (state.map) {
      state.map.panBy([-dx, -dy], { animate: false });
    }
    state.draggingMap.lastPoint = point;
    renderMap();
    event.preventDefault();
    return;
  }

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
  if (state.draggingMap) {
    state.draggingMap = null;
    state.mapSurface?.classList.remove("dragging-map");
    safeReleasePointerCapture(state.editSurface, event.pointerId);
    setEditorMessage("Layout editing is on. Map panned.");
    renderEditorState();
    renderMap();
    event.preventDefault();
    return;
  }

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
      ""
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
  if (state.draggingMap) return;
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
    .map(([key, value]) => `  ${key}: ${formatGraphNodeEntry(value, ["id", "label", "x", "y", "hint", "links"])},`)
    .join("\n");
  return `const ENTRANCES = {\n${entries}\n};`;
}

function generateServicePointsBlock() {
  const entries = SERVICE_POINTS.map(point => `  ${formatGraphNodeEntry(point, ["id", "label", "x", "y", "floor", "entrance", "links"])},`).join("\n");
  return `const SERVICE_POINTS = [\n${entries}\n];`;
}

function generateWalkableNodesBlock() {
  const entries = WALKABLE_NODES.map(node => `  ${formatGraphNodeEntry(node, ["id", "floor", "kind", "x", "y", "w", "h", "label", "links"])},`).join("\n");
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
  return Boolean(record && (record.type === "room" || (record.type === "node" && Boolean(getCorridorNodeById(record.id)))));
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
  }

  addLinkToRecord(source, target.id, kind);
  addLinkToRecord(target, source.id, kind);
  return "added";
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