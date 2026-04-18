/* CampusCompass - EB first-floor graph based on EB1(1).docx.
 *
 * Coordinate convention:
 *   top = North, bottom = South, left = West, right = East.
 *
 * This file contains only editable data fields.
 * All conversion, lookup, and graph-building logic lives in data-processing.js.
 */

/*
 * MAP fields:
 * width: Indoor overlay width in local editing units.
 * height: Indoor overlay height in local editing units.
 */
const MAP = {
  width: 1000,
  height: 640,
};

/*
 * GEO_REFERENCE fields:
 * centerLat: Latitude at the overlay center point.
 * centerLng: Longitude at the overlay center point.
 * unitsPerMeter: Indoor local units represented by one real-world meter.
 * minZoom: Minimum fallback map zoom allowed.
 * initialZoom: Default fallback map zoom used on load.
 * maxZoom: Maximum fallback map zoom allowed.
 * tileUrl: Fallback tile template used by Leaflet when Google is unavailable.
 * tileAttribution: Attribution text required by the fallback tile provider.
 */
const GEO_REFERENCE = {
  centerLat: 31.274397972,
  centerLng: 120.737789434,
  unitsPerMeter: 10,
  minZoom: 18,
  initialZoom: 20,
  maxZoom: 22,
  tileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
  tileAttribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community",
};

/*
 * MAP_PROVIDER fields:
 * preferred: Preferred online map provider for the kiosk.
 * fallbackProvider: Provider used when the preferred provider is unavailable.
 * googleMapTypeId: Google basemap style.
 * googleMinZoom: Minimum Google map zoom allowed.
 * googleInitialZoom: Default Google map zoom used on load.
 * googleMaxZoom: Maximum Google map zoom allowed.
 */
const MAP_PROVIDER = {
  preferred: "google",
  fallbackProvider: "leaflet",
  googleMapTypeId: "satellite",
  googleMinZoom: 18,
  googleInitialZoom: 20,
  googleMaxZoom: 22,
};

/*
 * BUILDING_SHELL fields:
 * x: Left edge of the editable indoor footprint.
 * y: Top edge of the editable indoor footprint.
 * w: Width of the editable indoor footprint.
 * h: Height of the editable indoor footprint.
 */
const BUILDING_SHELL = {
  x: 24,
  y: 24,
  w: MAP.width - 48,
  h: MAP.height - 48,
};

/*
 * Link descriptor fields:
 * to: Target node id that can be reached from the current node.
 * kind: Semantic link type used for styling and graph meaning.
 */

/*
 * Entrance fields:
 * id: Stable graph node id used by routing and editor tools.
 * label: English label shown in the UI.
 * x: Local x coordinate inside the indoor overlay.
 * y: Local y coordinate inside the indoor overlay.
 * hint: Short Chinese hint shown near the entrance marker.
 * links: Reachable neighboring node ids from this entrance.
 */
const ENTRANCES = {
  NW: { id: "NW-ENTRY", label: "North-West Entrance", x: 110, y: 125, hint: "西北入口", links: [{ to: "NW-HUB", kind: "connector" }] },
  NE: { id: "NE-ENTRY", label: "North-East Entrance", x: 910, y: 125, hint: "东北入口", links: [{ to: "NE-HUB", kind: "connector" }] },
  SW: { id: "SW-ENTRY", label: "South-West Entrance", x: 110, y: 570, hint: "西南入口", links: [] },
};

/*
 * Service point fields:
 * id: Stable graph node id used by routing and editor tools.
 * label: English label shown on the overlay.
 * x: Local x coordinate inside the indoor overlay.
 * y: Local y coordinate inside the indoor overlay.
 * entrance: Entrance key that this service point belongs to visually.
 * links: Reachable neighboring node ids from this service point.
 */
const SERVICE_POINTS = [
  { id: "NW-SERVICE", label: "Lift / Stair", x: 135, y: 170, entrance: "NW", links: [{ to: "NW-HUB", kind: "connector" }] },
  { id: "NE-SERVICE", label: "Lift / Stair", x: 875, y: 170, entrance: "NE", links: [{ to: "NE-HUB", kind: "connector" }] },
  { id: "SW-SERVICE", label: "Lift / Stair", x: 150, y: 540, entrance: "SW", links: [] },
];

