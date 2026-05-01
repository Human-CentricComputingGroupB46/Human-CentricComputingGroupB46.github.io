// ============================================================
// Floor Tabs Component
// ============================================================

import { FloorId } from '../core/types';
import { getState, switchFloor, subscribe } from '../core/state';

export function createFloorTabs(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'floor-tabs';

  const floors: { id: FloorId; label: string }[] = [
    { id: 'floor1', label: 'Floor 1' },
    { id: 'floor2', label: 'Floor 2' },
  ];

  for (const floor of floors) {
    const btn = document.createElement('button');
    btn.className = 'floor-tab';
    btn.textContent = floor.label;
    btn.dataset.floor = floor.id;
    btn.addEventListener('click', () => switchFloor(floor.id));
    container.appendChild(btn);
  }

  function updateActive() {
    const current = getState().currentFloor;
    container.querySelectorAll('.floor-tab').forEach(btn => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.floor === current);
    });
  }

  subscribe((_state, changed) => {
    if (changed.includes('currentFloor')) updateActive();
  });

  updateActive();
  return container;
}
