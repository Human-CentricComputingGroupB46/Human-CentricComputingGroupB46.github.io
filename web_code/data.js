/* CampusCompass — EB building graph & geometry.
 * Mock layout: 4 floors. Each floor has three sections (North Wing, Hallway,
 * South Wing) connected at y=260. Rooms sit above/below each section's corridor.
 * Coordinates are in the single-floor SVG space (1000 x 520).
 */

const LAYOUT = {
  floors: [1, 2, 3, 4],
  wings: {
    N: { label: "North Wing",   block: { x: 40,  y: 80,  w: 260, h: 360 }, corridorY: 260, stair: { x: 70,  y: 260, label: "North Stair" } },
    H: { label: "Central Hall", block: { x: 340, y: 80,  w: 320, h: 360 }, corridorY: 260, stair: { x: 500, y: 260, label: "Central Stair" } },
    S: { label: "South Wing",   block: { x: 700, y: 80,  w: 260, h: 360 }, corridorY: 260, stair: { x: 930, y: 260, label: "South Stair" } },
  },
  entrances: {
    N: { id: "N-ENTRY", label: "North Entrance",   x: 170, y: 470 },
    H: { id: "H-ENTRY", label: "Main Entrance",    x: 500, y: 470 },
    S: { id: "S-ENTRY", label: "South Entrance",   x: 830, y: 470 },
  },
  junctions: {
    // Points where wings meet the outside corridor seam
    NH: { id: "JCT-NH", x: 320, y: 260 },
    HS: { id: "JCT-HS", x: 680, y: 260 },
  },
};

/* Room layout per wing per floor: 5 rooms, alternating above/below corridor.
 * Room numbers: EB{floor}{wingCode}{slot}
 *   North Wing slots 01..05  -> EB201..EB205
 *   Hallway  slots 11..15    -> EB211..EB215
 *   South Wing slots 21..25  -> EB221..EB225
 */
const ROOM_SLOTS = {
  N: [
    { n: "01", x: 70,  y: 130, above: true  },
    { n: "02", x: 130, y: 390, above: false },
    { n: "03", x: 190, y: 130, above: true  },
    { n: "04", x: 250, y: 390, above: false },
    { n: "05", x: 290, y: 130, above: true  },
  ],
  H: [
    { n: "11", x: 370, y: 130, above: true  },
    { n: "12", x: 430, y: 390, above: false },
    { n: "13", x: 500, y: 130, above: true  },
    { n: "14", x: 570, y: 390, above: false },
    { n: "15", x: 630, y: 130, above: true  },
  ],
  S: [
    { n: "21", x: 730, y: 130, above: true  },
    { n: "22", x: 790, y: 390, above: false },
    { n: "23", x: 850, y: 130, above: true  },
    { n: "24", x: 910, y: 390, above: false },
    { n: "25", x: 930, y: 130, above: true  },
  ],
};

