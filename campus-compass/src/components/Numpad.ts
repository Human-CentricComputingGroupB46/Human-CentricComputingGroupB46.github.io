// ============================================================
// Numpad Component
// ============================================================

import { getState, inputDigit, clearInput, backspace, subscribe } from '../core/state';
import { ROOM_PREFIX } from '../core/constants';

export function createNumpad(onRoute: () => void): HTMLElement {
  const container = document.createElement('div');
  container.className = 'numpad-section';

  // Room number display
  const display = document.createElement('div');
  display.className = 'room-display';
  display.innerHTML = `
    <span class="room-display-label">Room number</span>
    <div class="room-display-row">
      <div class="room-input-box">
        <span class="room-prefix">${ROOM_PREFIX}</span>
        <span id="room-digits" class="room-digits"></span>
        <span class="room-cursor">|</span>
      </div>
      <button id="btn-go" class="btn-go">Go</button>
    </div>
  `;
  container.appendChild(display);

  // Message area
  const msgArea = document.createElement('div');
  msgArea.className = 'message-area';
  msgArea.id = 'message-area';
  container.appendChild(msgArea);

  // Recent rooms
  const recentRow = document.createElement('div');
  recentRow.className = 'recent-rooms';
  recentRow.id = 'recent-rooms';
  container.appendChild(recentRow);

  // Numpad grid
  const grid = document.createElement('div');
  grid.className = 'numpad-grid';

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', '⌫'];
  for (const key of keys) {
    const btn = document.createElement('button');
    btn.className = 'numpad-key';
    btn.textContent = key;

    if (key === 'Clear') {
      btn.classList.add('key-clear');
      btn.addEventListener('click', () => clearInput());
    } else if (key === '⌫') {
      btn.classList.add('key-backspace');
      btn.addEventListener('click', () => backspace());
    } else {
      btn.classList.add('key-digit');
      btn.addEventListener('click', () => inputDigit(key));
    }
    grid.appendChild(btn);
  }
  container.appendChild(grid);

  // Route button
  const routeBtn = document.createElement('button');
  routeBtn.className = 'btn-route';
  routeBtn.textContent = 'Route';
  routeBtn.addEventListener('click', onRoute);
  container.appendChild(routeBtn);

  // Go button also triggers route
  display.querySelector('#btn-go')!.addEventListener('click', onRoute);

  // Update display on state change
  function update() {
    const state = getState();
    const digitsEl = container.querySelector('#room-digits') as HTMLSpanElement;
    digitsEl.textContent = state.inputRoomNumber;

    const msgEl = container.querySelector('#message-area') as HTMLDivElement;
    msgEl.textContent = state.message || '';
    msgEl.className = 'message-area' + (state.message && state.message.includes('not') ? ' error' : '');

    // Show target room as recent
    if (state.targetRoom) {
      const recent = container.querySelector('#recent-rooms') as HTMLDivElement;
      if (!recent.querySelector(`[data-room="${state.targetRoom}"]`)) {
        const chip = document.createElement('button');
        chip.className = 'recent-chip';
        chip.textContent = state.targetRoom;
        chip.dataset.room = state.targetRoom;
        chip.addEventListener('click', () => {
          clearInput();
          const num = state.targetRoom!.replace(ROOM_PREFIX, '');
          for (const c of num) inputDigit(c);
          onRoute();
        });
        recent.appendChild(chip);
        // Keep max 6 recent
        while (recent.children.length > 6) {
          recent.removeChild(recent.firstChild!);
        }
      }
    }
  }

  subscribe((_state, changed) => {
    if (changed.some(k => ['inputRoomNumber', 'message', 'targetRoom'].includes(k))) {
      update();
    }
  });

  update();
  return container;
}
