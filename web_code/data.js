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

const ENTRANCES = {
  NW: { id: "NW-ENTRY", label: "North-West Entrance", x: 110, y: 125, hint: "西北入口" },
  NE: { id: "NE-ENTRY", label: "North-East Entrance", x: 910, y: 125, hint: "东北入口" },
  SW: { id: "SW-ENTRY", label: "South-West Entrance", x: 110, y: 570, hint: "西南入口" },
};

const SERVICE_POINTS = [
  { id: "NW-SERVICE", label: "Lift / Stair", x: 135, y: 170, entrance: "NW" },
  { id: "NE-SERVICE", label: "Lift / Stair", x: 875, y: 170, entrance: "NE" },
  { id: "SW-SERVICE", label: "Lift / Stair", x: 150, y: 540, entrance: "SW" },
];

const WALKABLE_NODES = [
  { id: "NW-HUB", x: 145, y: 160, label: "NW hub" },
  { id: "NORTH-139", x: 200, y: 160 },
  { id: "NORTH-133", x: 255, y: 160 },
  { id: "NORTH-131", x: 320, y: 160 },
  { id: "NORTH-119", x: 390, y: 160 },
  { id: "NORTH-115", x: 455, y: 160 },
  { id: "NORTH-111", x: 520, y: 160 },
  { id: "NORTH-132", x: 585, y: 160 },
  { id: "NORTH-136", x: 650, y: 160 },
  { id: "EB138-SMALL-DOOR", x: 610, y: 315, label: "Small door to EB138" },
  { id: "NORTH-104", x: 760, y: 160 },
  { id: "NORTH-102", x: 830, y: 160 },
  { id: "NORTH-106", x: 830, y: 205 },
  { id: "NORTH-155", x: 875, y: 160 },
  { id: "NORTH-161", x: 925, y: 160 },
  { id: "NE-HUB", x: 890, y: 160, label: "NE hub" },
];

const WALKABLE_EDGES = [
  ["NW-HUB", "NORTH-139"],
  ["NORTH-139", "NORTH-133"],
  ["NORTH-133", "NORTH-131"],
  ["NORTH-131", "NORTH-119"],
  ["NORTH-119", "NORTH-115"],
  ["NORTH-115", "NORTH-111"],
  ["NORTH-111", "NORTH-132"],
  ["NORTH-132", "NORTH-136"],
  ["NORTH-136", "NORTH-104"],
  ["NORTH-104", "NORTH-102"],
  ["NORTH-102", "NORTH-155"],
  ["NORTH-155", "NE-HUB"],
  ["NE-HUB", "NORTH-161"],
];

const DOORWAY_EDGES = [
  ["NORTH-136", "EB138-SMALL-DOOR"],
  ["NORTH-102", "NORTH-106"],
];

const ROOM_DATA = {
  1: [
    { code: "EB139", x: 190, y: 245, w: 90, h: 56, doorNode: "NORTH-139", zone: "north" },
    { code: "EB133", x: 255, y: 245, w: 90, h: 56, doorNode: "NORTH-133", zone: "north" },
    { code: "EB131", x: 320, y: 245, w: 96, h: 64, doorNode: "NORTH-131", zone: "north" },
    { code: "EB119", x: 390, y: 245, w: 88, h: 56, doorNode: "NORTH-119", zone: "north" },
    { code: "EB115", x: 455, y: 245, w: 88, h: 56, doorNode: "NORTH-115", zone: "north" },
    { code: "EB111", x: 520, y: 245, w: 88, h: 56, doorNode: "NORTH-111", zone: "north" },
    { code: "EB132", x: 585, y: 245, w: 92, h: 56, doorNode: "NORTH-132", zone: "north" },
    { code: "EB136", x: 690, y: 315, w: 115, h: 92, doorNode: "NORTH-136", zone: "north" },
    { code: "EB138", x: 535, y: 315, w: 145, h: 108, doorNode: "EB138-SMALL-DOOR", zone: "north", note: "Tiered classroom / 2F link" },
    { code: "EB102", x: 830, y: 82, w: 92, h: 56, doorNode: "NORTH-102", zone: "east" },
    { code: "EB104", x: 760, y: 285, w: 150, h: 82, doorNode: "NORTH-104", zone: "east" },
    { code: "EB106", x: 870, y: 245, w: 92, h: 56, doorNode: "NORTH-106", zone: "east" },
    { code: "EB155", x: 900, y: 85, w: 88, h: 52, doorNode: "NORTH-155", zone: "east" },
    { code: "EB161", x: 940, y: 225, w: 82, h: 54, doorNode: "NORTH-161", zone: "east" },
  ],
};

const INACCESSIBLE_AREAS = [
  { x: 95, y: 330, w: 815, h: 235, label: "Inaccessible area" },
  { x: 95, y: 265, w: 360, h: 55, label: "No corridor" },
  { x: 810, y: 330, w: 120, h: 150, label: "No corridor" },
];

const RECOMMENDED_SW_TO_NW = ["SW-ENTRY", "NW-ENTRY"];

function buildGraph() {
  const nodes = {};
  const edges = {};

  function addNode(n) {
    nodes[n.id] = n;
    edges[n.id] = edges[n.id] || [];
  }

  function link(a, b, w) {
    const A = nodes[a];
    const B = nodes[b];
    const weight = w == null ? Math.hypot(A.x - B.x, A.y - B.y) : w;
    edges[a].push({ to: b, w: weight });
    edges[b].push({ to: a, w: weight });
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
    addNode({
      id: `ROOM-${room.code}`,
      x: room.x,
      y: room.y,
      floor: 1,
      kind: "room",
      room: room.code,
      label: room.code,
      doorNode: room.doorNode,
    });
  }

  for (const [a, b] of WALKABLE_EDGES) link(a, b);
  for (const [a, b] of DOORWAY_EDGES) link(a, b);

  link("NW-ENTRY", "NW-HUB", 48);
  link("NW-SERVICE", "NW-HUB", 22);
  link("NE-ENTRY", "NE-HUB", 48);
  link("NE-SERVICE", "NE-HUB", 22);

  for (const room of ROOM_DATA[1]) {
    link(room.doorNode, `ROOM-${room.code}`, 24);
  }

  return { nodes, edges };
}

function allRoomCodes() {
  return ROOM_DATA[1].map(r => r.code).sort();
}

function getRoom(code) {
  return ROOM_DATA[1].find(r => r.code === code);
}