/* Build the full multi-floor graph. Node IDs are globally unique across floors. */
function buildGraph() {
  const nodes = {};   // id -> { id, x, y, floor, kind, wing, label, room? }
  const edges = {};   // id -> [{ to, w }]

  function addNode(n) { nodes[n.id] = n; edges[n.id] = edges[n.id] || []; }
  function addEdge(a, b, weight) {
    const w = weight != null ? weight : dist(nodes[a], nodes[b]);
    edges[a].push({ to: b, w });
    edges[b].push({ to: a, w });
  }
  function dist(a, b) {
    // For cross-floor edges we set weight manually; same-floor uses Euclidean.
    if (a.floor !== b.floor) return 40;
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  // Entrances (floor 1 only) — each sits just outside its wing corridor.
  for (const k of ["N", "H", "S"]) {
    const e = LAYOUT.entrances[k];
    addNode({ id: e.id, x: e.x, y: e.y, floor: 1, kind: "entrance", wing: k, label: e.label });
  }

  for (const floor of LAYOUT.floors) {
    // Per-wing corridor anchor nodes: left, stair, right
    for (const wingKey of ["N", "H", "S"]) {
      const wing = LAYOUT.wings[wingKey];
      const bx = wing.block.x, bw = wing.block.w, cy = wing.corridorY;

      const leftId  = `F${floor}-${wingKey}-CL`;
      const stairId = `F${floor}-${wingKey}-ST`;
      const rightId = `F${floor}-${wingKey}-CR`;

      addNode({ id: leftId,  x: bx + 10,       y: cy, floor, kind: "corridor", wing: wingKey });
      addNode({ id: stairId, x: wing.stair.x,  y: cy, floor, kind: "stair",    wing: wingKey, label: wing.stair.label });
      addNode({ id: rightId, x: bx + bw - 10,  y: cy, floor, kind: "corridor", wing: wingKey });

      addEdge(leftId, stairId);
      addEdge(stairId, rightId);

      // Rooms on this wing/floor
      for (const slot of ROOM_SLOTS[wingKey]) {
        const code = `EB${floor}${slot.n}`;
        const rid = `ROOM-${code}`;
        addNode({ id: rid, x: slot.x, y: slot.y, floor, kind: "room", wing: wingKey, label: code, room: code, slot });
        // Door onto corridor at the room's x
        const doorId = `F${floor}-${wingKey}-D${slot.n}`;
        addNode({ id: doorId, x: slot.x, y: cy, floor, kind: "corridor", wing: wingKey });
        addEdge(doorId, rid);

        // Stitch door into the corridor chain (connect to nearest existing corridor anchor on either side)
        // Simple approach: connect to left, stair, right — shortest path algo will pick best.
        addEdge(doorId, leftId);
        addEdge(doorId, stairId);
        addEdge(doorId, rightId);
      }

      // Vertical stairs: connect stair on this floor to stair on next floor
      if (floor > 1) {
        const prev = `F${floor - 1}-${wingKey}-ST`;
        edges[stairId].push({ to: prev, w: 45 });
        edges[prev].push({ to: stairId, w: 45 });
      }
    }

    // Inter-wing junctions on this floor: connect N-right ↔ H-left, H-right ↔ S-left
    const jctNH = `F${floor}-JCT-NH`;
    const jctHS = `F${floor}-JCT-HS`;
    addNode({ id: jctNH, x: LAYOUT.junctions.NH.x, y: LAYOUT.junctions.NH.y, floor, kind: "junction" });
    addNode({ id: jctHS, x: LAYOUT.junctions.HS.x, y: LAYOUT.junctions.HS.y, floor, kind: "junction" });
    addEdge(`F${floor}-N-CR`, jctNH);
    addEdge(jctNH, `F${floor}-H-CL`);
    addEdge(`F${floor}-H-CR`, jctHS);
    addEdge(jctHS, `F${floor}-S-CL`);
  }

  // Hook entrances (floor 1) into their wing corridors via a short approach edge.
  // N entrance -> north wing left-corridor; H -> hallway stair; S -> south wing right-corridor.
  edges["N-ENTRY"].push({ to: "F1-N-CL", w: 60 });
  edges["F1-N-CL"].push({ to: "N-ENTRY", w: 60 });
  edges["H-ENTRY"].push({ to: "F1-H-ST", w: 55 });
  edges["F1-H-ST"].push({ to: "H-ENTRY", w: 55 });
  edges["S-ENTRY"].push({ to: "F1-S-CR", w: 60 });
  edges["F1-S-CR"].push({ to: "S-ENTRY", w: 60 });

  return { nodes, edges };
}

/* All valid room codes, for suggestions. */
function allRoomCodes() {
  const codes = [];
  for (const f of LAYOUT.floors) {
    for (const w of ["N", "H", "S"]) {
      for (const s of ROOM_SLOTS[w]) codes.push(`EB${f}${s.n}`);
    }
  }
  return codes;
}
