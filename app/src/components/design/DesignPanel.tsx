import { useRef, useState } from 'react';
import { useDesignStore } from '../../store/designStore';
import { useFloorData } from '../../hooks/useFloorData';
import { useNavigationStore } from '../../store/navigationStore';
import type { Room, Entrance, Corridor } from '../../core/types';
import styles from './DesignPanel.module.css';

/** Round to 4 decimal places for display */
function r4(v: number): string {
  return String(Math.round(v * 10_000) / 10_000);
}

export function DesignPanel() {
  const designMode = useDesignStore((s) => s.designMode);
  const selectedNodeId = useDesignStore((s) => s.selectedNodeId);
  const overrides = useDesignStore((s) => s.overrides);
  const history = useDesignStore((s) => s.history);
  const historyIndex = useDesignStore((s) => s.historyIndex);
  const patchRoom = useDesignStore((s) => s.patchRoom);
  const patchCorridor = useDesignStore((s) => s.patchCorridor);
  const patchEntrance = useDesignStore((s) => s.patchEntrance);
  const undo = useDesignStore((s) => s.undo);
  const redo = useDesignStore((s) => s.redo);
  const resetFloor = useDesignStore((s) => s.resetFloor);
  const importFloor = useDesignStore((s) => s.importFloor);
  const currentFloor = useNavigationStore((s) => s.currentFloor);
  const floorData = useFloorData(currentFloor);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!designMode) return null;

  const selectedRoom = selectedNodeId
    ? floorData.rooms.find((r) => r.id === selectedNodeId) ?? null
    : null;

  const selectedEntrance = selectedNodeId
    ? floorData.entrances.find((e) => e.id === selectedNodeId) ?? null
    : null;

  const selectedCorridor = selectedNodeId
    ? floorData.corridors.find((c) => c.id === selectedNodeId) ?? null
    : null;

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleExport = () => {
    const payload = {
      id: floorData.id,
      rooms: floorData.rooms
        .map((r) => ({
          id: r.id,
          label: r.label,
          position: r.position,
          width: r.width,
          height: r.height,
        })),
      entrances: floorData.entrances.map((e) => ({
        id: e.id,
        position: e.position,
      })),
      corridors: floorData.corridors,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${floorData.id}_layout.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg(`Exported ${floorData.id} layout.`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result as string);

        const rooms: Record<string, { position?: { x: number; y: number }; width?: number; height?: number }> = {};
        const entrances: Partial<Record<string, { position?: { x: number; y: number } }>> = {};

        for (const r of (imported.rooms as Room[]) ?? []) {
          rooms[r.id] = { position: r.position, width: r.width, height: r.height };
        }
        for (const e of (imported.entrances ?? []) as Entrance[]) {
          entrances[e.id] = { position: e.position };
        }

        const corridors: Record<string, { path?: { x: number; y: number }[] }> = {};
        for (const c of (imported.corridors ?? []) as Corridor[]) {
          corridors[c.id] = { path: c.path };
        }

        importFloor(currentFloor, {
          rooms,
          entrances: entrances as Record<string, { position?: { x: number; y: number } }>,
          corridors,
        });
        setStatusMsg('Layout imported. Map will redraw.');
      } catch {
        setStatusMsg('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    resetFloor(currentFloor);
    setStatusMsg(`Reset ${floorData.id} to defaults.`);
  };

  const countOverrides =
    Object.keys(overrides[currentFloor]?.rooms ?? {}).length +
    Object.keys(overrides[currentFloor]?.entrances ?? {}).length +
    Object.keys(overrides[currentFloor]?.corridors ?? {}).length;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Design Mode</h3>
        <p className={styles.hint}>
          Drag &amp; drop rooms on the map. Changes auto-save.
        </p>
      </div>

      {/* Undo / Redo */}
      <div className={styles.undoRedo}>
        <button
          type="button"
          className={styles.undoBtn}
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          ↩
        </button>
        <button
          type="button"
          className={styles.undoBtn}
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          ↪
        </button>
        <span className={styles.historyCount}>
          {historyIndex + 1}/{history.length}
        </span>
      </div>

      {/* Property inspector */}
      <div className={styles.inspector}>
        <h4 className={styles.sectionTitle}>Inspector</h4>
        {selectedRoom && (
          <div className={styles.props}>
            <div className={styles.propRow}>
              <span className={styles.propLabel}>ID</span>
              <span className={styles.propValue}>{selectedRoom.id}</span>
            </div>
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Label</span>
              <span className={styles.propValue}>{selectedRoom.label}</span>
            </div>
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Type</span>
              <span className={styles.propValue}>{selectedRoom.type}</span>
            </div>

            {/* Editable X */}
            <div className={styles.inputRow}>
              <label className={styles.inputLabel}>X</label>
              <input
                type="number"
                className={styles.inputField}
                value={r4(selectedRoom.position.x)}
                step={0.001}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) patchRoom(currentFloor, selectedRoom.id, { position: { x: v, y: selectedRoom.position.y } });
                }}
              />
            </div>

            {/* Editable Y */}
            <div className={styles.inputRow}>
              <label className={styles.inputLabel}>Y</label>
              <input
                type="number"
                className={styles.inputField}
                value={r4(selectedRoom.position.y)}
                step={0.001}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) patchRoom(currentFloor, selectedRoom.id, { position: { x: selectedRoom.position.x, y: v } });
                }}
              />
            </div>

            {/* Editable Width */}
            <div className={styles.inputRow}>
              <label className={styles.inputLabel}>W</label>
              <input
                type="number"
                className={styles.inputField}
                value={r4(selectedRoom.width)}
                step={0.001}
                min={0.005}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) patchRoom(currentFloor, selectedRoom.id, { width: Math.max(0.005, v) });
                }}
              />
            </div>

            {/* Editable Height */}
            <div className={styles.inputRow}>
              <label className={styles.inputLabel}>H</label>
              <input
                type="number"
                className={styles.inputField}
                value={r4(selectedRoom.height)}
                step={0.001}
                min={0.005}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) patchRoom(currentFloor, selectedRoom.id, { height: Math.max(0.005, v) });
                }}
              />
            </div>

            {/* Nudge buttons */}
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Nudge</span>
            </div>
            <div className={styles.nudgeGrid}>
              <button type="button" className={styles.nudgeBtn} disabled />
              <button
                type="button"
                className={styles.nudgeBtn}
                onClick={() => patchRoom(currentFloor, selectedRoom.id, { position: { x: selectedRoom.position.x, y: selectedRoom.position.y - 0.005 } })}
                title="Nudge up"
              >
                ↑
              </button>
              <button type="button" className={styles.nudgeBtn} disabled />
              <button
                type="button"
                className={styles.nudgeBtn}
                onClick={() => patchRoom(currentFloor, selectedRoom.id, { position: { x: selectedRoom.position.x - 0.005, y: selectedRoom.position.y } })}
                title="Nudge left"
              >
                ←
              </button>
              <button type="button" className={styles.nudgeBtn} disabled />
              <button
                type="button"
                className={styles.nudgeBtn}
                onClick={() => patchRoom(currentFloor, selectedRoom.id, { position: { x: selectedRoom.position.x + 0.005, y: selectedRoom.position.y } })}
                title="Nudge right"
              >
                →
              </button>
              <button type="button" className={styles.nudgeBtn} disabled />
              <button
                type="button"
                className={styles.nudgeBtn}
                onClick={() => patchRoom(currentFloor, selectedRoom.id, { position: { x: selectedRoom.position.x, y: selectedRoom.position.y + 0.005 } })}
                title="Nudge down"
              >
                ↓
              </button>
              <button type="button" className={styles.nudgeBtn} disabled />
            </div>
          </div>
        )}

        {selectedEntrance && (
          <div className={styles.props}>
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Entrance</span>
              <span className={styles.propValue}>{selectedEntrance.id}</span>
            </div>
            <div className={styles.inputRow}>
              <label className={styles.inputLabel}>X</label>
              <input
                type="number"
                className={styles.inputField}
                value={r4(selectedEntrance.position.x)}
                step={0.001}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) patchEntrance(currentFloor, selectedEntrance.id, { position: { x: v, y: selectedEntrance.position.y } });
                }}
              />
            </div>
            <div className={styles.inputRow}>
              <label className={styles.inputLabel}>Y</label>
              <input
                type="number"
                className={styles.inputField}
                value={r4(selectedEntrance.position.y)}
                step={0.001}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) patchEntrance(currentFloor, selectedEntrance.id, { position: { x: selectedEntrance.position.x, y: v } });
                }}
              />
            </div>
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Nudge</span>
            </div>
            <div className={styles.nudgeGrid}>
              <button type="button" className={styles.nudgeBtn} disabled />
              <button type="button" className={styles.nudgeBtn} onClick={() => patchEntrance(currentFloor, selectedEntrance.id, { position: { x: selectedEntrance.position.x, y: selectedEntrance.position.y - 0.005 } })} title="Nudge up">↑</button>
              <button type="button" className={styles.nudgeBtn} disabled />
              <button type="button" className={styles.nudgeBtn} onClick={() => patchEntrance(currentFloor, selectedEntrance.id, { position: { x: selectedEntrance.position.x - 0.005, y: selectedEntrance.position.y } })} title="Nudge left">←</button>
              <button type="button" className={styles.nudgeBtn} disabled />
              <button type="button" className={styles.nudgeBtn} onClick={() => patchEntrance(currentFloor, selectedEntrance.id, { position: { x: selectedEntrance.position.x + 0.005, y: selectedEntrance.position.y } })} title="Nudge right">→</button>
              <button type="button" className={styles.nudgeBtn} disabled />
              <button type="button" className={styles.nudgeBtn} onClick={() => patchEntrance(currentFloor, selectedEntrance.id, { position: { x: selectedEntrance.position.x, y: selectedEntrance.position.y + 0.005 } })} title="Nudge down">↓</button>
              <button type="button" className={styles.nudgeBtn} disabled />
            </div>
          </div>
        )}

        {selectedCorridor && (
          <div className={styles.props}>
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Corridor</span>
              <span className={styles.propValue}>{selectedCorridor.id}</span>
            </div>
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Waypoints</span>
              <span className={styles.propValue}>{selectedCorridor.path.length}</span>
            </div>
            <p className={styles.hint} style={{ marginTop: 4 }}>
              Drag waypoint circles on the map to reshape. Ctrl+click path to add waypoint.
            </p>
          </div>
        )}

        {!selectedRoom && !selectedEntrance && !selectedCorridor && (
          <p className={styles.noSelect}>Click a room, entrance, or corridor on the map to inspect.</p>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <h4 className={styles.sectionTitle}>Actions</h4>
        <div className={styles.actionRow}>
          <button type="button" className={styles.btn} onClick={handleExport}>
            Export {floorData.id} Layout
          </button>
          <button type="button" className={styles.btn} onClick={handleImportClick}>
            Import Layout
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={handleReset}>
            Reset {floorData.id} ({countOverrides} overrides)
          </button>
        </div>
      </div>

      {statusMsg && <div className={styles.status}>{statusMsg}</div>}
    </div>
  );
}
