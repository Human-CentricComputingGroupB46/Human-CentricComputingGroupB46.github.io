/* CampusCompass - EB first-floor graph based on EB1(1).docx.
 *
 * Coordinate convention:
 *   top = North, bottom = South, left = West, right = East.
 *
 * This file contains only editable data fields.
 * All conversion, lookup, and graph-building logic lives in data-processing.js.
 */

/*
//MARK:  MAP fields:
 * width: Indoor overlay width in local editing units.
 * height: Indoor overlay height in local editing units.
 */
const MAP = {
  width: 1000,
  height: 640,
};

/*
// MARK:  GEO_REFERENCE fields:
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
//MARK: MAP_PROVIDER fields:
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
 * FLOOR_METADATA fields:
 * label: Short label shown in the floor picker.
 * title: Main title shown above the map when this floor is selected.
 * note: Short explanatory note for status messaging.
 */
const FLOOR_METADATA = {
  1: {
    label: "Floor 1",
    title: "First-floor route map",
    note: "Calibrated first-floor overlay",
  },
  2: {
    label: "Floor 2",
    title: "Second-floor route map",
    note: "Approximate second-floor overlay based on the floor-plan photo",
  },
};

/*
//MARK: BUILDING_SHELL fields:
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
  SW: { id: "SW-ENTRY", label: "South-West Entrance", x: 110, y: 570, hint: "西南入口", links: [{ to: "SW-SERVICE", kind: "connector" }, { to: "SW-WEST", kind: "connector" }] },
};

/*
 * Service point fields:
 * id: Stable graph node id used by routing and editor tools.
 * label: English label shown on the overlay.
 * x: Local x coordinate inside the indoor overlay.
 * y: Local y coordinate inside the indoor overlay.
 * floor: Optional floor number. If omitted, the node belongs to floor 1.
 * entrance: Entrance key that this service point belongs to visually.
 * links: Reachable neighboring node ids from this service point.
 */
const SERVICE_POINTS = [
  { id: "NW-SERVICE", label: "Lift / Stair", x: 135, y: 170, entrance: "NW", links: [{ to: "NW-HUB", kind: "connector" }, { to: "F2-NW-STAIR", kind: "stairs" }] },
  { id: "NE-SERVICE", label: "Lift / Stair", x: 875, y: 170, entrance: "NE", links: [{ to: "NE-HUB", kind: "connector" }, { to: "F2-NE-STAIR", kind: "stairs" }] },
  { id: "SW-SERVICE", label: "Lift / Stair", x: 150, y: 540, entrance: "SW", links: [{ to: "SW-ENTRY", kind: "connector" }, { to: "SW-WEST", kind: "connector" }, { to: "F2-SW-STAIR", kind: "stairs" }] },
];

/*
 * Walkable node fields:
 * id: Stable graph node id used by routing and editor tools.
 * x: Local x coordinate inside the indoor overlay.
 * y: Local y coordinate inside the indoor overlay.
 * w: Optional editable corridor width in local overlay units.
 * h: Optional editable corridor height in local overlay units.
 * floor: Optional floor number. If omitted, the node belongs to floor 1.
 * kind: Optional node type used for step text and editor badges.
 * label: Optional label used for route instructions and editor badges.
 * links: Reachable neighboring node ids from this walkable point.
 */
