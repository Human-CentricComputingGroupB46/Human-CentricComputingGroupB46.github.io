// ============================================================
// Design Mode Panel
// ============================================================

import { getState, subscribe } from '../core/state';
import { floor1Data } from '../data/floor1';
import { floor2Data } from '../data/floor2';
import { FloorData } from '../core/types';

function getFloorData(): FloorData {
  return getState().currentFloor === 'floor1' ? floor1Data : floor2Data;
}

export function createDesignPanel(): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'design-panel';
  panel.id = 'design-panel';
  panel.style.display = 'none';

  panel.innerHTML = `
    <div class="design-header">
      <h3>Design Mode</h3>
      <p>Drag rooms on the map to adjust positions. Use buttons below to export/import layout data.</p>
    </div>
    <div class="design-actions">
      <button id="btn-export-json" class="design-btn">Export JSON</button>
      <button id="btn-import-json" class="design-btn">Import JSON</button>
      <button id="btn-save-local" class="design-btn">Save to LocalStorage</button>
      <button id="btn-load-local" class="design-btn">Load from LocalStorage</button>
    </div>
    <div class="design-info" id="design-info">
      <p>Select a room on the map to see its properties.</p>
    </div>
    <input type="file" id="import-file-input" accept=".json" style="display:none" />
  `;

  // Export JSON
  panel.querySelector('#btn-export-json')!.addEventListener('click', () => {
    const data = getFloorData();
    const exportData = {
      id: data.id,
      rooms: data.rooms.map(r => ({
        id: r.id,
        label: r.label,
        type: r.type,
        position: r.position,
        width: r.width,
        height: r.height,
      })),
      entrances: data.entrances,
      corridors: data.corridors,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.id}_layout.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import JSON
  const fileInput = panel.querySelector('#import-file-input') as HTMLInputElement;
  panel.querySelector('#btn-import-json')!.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result as string);
        const target = getFloorData();
        if (imported.rooms) {
          for (const importedRoom of imported.rooms) {
            const existing = target.rooms.find(r => r.id === importedRoom.id);
            if (existing) {
              existing.position = importedRoom.position;
              existing.width = importedRoom.width ?? existing.width;
              existing.height = importedRoom.height ?? existing.height;
            }
          }
        }
        if (imported.entrances) {
          for (const importedEnt of imported.entrances) {
            const existing = target.entrances.find(e => e.id === importedEnt.id);
            if (existing) {
              existing.position = importedEnt.position;
            }
          }
        }
        showInfo('Layout imported successfully. Map will redraw.');
      } catch {
        showInfo('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  });

  // Save to LocalStorage
  panel.querySelector('#btn-save-local')!.addEventListener('click', () => {
    const data = getFloorData();
    const key = `campus_compass_${data.id}`;
    const saveData = {
      rooms: data.rooms.map(r => ({ id: r.id, position: r.position, width: r.width, height: r.height })),
      entrances: data.entrances.map(e => ({ id: e.id, position: e.position })),
    };
    localStorage.setItem(key, JSON.stringify(saveData));
    showInfo(`Saved ${data.id} layout to LocalStorage.`);
  });

  // Load from LocalStorage
  panel.querySelector('#btn-load-local')!.addEventListener('click', () => {
    const data = getFloorData();
    const key = `campus_compass_${data.id}`;
    const saved = localStorage.getItem(key);
    if (!saved) {
      showInfo('No saved layout found in LocalStorage.');
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      for (const r of parsed.rooms) {
        const room = data.rooms.find(rm => rm.id === r.id);
        if (room) {
          room.position = r.position;
          room.width = r.width;
          room.height = r.height;
        }
      }
      for (const e of parsed.entrances) {
        const ent = data.entrances.find(en => en.id === e.id);
        if (ent) {
          ent.position = e.position;
        }
      }
      showInfo(`Loaded ${data.id} layout from LocalStorage.`);
    } catch {
      showInfo('Failed to parse saved layout.');
    }
  });

  function showInfo(msg: string) {
    const info = panel.querySelector('#design-info') as HTMLDivElement;
    info.innerHTML = `<p>${msg}</p>`;
  }

  // Show/hide based on design mode
  subscribe((_state, changed) => {
    if (changed.includes('designMode')) {
      panel.style.display = getState().designMode ? 'block' : 'none';
    }
  });

  return panel;
}

/** Load saved layout from LocalStorage on startup */
export function loadSavedLayouts(): void {
  for (const data of [floor1Data, floor2Data]) {
    const key = `campus_compass_${data.id}`;
    const saved = localStorage.getItem(key);
    if (!saved) continue;
    try {
      const parsed = JSON.parse(saved);
      for (const r of parsed.rooms) {
        const room = data.rooms.find(rm => rm.id === r.id);
        if (room) {
          room.position = r.position;
          room.width = r.width;
          room.height = r.height;
        }
      }
    } catch { /* ignore corrupted data */ }
  }
}