/*
 * Walkable node fields:
 * id: Stable graph node id used by routing and editor tools.
 * x: Local x coordinate inside the indoor overlay.
 * y: Local y coordinate inside the indoor overlay.
 * label: Optional label used for route instructions and editor badges.
 * links: Reachable neighboring node ids from this walkable point.
 */
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

/*
 * Room fields:
 * code: Human-readable room code used by search and editor UI.
 * lat: Persisted room center latitude.
 * lng: Persisted room center longitude.
 * w: Room width in local overlay units.
 * h: Room height in local overlay units.
 * zone: Informational zone tag used for grouping and quick scanning.
 * links: Reachable neighboring room or node ids from this room.
 * note: Optional secondary description shown below the room label.
 */
const ROOM_DATA = {
  1: [
    { code: "EB139", lat: 31.274629984, lng: 120.737465674, w: 90, h: 56, zone: "north", links: [{ to: "NORTH-139", kind: "room" }] },
    { code: "EB133", lat: 31.274629094, lng: 120.737566070, w: 90, h: 56, zone: "north", links: [{ to: "NORTH-133", kind: "room" }] },
    { code: "EB131", lat: 31.274621993, lng: 120.737677663, w: 96, h: 64, zone: "north", links: [{ to: "NORTH-131", kind: "room" }] },
    { code: "EB119", lat: 31.274618878, lng: 120.737783023, w: 88, h: 56, zone: "north", links: [{ to: "NORTH-119", kind: "room" }] },
    { code: "EB115", lat: 31.274618868, lng: 120.737890016, w: 88, h: 56, zone: "north", links: [{ to: "NORTH-115", kind: "room" }] },
    { code: "EB111", lat: 31.274618563, lng: 120.738002523, w: 88, h: 56, zone: "north", links: [{ to: "NORTH-111", kind: "room" }] },
    { code: "EB132", lat: 31.274479740, lng: 120.737592668, w: 92, h: 56, zone: "north", links: [{ to: "NORTH-132", kind: "room" }] },
    { code: "EB136", lat: 31.274484053, lng: 120.737483411, w: 115, h: 92, zone: "north", links: [{ to: "NORTH-136", kind: "room" }] },
    { code: "EB138", lat: 31.274388920, lng: 120.737499193, w: 145, h: 108, zone: "north", links: [{ to: "EB138-SMALL-DOOR", kind: "room" }], note: "Tiered classroom / 2F link" },
    { code: "EB102", lat: 31.274486460, lng: 120.738206644, w: 92, h: 56, zone: "east", links: [{ to: "NORTH-102", kind: "room" }] },
    { code: "EB104", lat: 31.274422003, lng: 120.738149586, w: 150, h: 82, zone: "east", links: [{ to: "NORTH-104", kind: "room" }] },
    { code: "EB106", lat: 31.274486926, lng: 120.738104429, w: 92, h: 56, zone: "east", links: [{ to: "NORTH-106", kind: "room" }] },
    { code: "EB155", lat: 31.274332704, lng: 120.738179733, w: 88, h: 52, zone: "east", links: [{ to: "NORTH-155", kind: "room" }] },
    { code: "EB161", lat: 31.274199055, lng: 120.738171387, w: 82, h: 54, zone: "east", links: [{ to: "NORTH-161", kind: "room" }] },
  ],
};

/*
 * Inaccessible area fields:
 * x: Left edge of the blocked rectangle in local overlay units.
 * y: Top edge of the blocked rectangle in local overlay units.
 * w: Blocked rectangle width in local overlay units.
 * h: Blocked rectangle height in local overlay units.
 * label: Text label shown on the blocked rectangle.
 */
const INACCESSIBLE_AREAS = [
  { x: 95, y: 330, w: 815, h: 235, label: "Inaccessible area" },
  { x: 95, y: 265, w: 360, h: 55, label: "No corridor" },
  { x: 810, y: 330, w: 120, h: 150, label: "No corridor" },
];

/*
 * RECOMMENDED_SW_TO_NW:
 * Ordered node id path recommended for users who start at the south-west entrance.
 */
const RECOMMENDED_SW_TO_NW = ["SW-ENTRY", "NW-ENTRY"];
