/* CampusCompass - EB first-floor graph based on EB1(1).docx.
 *
 * Coordinate convention:
 *   top = North, bottom = South, left = West, right = East.
 *
 * The first floor is modelled as one linked north-side corridor between the
 * NW and NE entrances. There are no west-side or east-side corridor loops.
 */

const MAP = {
  width: 1000,
  height: 640,
};

const GEO_REFERENCE = {
  centerLat: 31.274474868,
  centerLng: 120.737729881,
  unitsPerMeter: 6.834551,
  minZoom: 18,
  initialZoom: 20,
  maxZoom: 22,
  tileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
  tileAttribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community",
};

const MAP_PROVIDER = {
  preferred: "google",
  fallbackProvider: "leaflet",
  googleMapTypeId: "satellite",
  googleMinZoom: 18,
  googleInitialZoom: 20,
  googleMaxZoom: 22,
};

const BUILDING_SHELL = {
  x: 24,
  y: 24,
  w: MAP.width - 48,
  h: MAP.height - 48,
};

const ENTRANCES = {
  NW: { id: "NW-ENTRY", label: "North-West Entrance", x: 110, y: 125, hint: "西北入口", links: [{ to: "NW-HUB", kind: "connector" }] },
  NE: { id: "NE-ENTRY", label: "North-East Entrance", x: 910, y: 125, hint: "东北入口", links: [{ to: "NE-HUB", kind: "connector" }] },
  SW: { id: "SW-ENTRY", label: "South-West Entrance", x: 110, y: 570, hint: "西南入口", links: [] },
};

const SERVICE_POINTS = [
  { id: "NW-SERVICE", label: "Lift / Stair", x: 135, y: 170, entrance: "NW", links: [{ to: "NW-HUB", kind: "connector" }] },
  { id: "NE-SERVICE", label: "Lift / Stair", x: 875, y: 170, entrance: "NE", links: [{ to: "NE-HUB", kind: "connector" }] },
  { id: "SW-SERVICE", label: "Lift / Stair", x: 150, y: 540, entrance: "SW", links: [] },
];

const WALKABLE_NODES = [
  { id: "NW-HUB", x: 145, y: 160, label: "NW hub", links: [{ to: "NW-ENTRY", kind: "connector" }, { to: "NW-SERVICE", kind: "connector" }, { to: "NORTH-139", kind: "corridor" }] },
  { id: "NORTH-139", x: 200, y: 160, links: [{ to: "NW-HUB", kind: "corridor" }, { to: "NORTH-133", kind: "corridor" }, { to: "ROOM-EB139", kind: "room" }] },
  { id: "NORTH-133", x: 255, y: 160, links: [{ to: "NORTH-139", kind: "corridor" }, { to: "NORTH-131", kind: "corridor" }, { to: "ROOM-EB133", kind: "room" }] },
  { id: "NORTH-131", x: 320, y: 160, links: [{ to: "NORTH-133", kind: "corridor" }, { to: "NORTH-119", kind: "corridor" }, { to: "ROOM-EB131", kind: "room" }] },
  { id: "NORTH-119", x: 390, y: 160, links: [{ to: "NORTH-131", kind: "corridor" }, { to: "NORTH-115", kind: "corridor" }, { to: "ROOM-EB119", kind: "room" }] },
  { id: "NORTH-115", x: 455, y: 160, links: [{ to: "NORTH-119", kind: "corridor" }, { to: "NORTH-111", kind: "corridor" }, { to: "ROOM-EB115", kind: "room" }] },
  { id: "NORTH-111", x: 520, y: 160, links: [{ to: "NORTH-115", kind: "corridor" }, { to: "NORTH-132", kind: "corridor" }, { to: "ROOM-EB111", kind: "room" }] },
  { id: "NORTH-132", x: 585, y: 160, links: [{ to: "NORTH-111", kind: "corridor" }, { to: "NORTH-136", kind: "corridor" }, { to: "ROOM-EB132", kind: "room" }] },
  { id: "NORTH-136", x: 650, y: 160, links: [{ to: "NORTH-132", kind: "corridor" }, { to: "EB138-SMALL-DOOR", kind: "doorway" }, { to: "NORTH-104", kind: "corridor" }, { to: "ROOM-EB136", kind: "room" }] },
  { id: "EB138-SMALL-DOOR", x: 610, y: 315, label: "Small door to EB138", links: [{ to: "NORTH-136", kind: "doorway" }, { to: "ROOM-EB138", kind: "room" }] },
  { id: "NORTH-104", x: 760, y: 160, links: [{ to: "NORTH-136", kind: "corridor" }, { to: "NORTH-102", kind: "corridor" }, { to: "ROOM-EB104", kind: "room" }] },
  { id: "NORTH-102", x: 830, y: 160, links: [{ to: "NORTH-104", kind: "corridor" }, { to: "NORTH-106", kind: "doorway" }, { to: "NORTH-155", kind: "corridor" }, { to: "ROOM-EB102", kind: "room" }] },
  { id: "NORTH-106", x: 830, y: 205, links: [{ to: "NORTH-102", kind: "doorway" }, { to: "ROOM-EB106", kind: "room" }] },
  { id: "NORTH-155", x: 875, y: 160, links: [{ to: "NORTH-102", kind: "corridor" }, { to: "NE-HUB", kind: "corridor" }, { to: "ROOM-EB155", kind: "room" }] },
  { id: "NORTH-161", x: 925, y: 160, links: [{ to: "NE-HUB", kind: "corridor" }, { to: "ROOM-EB161", kind: "room" }] },
  { id: "NE-HUB", x: 890, y: 160, label: "NE hub", links: [{ to: "NE-ENTRY", kind: "connector" }, { to: "NE-SERVICE", kind: "connector" }, { to: "NORTH-155", kind: "corridor" }, { to: "NORTH-161", kind: "corridor" }] },
];

