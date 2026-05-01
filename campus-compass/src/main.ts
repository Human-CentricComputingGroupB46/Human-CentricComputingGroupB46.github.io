// ============================================================
// CampusCompass - Main Entry Point
// ============================================================

import './styles/global.css';
import './styles/header.css';
import './styles/sidebar.css';
import './styles/map.css';
import './styles/design-mode.css';

import { createHeader } from './components/Header';
import { createMapView } from './components/MapView';
import { createSidebar } from './components/Sidebar';
import { createDesignPanel, loadSavedLayouts } from './components/DesignPanel';
import { getState, setRoute, setError, switchFloor } from './core/state';
import { findRoute, isValidRoom, getRoomFloor } from './core/graph';
import { ROOM_PREFIX } from './core/constants';

// Load any saved design mode layouts
loadSavedLayouts();

// ---- Route action ----

function handleRoute(): void {
  const state = getState();
  const digits = state.inputRoomNumber.trim();

  if (!digits) {
    setError('Please enter a room number.');
    return;
  }

  const roomId = `${ROOM_PREFIX}${digits}`;

  if (!isValidRoom(digits)) {
    setError(`Room ${roomId} not found.`);
    return;
  }

  const result = findRoute(state.currentEntrance, roomId);

  if (!result) {
    setError(`No route available to ${roomId}.`);
    return;
  }

  // If route crosses floors, switch to the target room's floor
  const targetFloor = getRoomFloor(roomId);
  if (targetFloor && targetFloor !== state.currentFloor) {
    switchFloor(targetFloor);
  }

  setRoute(roomId, result.path, result.floors);
}

// ---- Build DOM ----

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = '';

app.appendChild(createHeader());

const main = document.createElement('main');
main.className = 'app-main';
main.appendChild(createMapView());
main.appendChild(createSidebar(handleRoute));
app.appendChild(main);

app.appendChild(createDesignPanel());
