/* CampusCompass data processing helpers.
 *
 * Raw editable fields live in data.js.
 * This file contains coordinate conversion, room lookup, and graph-building steps.
 */

function mapLocalPointToLatLng(x, y) {
  const latMeters = (MAP.height / 2 - y) / GEO_REFERENCE.unitsPerMeter;
  const lngMeters = (x - MAP.width / 2) / GEO_REFERENCE.unitsPerMeter;
  return {
    lat: GEO_REFERENCE.centerLat + latMeters / 111320,
    lng: GEO_REFERENCE.centerLng + lngMeters / (111320 * Math.cos(GEO_REFERENCE.centerLat * Math.PI / 180)),
  };
}

function mapLatLngToLocalPoint(lat, lng) {
  const latMeters = (lat - GEO_REFERENCE.centerLat) * 111320;
  const lngMeters = (lng - GEO_REFERENCE.centerLng) * 111320 * Math.cos(GEO_REFERENCE.centerLat * Math.PI / 180);
  return {
    x: MAP.width / 2 + lngMeters * GEO_REFERENCE.unitsPerMeter,
    y: MAP.height / 2 - latMeters * GEO_REFERENCE.unitsPerMeter,
  };
}

function getRoomsForFloor(floor = 1) {
  return ROOM_DATA[floor] || [];
}

function getRoomLatLng(room) {
  if (typeof room?.lat === "number" && typeof room?.lng === "number") {
    return { lat: room.lat, lng: room.lng };
  }
  if (typeof room?.x === "number" && typeof room?.y === "number") {
    return mapLocalPointToLatLng(room.x, room.y);
  }
  return null;
}

function getRoomLocalPoint(room) {
  if (typeof room?.lat === "number" && typeof room?.lng === "number") {
    return mapLatLngToLocalPoint(room.lat, room.lng);
  }
  if (typeof room?.x === "number" && typeof room?.y === "number") {
    return { x: room.x, y: room.y };
  }
  return null;
}

function buildGraph() {
  const nodes = {};
  const edges = {};
  const linkedPairs = new Set();

  function addNode(node) {
    nodes[node.id] = node;
    edges[node.id] = edges[node.id] || [];
  }

  function link(a, b, weightOverride) {
    const pairKey = [a, b].sort().join("::");
    if (linkedPairs.has(pairKey)) return;

    const start = nodes[a];
    const end = nodes[b];
    if (!start || !end) return;

    const weight = weightOverride == null ? Math.hypot(start.x - end.x, start.y - end.y) : weightOverride;
    edges[a].push({ to: b, w: weight });
    edges[b].push({ to: a, w: weight });
    linkedPairs.add(pairKey);
  }

  for (const entrance of Object.values(ENTRANCES)) {
    addNode({ ...entrance, floor: 1, kind: "entrance" });
  }

  for (const servicePoint of SERVICE_POINTS) {
    addNode({ ...servicePoint, floor: 1, kind: "service" });
  }

  for (const walkableNode of WALKABLE_NODES) {
    addNode({ ...walkableNode, floor: 1, kind: "corridor" });
  }

  for (const room of getRoomsForFloor(1)) {
    const roomPoint = getRoomLocalPoint(room);
    if (!roomPoint) continue;

    addNode({
      id: `ROOM-${room.code}`,
      x: roomPoint.x,
      y: roomPoint.y,
      floor: 1,
      kind: "room",
      room: room.code,
      label: room.code,
      links: room.links || [],
    });
  }

  for (const node of Object.values(nodes)) {
    const links = Array.isArray(node.links) ? node.links : [];
    for (const descriptor of links) {
      link(node.id, descriptor.to);
    }
  }

  return { nodes, edges };
}

function allRoomCodes() {
  return getRoomsForFloor(1).map(room => room.code).sort();
}

function getRoom(code, floor = 1) {
  return getRoomsForFloor(floor).find(room => room.code === code) || null;
}