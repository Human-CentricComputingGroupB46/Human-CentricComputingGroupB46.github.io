import { useRef, useState } from 'react';
import { useDesignStore } from '../../store/designStore';
import { useFloorData } from '../../hooks/useFloorData';
import { useNavigationStore } from '../../store/navigationStore';
import type { Room, Entrance, Corridor } from '../../core/types';
import styles from './DesignPanel.module.css';

export function DesignPanel() {
  const designMode = useDesignStore((s) => s.designMode);
  const selectedNodeId = useDesignStore((s) => s.selectedNodeId);
  const overrides = useDesignStore((s) => s.overrides);
  const patchRoom = useDesignStore((s) => s.patchRoom);
  const patchCorridor = useDesignStore((s) => s.patchCorridor);
  const patchEntrance = useDesignStore((s) => s.patchEntrance);
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

        // Build overrides from the imported data
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
    // Reset file input so the same file can be re-imported
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
          Click &amp; drag rooms on the map to reposition. Changes auto-save to localStorage.
        </p>
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
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Position (x, y)</span>
              <span className={styles.propValue}>
                {selectedRoom.position.x.toFixed(4)}, {selectedRoom.position.y.toFixed(4)}
              </span>
            </div>
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Size (w × h)</span>
              <span className={styles.propValue}>
                {selectedRoom.width.toFixed(4)} × {selectedRoom.height.toFixed(4)}
              </span>
            </div>
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Move</span>
            </div>
            <div className={styles.propActions}>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={() =>
                  patchRoom(currentFloor, selectedRoom.id, {
                    position: {
                      x: selectedRoom.position.x - 0.005,
                      y: selectedRoom.position.y,
                    },
                  })
                }
                title="Nudge left"
              >
                ←
              </button>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={() =>
                  patchRoom(currentFloor, selectedRoom.id, {
                    position: {
                      x: selectedRoom.position.x + 0.005,
                      y: selectedRoom.position.y,
                    },
                  })
                }
                title="Nudge right"
              >
                →
              </button>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={() =>
                  patchRoom(currentFloor, selectedRoom.id, {
                    position: {
                      x: selectedRoom.position.x,
                      y: selectedRoom.position.y - 0.005,
                    },
                  })
                }
                title="Nudge up"
              >
                ↑
              </button>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={() =>
                  patchRoom(currentFloor, selectedRoom.id, {
                    position: {
                      x: selectedRoom.position.x,
                      y: selectedRoom.position.y + 0.005,
                    },
                  })
                }
                title="Nudge down"
              >
                ↓
              </button>
            </div>
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Scale (W × H)</span>
            </div>
            <div className={styles.propActions}>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={() =>
                  patchRoom(currentFloor, selectedRoom.id, {
                    width: Math.max(0.005, selectedRoom.width - 0.005),
                  })
                }
                title="Shrink width"
              >
                W−
              </button>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={() =>
                  patchRoom(currentFloor, selectedRoom.id, {
                    width: selectedRoom.width + 0.005,
                  })
                }
                title="Grow width"
              >
                W+
              </button>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={() =>
                  patchRoom(currentFloor, selectedRoom.id, {
                    height: Math.max(0.005, selectedRoom.height - 0.005),
                  })
                }
                title="Shrink height"
              >
                H−
              </button>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={() =>
                  patchRoom(currentFloor, selectedRoom.id, {
                    height: selectedRoom.height + 0.005,
                  })
                }
                title="Grow height"
              >
                H+
              </button>
            </div>
          </div>
        )}
        {selectedEntrance && (
          <div className={styles.props}>
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Entrance</span>
              <span className={styles.propValue}>{selectedEntrance.id}</span>
            </div>
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Position (x, y)</span>
              <span className={styles.propValue}>
                {selectedEntrance.position.x.toFixed(4)}, {selectedEntrance.position.y.toFixed(4)}
              </span>
            </div>
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Move</span>
            </div>
            <div className={styles.propActions}>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={() =>
                  patchEntrance(currentFloor, selectedEntrance.id, {
                    position: {
                      x: selectedEntrance.position.x - 0.005,
                      y: selectedEntrance.position.y,
                    },
                  })
                }
                title="Nudge left"
              >
                ←
              </button>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={() =>
                  patchEntrance(currentFloor, selectedEntrance.id, {
                    position: {
                      x: selectedEntrance.position.x + 0.005,
                      y: selectedEntrance.position.y,
                    },
                  })
                }
                title="Nudge right"
              >
                →
              </button>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={() =>
                  patchEntrance(currentFloor, selectedEntrance.id, {
                    position: {
                      x: selectedEntrance.position.x,
                      y: selectedEntrance.position.y - 0.005,
                    },
                  })
                }
                title="Nudge up"
              >
                ↑
              </button>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={() =>
                  patchEntrance(currentFloor, selectedEntrance.id, {
                    position: {
                      x: selectedEntrance.position.x,
                      y: selectedEntrance.position.y + 0.005,
                    },
                  })
                }
                title="Nudge down"
              >
                ↓
              </button>
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
            <div className={styles.propRow}>
              <span className={styles.propLabel}>Path</span>
            </div>
            {selectedCorridor.path.map((pt, i) => (
              <div key={i} className={styles.propRow}>
                <span className={styles.propLabel}>
                  [{i}] {pt.x.toFixed(4)}, {pt.y.toFixed(4)}
                </span>
                <button
                  type="button"
                  className={styles.smallBtn}
                  onClick={() => {
                    if (selectedCorridor.path.length <= 2) return;
                    const newPath = selectedCorridor.path.filter((_, idx) => idx !== i);
                    patchCorridor(currentFloor, selectedCorridor.id, { path: newPath });
                  }}
                  disabled={selectedCorridor.path.length <= 2}
                  title="Delete waypoint"
                  style={{ fontSize: 10, width: 20, height: 20 }}
                >
                  ×
                </button>
              </div>
            ))}
            <p className={styles.hint} style={{ marginTop: 6 }}>
              Ctrl+click on path to add waypoint. Drag circles to move.
            </p>
          </div>
        )}
        {!selectedRoom && !selectedEntrance && !selectedCorridor && (
          <p className={styles.noSelect}>Click a room or corridor on the map to inspect it.</p>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <h4 className={styles.sectionTitle}>
          Floor {currentFloor === 'floor1' ? '1' : '2'} ({countOverrides} overrides)
        </h4>
        <div className={styles.actionRow}>
          <button type="button" className={styles.btn} onClick={handleExport}>
            Export JSON
          </button>
          <button type="button" className={styles.btn} onClick={handleImportClick}>
            Import JSON
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={handleReset}>
            Reset Floor
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {statusMsg && <p className={styles.status}>{statusMsg}</p>}
      </div>
    </div>
  );
}