const WALKABLE_NODES = [
  { id: "SW-WEST", x: 70, y: 540, label: "SW west path", links: [{ to: "SW-ENTRY", kind: "connector" }, { to: "SW-SERVICE", kind: "connector" }, { to: "WEST-UPPER", kind: "corridor" }] },
  { id: "WEST-UPPER", x: 70, y: 160, label: "West path", links: [{ to: "SW-WEST", kind: "corridor" }, { to: "NW-HUB", kind: "corridor" }] },
  { id: "NW-HUB", x: 145, y: 160, label: "NW hub", links: [{ to: "NW-ENTRY", kind: "connector" }, { to: "NW-SERVICE", kind: "connector" }, { to: "WEST-UPPER", kind: "corridor" }, { to: "NORTH-139", kind: "corridor" }, { to: "LEFT-MID", kind: "connector" }] },
  { id: "NORTH-139", x: 196, y: 160, links: [{ to: "NW-HUB", kind: "corridor" }, { to: "NORTH-133", kind: "corridor" }, { to: "ROOM-EB139", kind: "room" }] },
  { id: "NORTH-133", x: 286, y: 160, links: [{ to: "NORTH-139", kind: "corridor" }, { to: "NORTH-131", kind: "corridor" }, { to: "ROOM-EB133", kind: "room" }] },
  { id: "NORTH-131", x: 384, y: 160, links: [{ to: "NORTH-133", kind: "corridor" }, { to: "NORTH-119", kind: "corridor" }, { to: "MID-132", kind: "connector" }, { to: "ROOM-EB131", kind: "room" }] },
  { id: "NORTH-119", x: 482, y: 160, links: [{ to: "NORTH-131", kind: "corridor" }, { to: "NORTH-115", kind: "corridor" }, { to: "ROOM-EB119", kind: "room" }] },
  { id: "NORTH-115", x: 579, y: 160, links: [{ to: "NORTH-119", kind: "corridor" }, { to: "NORTH-111", kind: "corridor" }, { to: "ROOM-EB115", kind: "room" }] },
  { id: "NORTH-111", x: 676, y: 160, links: [{ to: "NORTH-115", kind: "corridor" }, { to: "NORTH-104", kind: "corridor" }, { to: "ROOM-EB111", kind: "room" }] },
  { id: "LEFT-MID", x: 145, y: 214, label: "Left mid corridor", links: [{ to: "NW-HUB", kind: "connector" }, { to: "MID-136", kind: "corridor" }, { to: "EB138-HALL", kind: "corridor" }] },
  { id: "MID-136", x: 208, y: 214, links: [{ to: "LEFT-MID", kind: "corridor" }, { to: "MID-132", kind: "corridor" }, { to: "ROOM-EB136", kind: "room" }] },
  { id: "MID-132", x: 314, y: 214, links: [{ to: "MID-136", kind: "corridor" }, { to: "NORTH-131", kind: "connector" }, { to: "ROOM-EB132", kind: "room" }] },
  { id: "EB138-HALL", x: 145, y: 330, label: "EB138 hall", links: [{ to: "LEFT-MID", kind: "corridor" }, { to: "EB138-SMALL-DOOR", kind: "connector" }] },
  { id: "EB138-SMALL-DOOR", x: 152, y: 330, label: "EB138 entrance", links: [{ to: "EB138-HALL", kind: "connector" }, { to: "ROOM-EB138", kind: "room" }] },
  { id: "NORTH-104", x: 790, y: 160, links: [{ to: "NORTH-111", kind: "corridor" }, { to: "NORTH-102", kind: "corridor" }, { to: "EAST-104", kind: "connector" }] },
  { id: "NORTH-102", x: 885, y: 160, links: [{ to: "NORTH-104", kind: "corridor" }, { to: "NE-HUB", kind: "corridor" }, { to: "ROOM-EB102", kind: "room" }, { to: "EAST-106", kind: "connector" }] },
  { id: "EAST-106", x: 790, y: 214, links: [{ to: "NORTH-102", kind: "connector" }, { to: "EAST-104", kind: "corridor" }, { to: "ROOM-EB106", kind: "room" }] },
  { id: "EAST-104", x: 836, y: 250, label: "East corridor", links: [{ to: "NORTH-104", kind: "connector" }, { to: "EAST-106", kind: "corridor" }, { to: "EAST-155", kind: "corridor" }, { to: "ROOM-EB104", kind: "room" }] },
  { id: "EAST-155", x: 876, y: 392, links: [{ to: "EAST-104", kind: "corridor" }, { to: "EAST-161", kind: "corridor" }, { to: "ROOM-EB155", kind: "room" }] },
  { id: "EAST-161", x: 878, y: 526, links: [{ to: "EAST-155", kind: "corridor" }, { to: "ROOM-EB161", kind: "room" }] },
  { id: "NE-HUB", x: 890, y: 160, label: "NE hub", links: [{ to: "NE-ENTRY", kind: "connector" }, { to: "NE-SERVICE", kind: "connector" }, { to: "NORTH-102", kind: "corridor" }] },
  { id: "F2-NW-STAIR", floor: 2, kind: "stair", x: 120, y: 188, label: "North-west stair", links: [{ to: "NW-SERVICE", kind: "stairs" }, { to: "F2-NW-CORRIDOR", kind: "corridor" }, { to: "F2-WEST-UPPER", kind: "corridor" }] },
  { id: "F2-NW-CORRIDOR", floor: 2, x: 210, y: 205, label: "Floor 2 north-west corridor", links: [{ to: "F2-NW-STAIR", kind: "corridor" }, { to: "F2-NORTH-CORRIDOR", kind: "corridor" }, { to: "ROOM-EB237", kind: "room" }, { to: "ROOM-EB239", kind: "room" }] },
  { id: "F2-NORTH-CORRIDOR", floor: 2, x: 360, y: 205, label: "Floor 2 north corridor", links: [{ to: "F2-NW-CORRIDOR", kind: "corridor" }, { to: "F2-INNER-NORTH", kind: "corridor" }, { to: "ROOM-EB233", kind: "room" }, { to: "ROOM-EB231", kind: "room" }, { to: "ROOM-EB235", kind: "room" }] },
  { id: "F2-INNER-NORTH", floor: 2, x: 545, y: 205, label: "Floor 2 inner north corridor", links: [{ to: "F2-NORTH-CORRIDOR", kind: "corridor" }, { to: "F2-NE-CORRIDOR", kind: "corridor" }, { to: "ROOM-EB222", kind: "room" }, { to: "ROOM-EB220", kind: "room" }, { to: "ROOM-EB216", kind: "room" }, { to: "ROOM-EB214", kind: "room" }] },
  { id: "F2-NE-CORRIDOR", floor: 2, x: 770, y: 205, label: "Floor 2 north-east corridor", links: [{ to: "F2-INNER-NORTH", kind: "corridor" }, { to: "F2-NE-STAIR", kind: "corridor" }, { to: "F2-EAST-UPPER", kind: "corridor" }, { to: "ROOM-EB211", kind: "room" }, { to: "ROOM-EB212", kind: "room" }, { to: "ROOM-EB210", kind: "room" }, { to: "ROOM-EB206", kind: "room" }] },
  { id: "F2-NE-STAIR", floor: 2, kind: "stair", x: 915, y: 188, label: "North-east stair", links: [{ to: "NE-SERVICE", kind: "stairs" }, { to: "F2-NE-CORRIDOR", kind: "corridor" }] },
  { id: "F2-EAST-UPPER", floor: 2, x: 915, y: 325, label: "Floor 2 east corridor", links: [{ to: "F2-NE-CORRIDOR", kind: "corridor" }, { to: "F2-EAST-LOWER", kind: "corridor" }, { to: "ROOM-EB241", kind: "room" }, { to: "ROOM-EB245", kind: "room" }] },
  { id: "F2-EAST-LOWER", floor: 2, x: 915, y: 485, label: "Floor 2 lower east corridor", links: [{ to: "F2-EAST-UPPER", kind: "corridor" }, { to: "F2-SOUTH-EAST", kind: "corridor" }, { to: "ROOM-EB247", kind: "room" }, { to: "ROOM-EB249", kind: "room" }, { to: "ROOM-EB251", kind: "room" }, { to: "ROOM-EB259", kind: "room" }] },
  { id: "F2-SOUTH-EAST", floor: 2, x: 845, y: 520, label: "Floor 2 south-east junction", links: [{ to: "F2-EAST-LOWER", kind: "corridor" }, { to: "F2-SOUTH-CORRIDOR", kind: "corridor" }, { to: "ROOM-EB257", kind: "room" }, { to: "ROOM-EB261", kind: "room" }, { to: "ROOM-EB265A", kind: "room" }, { to: "ROOM-EB265", kind: "room" }] },
  { id: "F2-SOUTH-CORRIDOR", floor: 2, x: 650, y: 520, label: "Floor 2 south corridor", links: [{ to: "F2-SOUTH-EAST", kind: "corridor" }, { to: "F2-SOUTH-WEST", kind: "corridor" }, { to: "ROOM-EB273", kind: "room" }, { to: "ROOM-EB271", kind: "room" }, { to: "ROOM-EB269", kind: "room" }] },
  { id: "F2-SOUTH-WEST", floor: 2, x: 365, y: 520, label: "Floor 2 south-west corridor", links: [{ to: "F2-SOUTH-CORRIDOR", kind: "corridor" }, { to: "F2-SW-STAIR", kind: "corridor" }, { to: "ROOM-EB277", kind: "room" }, { to: "ROOM-EB279", kind: "room" }, { to: "ROOM-EB275", kind: "room" }] },
  { id: "F2-SW-STAIR", floor: 2, kind: "stair", x: 120, y: 522, label: "South-west stair", links: [{ to: "SW-SERVICE", kind: "stairs" }, { to: "F2-SOUTH-WEST", kind: "corridor" }, { to: "F2-WEST-MID", kind: "corridor" }, { to: "ROOM-EB287", kind: "room" }, { to: "ROOM-EB283", kind: "room" }, { to: "ROOM-EB282", kind: "room" }, { to: "ROOM-EB280", kind: "room" }] },
  { id: "F2-WEST-MID", floor: 2, x: 120, y: 400, label: "Floor 2 west corridor", links: [{ to: "F2-SW-STAIR", kind: "corridor" }, { to: "F2-WEST-UPPER", kind: "corridor" }, { to: "ROOM-EB238", kind: "room" }] },
  { id: "F2-WEST-UPPER", floor: 2, x: 120, y: 285, label: "Floor 2 west upper corridor", links: [{ to: "F2-WEST-MID", kind: "corridor" }, { to: "F2-NW-STAIR", kind: "corridor" }, { to: "ROOM-EB236", kind: "room" }] },
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
    { code: "EB132", lat: 31.274479740, lng: 120.737592668, w: 92, h: 56, zone: "north", links: [{ to: "MID-132", kind: "room" }] },
    { code: "EB136", lat: 31.274484053, lng: 120.737483411, w: 115, h: 92, zone: "north", links: [{ to: "MID-136", kind: "room" }] },
    { code: "EB138", lat: 31.274388920, lng: 120.737499193, w: 145, h: 108, zone: "north", links: [{ to: "EB138-SMALL-DOOR", kind: "room" }], note: "Tiered classroom / 2F link" },
    { code: "EB102", lat: 31.274486460, lng: 120.738206644, w: 92, h: 56, zone: "east", links: [{ to: "NORTH-102", kind: "room" }] },
    { code: "EB104", lat: 31.274422003, lng: 120.738149586, w: 150, h: 82, zone: "east", links: [{ to: "EAST-104", kind: "room" }] },
    { code: "EB106", lat: 31.274486926, lng: 120.738104429, w: 92, h: 56, zone: "east", links: [{ to: "EAST-106", kind: "room" }] },
    { code: "EB155", lat: 31.274332704, lng: 120.738179733, w: 88, h: 52, zone: "east", links: [{ to: "EAST-155", kind: "room" }] },
    { code: "EB161", lat: 31.274199055, lng: 120.738171387, w: 82, h: 54, zone: "east", links: [{ to: "EAST-161", kind: "room" }] },
  ],
  2: [
    { code: "EB237", lat: 31.274550685, lng: 120.737484633, w: 100, h: 70, zone: "north", links: [{ to: "F2-NW-CORRIDOR", kind: "room" }] },
    { code: "EB233", lat: 31.274550685, lng: 120.737579227, w: 100, h: 70, zone: "north", links: [{ to: "F2-NORTH-CORRIDOR", kind: "room" }] },
    { code: "EB231", lat: 31.274550685, lng: 120.737673820, w: 110, h: 70, zone: "north", links: [{ to: "F2-NORTH-CORRIDOR", kind: "room" }] },
    { code: "EB211", lat: 31.274546193, lng: 120.737947089, w: 250, h: 75, zone: "north", links: [{ to: "F2-NE-CORRIDOR", kind: "room" }] },
    { code: "EB239", lat: 31.274474328, lng: 120.737458358, w: 70, h: 34, zone: "west", links: [{ to: "F2-NW-CORRIDOR", kind: "room" }] },
    { code: "EB235", lat: 31.274474328, lng: 120.737526675, w: 70, h: 34, zone: "west", links: [{ to: "F2-NORTH-CORRIDOR", kind: "room" }] },
    { code: "EB236", lat: 31.274406955, lng: 120.737495144, w: 92, h: 42, zone: "west", links: [{ to: "F2-WEST-UPPER", kind: "room" }] },
    { code: "EB238", lat: 31.274321616, lng: 120.737458358, w: 180, h: 150, zone: "west", links: [{ to: "F2-WEST-MID", kind: "room" }] },
    { code: "EB222", lat: 31.274471634, lng: 120.737736882, w: 48, h: 26, zone: "north", links: [{ to: "F2-INNER-NORTH", kind: "room" }] },
    { code: "EB220", lat: 31.274471634, lng: 120.737784179, w: 48, h: 26, zone: "north", links: [{ to: "F2-INNER-NORTH", kind: "room" }] },
    { code: "EB216", lat: 31.274471634, lng: 120.737857751, w: 54, h: 26, zone: "north", links: [{ to: "F2-INNER-NORTH", kind: "room" }] },
    { code: "EB214", lat: 31.274471634, lng: 120.737910303, w: 54, h: 26, zone: "north", links: [{ to: "F2-INNER-NORTH", kind: "room" }] },
    { code: "EB212", lat: 31.274471634, lng: 120.737962855, w: 54, h: 26, zone: "north", links: [{ to: "F2-NE-CORRIDOR", kind: "room" }] },
    { code: "EB210", lat: 31.274471634, lng: 120.738015407, w: 54, h: 26, zone: "north", links: [{ to: "F2-NE-CORRIDOR", kind: "room" }] },
    { code: "EB206", lat: 31.274471634, lng: 120.738073214, w: 56, h: 26, zone: "north", links: [{ to: "F2-NE-CORRIDOR", kind: "room" }] },
    { code: "EB241", lat: 31.274397972, lng: 120.738241380, w: 78, h: 44, zone: "east", links: [{ to: "F2-EAST-UPPER", kind: "room" }] },
    { code: "EB245", lat: 31.274344073, lng: 120.738241380, w: 78, h: 44, zone: "east", links: [{ to: "F2-EAST-UPPER", kind: "room" }] },
    { code: "EB247", lat: 31.274293768, lng: 120.738241380, w: 78, h: 44, zone: "east", links: [{ to: "F2-EAST-LOWER", kind: "room" }] },
    { code: "EB249", lat: 31.274243462, lng: 120.738241380, w: 78, h: 44, zone: "east", links: [{ to: "F2-EAST-LOWER", kind: "room" }] },
    { code: "EB251", lat: 31.274193157, lng: 120.738241380, w: 78, h: 44, zone: "east", links: [{ to: "F2-EAST-LOWER", kind: "room" }] },
    { code: "EB257", lat: 31.274175191, lng: 120.738209849, w: 52, h: 32, zone: "east", links: [{ to: "F2-SOUTH-EAST", kind: "room" }] },
    { code: "EB259", lat: 31.274193157, lng: 120.738267656, w: 40, h: 50, zone: "east", links: [{ to: "F2-EAST-LOWER", kind: "room" }] },
    { code: "EB261", lat: 31.274148241, lng: 120.738241380, w: 78, h: 36, zone: "east", links: [{ to: "F2-SOUTH-EAST", kind: "room" }] },
    { code: "EB287", lat: 31.274236276, lng: 120.737442592, w: 48, h: 44, zone: "south", links: [{ to: "F2-SW-STAIR", kind: "room" }] },
    { code: "EB283", lat: 31.274236276, lng: 120.737503552, w: 60, h: 44, zone: "south", links: [{ to: "F2-SW-STAIR", kind: "room" }] },
    { code: "EB282", lat: 31.274180581, lng: 120.737353254, w: 70, h: 60, zone: "south", links: [{ to: "F2-SW-STAIR", kind: "room" }] },
    { code: "EB280", lat: 31.274180581, lng: 120.737426826, w: 58, h: 60, zone: "south", links: [{ to: "F2-SW-STAIR", kind: "room" }] },
    { code: "EB277", lat: 31.274218310, lng: 120.737600247, w: 96, h: 72, zone: "south", links: [{ to: "F2-SOUTH-WEST", kind: "room" }] },
    { code: "EB279", lat: 31.274164411, lng: 120.737558206, w: 76, h: 34, zone: "south", links: [{ to: "F2-SOUTH-WEST", kind: "room" }] },
    { code: "EB275", lat: 31.274220106, lng: 120.737715861, w: 96, h: 72, zone: "south", links: [{ to: "F2-SOUTH-WEST", kind: "room" }] },
    { code: "EB273", lat: 31.274218310, lng: 120.737831475, w: 96, h: 72, zone: "south", links: [{ to: "F2-SOUTH-CORRIDOR", kind: "room" }] },
    { code: "EB271", lat: 31.274212920, lng: 120.737936579, w: 72, h: 70, zone: "south", links: [{ to: "F2-SOUTH-CORRIDOR", kind: "room" }] },
    { code: "EB269", lat: 31.274212920, lng: 120.738036428, w: 86, h: 70, zone: "south", links: [{ to: "F2-SOUTH-CORRIDOR", kind: "room" }] },
    { code: "EB265A", lat: 31.274248852, lng: 120.738115255, w: 56, h: 36, zone: "south", links: [{ to: "F2-SOUTH-EAST", kind: "room" }] },
    { code: "EB265", lat: 31.274218310, lng: 120.738146786, w: 78, h: 70, zone: "south", links: [{ to: "F2-SOUTH-EAST", kind: "room" }] },
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
const INACCESSIBLE_AREAS_BY_FLOOR = {
  1: [
    { x: 95, y: 330, w: 815, h: 235, label: "Inaccessible area" },
    { x: 95, y: 265, w: 360, h: 55, label: "No corridor" },
    { x: 810, y: 330, w: 120, h: 150, label: "No corridor" },
  ],
  2: [
    { x: 280, y: 270, w: 460, h: 250, label: "Roof Garden" },
    { x: 655, y: 340, w: 105, h: 115, label: "Inner core" },
    { x: 62, y: 438, w: 132, h: 118, label: "Closed area" },
  ],
};

/*
 * RECOMMENDED_SW_TO_NW:
 * Ordered node id path recommended for users who start at the south-west entrance.
 */
const RECOMMENDED_SW_TO_NW = ["SW-ENTRY", "SW-WEST", "WEST-UPPER", "NW-HUB", "NW-ENTRY"];
