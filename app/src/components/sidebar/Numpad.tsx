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

const DIGIT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', '⌫'];

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
    else if (key === '⌫') backspace();
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

  return (
    <div className={`${styles.section} ${disabled ? styles.sectionDisabled : ''}`}>
      {/* Display */}
      <div className={styles.display}>
        <span className={styles.displayLabel}>Room number</span>
        <div className={styles.displayRow}>
          <div className={styles.inputBox} data-ui="room-number-shell">
            <span className={styles.prefix}>{ROOM_PREFIX}</span>
            <input
              id="room-number-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={styles.digitsInput}
              value={inputRoomNumber}
              placeholder="104"
              aria-label="Room number"
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
          </div>
          <button type="button" className={styles.btnGo} data-ui="room-number-go" onClick={onRoute} disabled={disabled}>
            Go
          </button>
        </div>
      </div>

      {/* Message */}
      <div className={`${styles.message} ${isError ? styles.messageError : ''}`}>
        {message}
      </div>

      {/* Suggestions */}
      {suggestedRoomIds.length > 0 && (
        <div className={`${styles.recent} room-suggestions`} data-ui="room-suggestions">
          {suggestedRoomIds.map((roomId) => (
            <button
              key={roomId}
              type="button"
              className={`${styles.recentChip} room-suggestion-chip ${roomId === targetRoom ? styles.recentChipActive : ''}`}
              data-ui="room-suggestion-chip"
              onClick={() => handleSuggestionClick(roomId)}
              disabled={disabled}
            >
              {roomId}
            </button>
          ))}
        </div>
      )}

      {/* Numpad grid */}
      <div className={styles.grid}>
        {DIGIT_KEYS.map((key) => {
          let cls = styles.key;
          if (key === 'Clear') cls = `${styles.key} ${styles.keyClear}`;
          else if (key === '⌫') cls = `${styles.key} ${styles.keyBackspace}`;
          else cls = `${styles.key} ${styles.keyDigit}`;

          return (
            <button
              key={key}
              type="button"
              className={cls}
              onClick={() => handleKey(key)}
              disabled={disabled}
            >
              {key}
            </button>
          );
        })}
      </div>

      {/* Route button */}
      <button type="button" className={styles.btnRoute} onClick={onRoute} disabled={disabled}>
        Route
      </button>
    </div>
  );
}
