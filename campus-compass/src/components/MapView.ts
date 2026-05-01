// ============================================================
// MapView Component — Google Maps + Canvas Overlay
// ============================================================

import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { EB_CENTER, EB_BOUNDS, DEFAULT_ZOOM, CANVAS_WIDTH, CANVAS_HEIGHT } from '../core/constants';
import { FloorId, FloorData } from '../core/types';
import { getState, subscribe } from '../core/state';
import { renderFloor, hitTestRoom } from '../core/renderer';
import { pixelToRel } from '../core/coordinate';
import { floor1Data } from '../data/floor1';
import { floor2Data } from '../data/floor2';
import { createFloorTabs } from './FloorTabs';
import { createLegend } from './Legend';

const MAPS_API_KEY = ''; // Add your Google Maps API key here

function getFloorData(floor: FloorId): FloorData {
  return floor === 'floor1' ? floor1Data : floor2Data;
}

export function createMapView(): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'map-wrapper';

  // Floor info header
  const floorInfo = document.createElement('div');
  floorInfo.className = 'floor-info';

  const floorLabel = document.createElement('div');
  floorLabel.className = 'floor-label';
  floorLabel.innerHTML = '<span class="floor-prefix">EB FLOOR 1</span><h2>First-floor route map</h2>';
  floorInfo.appendChild(floorLabel);

  floorInfo.appendChild(createFloorTabs());
  wrapper.appendChild(floorInfo);

  // Map container
  const mapContainer = document.createElement('div');
  mapContainer.className = 'map-container';
  mapContainer.id = 'map-container';
  wrapper.appendChild(mapContainer);

  // Legend
  const legendContainer = document.createElement('div');
  legendContainer.className = 'legend-container';
  legendContainer.appendChild(createLegend());
  legendContainer.innerHTML += `
    <div class="map-note">
      Base layer: Google Maps satellite imagery. Indoor rooms, nodes, and routes are canvas overlays anchored near the EB building coordinate.
    </div>
  `;
  wrapper.appendChild(legendContainer);

  // Initialize map after DOM insertion
  requestAnimationFrame(() => initMap(mapContainer, floorLabel));

  return wrapper;
}

async function initMap(container: HTMLElement, floorLabel: HTMLElement): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.id = 'floor-canvas';
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.style.width = '100%';
  canvas.style.height = '100%';

  if (MAPS_API_KEY) {
    try {
      await initWithGoogleMaps(container, canvas);
    } catch {
      setupCanvasOnly(container, canvas);
    }
  } else {
    setupCanvasOnly(container, canvas);
  }

  // Redraw function
  function redraw() {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = getState();
    const floorData = getFloorData(state.currentFloor);

    const floorRoute = state.route
      ? state.route.filter(n => n.floor === state.currentFloor)
      : null;

    renderFloor(ctx, floorData, {
      width: canvas.width,
      height: canvas.height,
      currentEntrance: state.currentEntrance,
      route: floorRoute,
      targetRoom: state.targetRoom,
      designMode: state.designMode,
    });
  }

  // Subscribe to state changes
  subscribe((_state, changed) => {
    redraw();
    if (changed.includes('currentFloor')) {
      const floor = getState().currentFloor;
      const label = floor === 'floor1' ? 'First' : 'Second';
      const num = floor === 'floor1' ? '1' : '2';
      floorLabel.innerHTML = `<span class="floor-prefix">EB FLOOR ${num}</span><h2>${label}-floor route map</h2>`;
    }
  });

  setupDesignModeDrag(canvas, redraw);
  redraw();
}

async function initWithGoogleMaps(container: HTMLElement, canvas: HTMLCanvasElement): Promise<void> {
  setOptions({ key: MAPS_API_KEY, v: 'weekly' });
  await importLibrary('maps');

  // Access google maps via the global after load()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gMaps = (window as unknown as Record<string, any>)['google'] as {
    maps: {
      Map: new (el: HTMLElement, opts: Record<string, unknown>) => unknown;
      OverlayView: new () => {
        onAdd: () => void;
        draw: () => void;
        onRemove: () => void;
        setMap: (m: unknown) => void;
        getPanes: () => { overlayLayer: HTMLElement };
        getProjection: () => {
          fromLatLngToDivPixel: (ll: unknown) => { x: number; y: number };
        };
      };
      LatLng: new (lat: number, lng: number) => unknown;
    };
  };

  const map = new gMaps.maps.Map(container, {
    center: { lat: EB_CENTER.lat, lng: EB_CENTER.lng },
    zoom: DEFAULT_ZOOM,
    mapTypeId: 'satellite',
    disableDefaultUI: true,
    zoomControl: true,
    tilt: 0,
  });

  const OverlayViewClass = gMaps.maps.OverlayView;
  const overlay = new OverlayViewClass();

  overlay.onAdd = function (this: typeof overlay) {
    const panes = this.getPanes();
    panes.overlayLayer.appendChild(canvas);
    canvas.style.position = 'absolute';
  };

  overlay.draw = function (this: typeof overlay) {
    const proj = this.getProjection();
    const sw = proj.fromLatLngToDivPixel(
      new gMaps.maps.LatLng(EB_BOUNDS.south, EB_BOUNDS.west)
    );
    const ne = proj.fromLatLngToDivPixel(
      new gMaps.maps.LatLng(EB_BOUNDS.north, EB_BOUNDS.east)
    );
    canvas.style.left = sw.x + 'px';
    canvas.style.top = ne.y + 'px';
    canvas.style.width = (ne.x - sw.x) + 'px';
    canvas.style.height = (sw.y - ne.y) + 'px';
  };

  overlay.onRemove = function () {
    canvas.parentNode?.removeChild(canvas);
  };

  overlay.setMap(map);
}

function setupCanvasOnly(container: HTMLElement, canvas: HTMLCanvasElement): void {
  container.style.background = '#2c3e50';
  container.style.position = 'relative';
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);

  const compass = document.createElement('div');
  compass.className = 'compass-indicator';
  compass.innerHTML = '<strong>N</strong><div class="compass-arrow">&#9650;</div>';
  container.appendChild(compass);

  const floorOverlay = document.createElement('div');
  floorOverlay.className = 'floor-overlay-label';
  floorOverlay.id = 'floor-overlay-label';
  floorOverlay.textContent = 'Floor 1';
  container.appendChild(floorOverlay);

  subscribe((_state, changed) => {
    if (changed.includes('currentFloor')) {
      const num = getState().currentFloor === 'floor1' ? '1' : '2';
      floorOverlay.textContent = `Floor ${num}`;
    }
  });
}

function setupDesignModeDrag(canvas: HTMLCanvasElement, redraw: () => void): void {
  let dragging: string | null = null;

  canvas.addEventListener('mousedown', (e) => {
    if (!getState().designMode) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    const floorData = getFloorData(getState().currentFloor);
    dragging = hitTestRoom(floorData, cx, cy, canvas.width, canvas.height);
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!dragging || !getState().designMode) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    const floorData = getFloorData(getState().currentFloor);
    const room = floorData.rooms.find((r: FloorData['rooms'][0]) => r.id === dragging);
    if (room) {
      room.position = pixelToRel(cx, cy, canvas.width, canvas.height);
      redraw();
    }
  });

  canvas.addEventListener('mouseup', () => { dragging = null; });
  canvas.addEventListener('mouseleave', () => { dragging = null; });
}
