import { useMemo } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { ROOM_PREFIX } from '../../core/constants';
import { getAllRoomIds } from '../../core/graph';
import { useAllFloorData } from '../../hooks/useFloorData';
import styles from './Numpad.module.css';

interface Props {
  onRoute: () => void;
  disabled?: boolean;
}

interface TrieNode {
  children: Map<string, TrieNode>;
  roomId: string | null;
}

const DIGIT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', 'Back'];

function createTrieNode(): TrieNode {
  return { children: new Map(), roomId: null };
}

function buildRoomTrie(roomIds: string[]): TrieNode {
  const root = createTrieNode();
  const uniqueSortedRoomIds = [...new Set(roomIds)].sort();

  for (const roomId of uniqueSortedRoomIds) {
    const suffix = roomId.slice(ROOM_PREFIX.length);
    let node = root;
    for (const ch of suffix) {
      let next = node.children.get(ch);
      if (!next) {
        next = createTrieNode();
        node.children.set(ch, next);
      }
      node = next;
    }
    node.roomId = roomId;
  }

  return root;
}

function collectTrieSuggestions(node: TrieNode, limit: number, out: string[]) {
  if (out.length >= limit) return;
  if (node.roomId) out.push(node.roomId);
  if (out.length >= limit) return;

  const nextKeys = [...node.children.keys()].sort();
  for (const key of nextKeys) {
    const child = node.children.get(key);
    if (!child) continue;
    collectTrieSuggestions(child, limit, out);
    if (out.length >= limit) return;
  }
}

function suggestRoomIds(root: TrieNode, prefix: string, limit: number): string[] {
  if (!prefix) return [];
  let node: TrieNode | undefined = root;
  for (const ch of prefix) {
    node = node.children.get(ch);
    if (!node) return [];
  }
  const suggestions: string[] = [];
  collectTrieSuggestions(node, limit, suggestions);
  return suggestions;
}

export function Numpad({ onRoute, disabled = false }: Props) {
  const floors = useAllFloorData();
  const inputRoomNumber = useNavigationStore((s) => s.inputRoomNumber);
  const message = useNavigationStore((s) => s.message);
  const targetRoom = useNavigationStore((s) => s.targetRoom);
  const routeFloors = useNavigationStore((s) => s.routeFloors);
  const setInputRoomNumber = useNavigationStore((s) => s.setInputRoomNumber);
  const inputDigit = useNavigationStore((s) => s.inputDigit);
  const clearInput = useNavigationStore((s) => s.clearInput);
  const backspace = useNavigationStore((s) => s.backspace);
  const resetInput = useNavigationStore((s) => s.resetInput);

  const suggestionTrie = useMemo(() => {
    const numericRoomIds = getAllRoomIds(floors).filter((roomId) => {
      if (!roomId.startsWith(ROOM_PREFIX)) return false;
      return /^\d+$/.test(roomId.slice(ROOM_PREFIX.length));
    });
    return buildRoomTrie(numericRoomIds);
  }, [floors]);

  const suggestedRoomIds = useMemo(
    () => suggestRoomIds(suggestionTrie, inputRoomNumber.trim(), 3),
    [suggestionTrie, inputRoomNumber],
  );

  const handleKey = (key: string) => {
    if (disabled) return;
    if (key === 'Clear') clearInput();
    else if (key === 'Back') backspace();
    else inputDigit(key);
  };

  const handleSuggestionClick = (roomId: string) => {
    if (disabled) return;
    resetInput();
    const num = roomId.slice(ROOM_PREFIX.length);
    setInputRoomNumber(num);
    setTimeout(onRoute, 0);
  };

  const isError = message != null && message.toLowerCase().includes('not');
  const displayValue = inputRoomNumber ? `${ROOM_PREFIX}${inputRoomNumber}` : '';
  const routeDetail = message ?? 'Route instructions will appear here after searching.';
  const floorText = routeFloors.length > 0
    ? routeFloors.map((floor) => (floor === 'floor1' ? 'Floor 1' : 'Floor 2')).join(' + ')
    : 'No active route';

  return (
    <div className={`${styles.stack} ${disabled ? styles.sectionDisabled : ''}`}>
      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <span className={styles.kicker}>Destination</span>
          <span className={styles.helper}>Enter room, e.g. EB249</span>
        </div>
        <div className={styles.displayRow}>
          <input
            id="room-number-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className={styles.roomInput}
            value={displayValue}
            placeholder="Enter room, e.g. EB249"
            aria-label="Destination room"
            data-ui="room-number-input"
            disabled={disabled}
            onChange={(e) => setInputRoomNumber(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onRoute();
              }
            }}
          />
          <button type="button" className={styles.btnRoute} data-ui="room-number-go" onClick={onRoute} disabled={disabled}>
            Route
          </button>
        </div>

        {suggestedRoomIds.length > 0 && (
          <div className={`${styles.suggestions} room-suggestions`} data-ui="room-suggestions">
            {suggestedRoomIds.map((roomId) => (
              <button
                key={roomId}
                type="button"
                className={`${styles.suggestionChip} room-suggestion-chip ${roomId === targetRoom ? styles.suggestionChipActive : ''}`}
                data-ui="room-suggestion-chip"
                onClick={() => handleSuggestionClick(roomId)}
                disabled={disabled}
              >
                {roomId}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <span className={styles.kicker}>Route Result</span>
          <span className={targetRoom ? styles.resultRoom : styles.resultEmpty}>
            {targetRoom ?? 'Waiting for destination'}
          </span>
        </div>
        <div className={`${styles.message} ${isError ? styles.messageError : ''}`}>
          {routeDetail}
        </div>
        <div className={styles.floorPill}>{floorText}</div>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <span className={styles.kicker}>Keypad</span>
        </div>
        <div className={styles.grid}>
          {DIGIT_KEYS.map((key) => {
            let cls = styles.key;
            if (key === 'Clear') cls = `${styles.key} ${styles.keyClear}`;
            else if (key === 'Back') cls = `${styles.key} ${styles.keyBackspace}`;
            else cls = `${styles.key} ${styles.keyDigit}`;

            return (
              <button
                key={key}
                type="button"
                className={cls}
                onClick={() => handleKey(key)}
                disabled={disabled}
              >
                {key === 'Back' ? '⌫' : key}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