// Room lat/lng are the authoritative persisted positions for editing.
const ROOM_DATA = {
  1: [
    { code: "EB139", lat: 31.274814337, lng: 120.737256170, w: 90, h: 56, zone: "north", links: [{ to: "NORTH-139", kind: "room" }] },
    { code: "EB133", lat: 31.274813035, lng: 120.737403065, w: 90, h: 56, zone: "north", links: [{ to: "NORTH-133", kind: "room" }] },
    { code: "EB131", lat: 31.274802646, lng: 120.737566343, w: 96, h: 64, zone: "north", links: [{ to: "NORTH-131", kind: "room" }] },
    { code: "EB119", lat: 31.274798087, lng: 120.737720501, w: 88, h: 56, zone: "north", links: [{ to: "NORTH-119", kind: "room" }] },
    { code: "EB115", lat: 31.274801442, lng: 120.737867602, w: 88, h: 56, zone: "north", links: [{ to: "NORTH-115", kind: "room" }] },
    { code: "EB111", lat: 31.274797627, lng: 120.738041663, w: 88, h: 56, zone: "north", links: [{ to: "NORTH-111", kind: "room" }] },
    { code: "EB132", lat: 31.274594506, lng: 120.737441983, w: 92, h: 56, zone: "north", links: [{ to: "NORTH-132", kind: "room" }] },
    { code: "EB136", lat: 31.274600817, lng: 120.737282123, w: 115, h: 92, zone: "north", links: [{ to: "NORTH-136", kind: "room" }] },
    { code: "EB138", lat: 31.274461623, lng: 120.737305214, w: 145, h: 108, zone: "north", links: [{ to: "EB138-SMALL-DOOR", kind: "room" }], note: "Tiered classroom / 2F link" },
    { code: "EB102", lat: 31.274604339, lng: 120.738340323, w: 92, h: 56, zone: "east", links: [{ to: "NORTH-102", kind: "room" }] },
    { code: "EB104", lat: 31.274510029, lng: 120.738256839, w: 150, h: 82, zone: "east", links: [{ to: "NORTH-104", kind: "room" }] },
    { code: "EB106", lat: 31.274605022, lng: 120.738190767, w: 92, h: 56, zone: "east", links: [{ to: "NORTH-106", kind: "room" }] },
    { code: "EB155", lat: 31.274379372, lng: 120.738300948, w: 88, h: 52, zone: "east", links: [{ to: "NORTH-155", kind: "room" }] },
    { code: "EB161", lat: 31.274183822, lng: 120.738288736, w: 82, h: 54, zone: "east", links: [{ to: "NORTH-161", kind: "room" }] },
  ],
};

const INACCESSIBLE_AREAS = [
  { x: 95, y: 330, w: 815, h: 235, label: "Inaccessible area" },
  { x: 95, y: 265, w: 360, h: 55, label: "No corridor" },
  { x: 810, y: 330, w: 120, h: 150, label: "No corridor" },
];

const RECOMMENDED_SW_TO_NW = ["SW-ENTRY", "NW-ENTRY"];

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

function getRoomLatLng(room) {
  if (typeof room.lat === "number" && typeof room.lng === "number") {
    return { lat: room.lat, lng: room.lng };
  }
  if (typeof room.x === "number" && typeof room.y === "number") {
    return mapLocalPointToLatLng(room.x, room.y);
  }
  return null;
}

function getRoomLocalPoint(room) {
  if (typeof room.lat === "number" && typeof room.lng === "number") {
    return mapLatLngToLocalPoint(room.lat, room.lng);
  }
  if (typeof room.x === "number" && typeof room.y === "number") {
    return { x: room.x, y: room.y };
  }
  return null;
}

function buildGraph() {
  const nodes = {};
  const edges = {};
  const linkedPairs = new Set();

  function addNode(n) {
    nodes[n.id] = n;
    edges[n.id] = edges[n.id] || [];
  }

  function link(a, b, w) {
    const pairKey = [a, b].sort().join("::");
    if (linkedPairs.has(pairKey)) return;
    const A = nodes[a];
    const B = nodes[b];
    if (!A || !B) return;
    const weight = w == null ? Math.hypot(A.x - B.x, A.y - B.y) : w;
    edges[a].push({ to: b, w: weight });
    edges[b].push({ to: a, w: weight });
    linkedPairs.add(pairKey);
  }

  for (const e of Object.values(ENTRANCES)) {
    addNode({ ...e, floor: 1, kind: "entrance" });
  }

  for (const sp of SERVICE_POINTS) {
    addNode({ ...sp, floor: 1, kind: "service" });
  }

  for (const n of WALKABLE_NODES) {
    addNode({ ...n, floor: 1, kind: "corridor" });
  }

  for (const room of ROOM_DATA[1]) {
    const roomPoint = getRoomLocalPoint(room);
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
  return ROOM_DATA[1].map(r => r.code).sort();
}

function getRoom(code) {
  return ROOM_DATA[1].find(r => r.code === code);
}
