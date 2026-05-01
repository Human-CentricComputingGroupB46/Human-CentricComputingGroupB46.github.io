// ============================================================
// Entrance Selector Component
// ============================================================

import { EntranceId } from '../core/types';
import { getState, selectEntrance, subscribe } from '../core/state';

const ENTRANCES: EntranceId[] = ['NW', 'NE', 'SW'];

export function createEntranceSelector(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'entrance-selector';

  // "You are here" label
  const label = document.createElement('div');
  label.className = 'entrance-label';
  container.appendChild(label);

  // Buttons
  const btnGroup = document.createElement('div');
  btnGroup.className = 'entrance-buttons';

  for (const id of ENTRANCES) {
    const btn = document.createElement('button');
    btn.className = 'entrance-btn';
    btn.textContent = id;
    btn.dataset.entrance = id;
    btn.addEventListener('click', () => selectEntrance(id));
    btnGroup.appendChild(btn);
  }
  container.appendChild(btnGroup);

  function update() {
    const current = getState().currentEntrance;
    const names: Record<EntranceId, string> = {
      NW: 'North-West Entrance',
      NE: 'North-East Entrance',
      SW: 'South-West Entrance',
    };
    label.innerHTML = `You are here: <strong>${names[current]}</strong>`;
    btnGroup.querySelectorAll('.entrance-btn').forEach(btn => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.entrance === current);
    });
  }

  subscribe((_state, changed) => {
    if (changed.includes('currentEntrance')) update();
  });

  update();
  return container;
}
