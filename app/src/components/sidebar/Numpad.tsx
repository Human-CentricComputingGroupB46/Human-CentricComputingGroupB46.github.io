import { useNavigationStore } from '../../store/navigationStore';
import { ROOM_PREFIX } from '../../core/constants';
import styles from './Numpad.module.css';

interface Props {
  onRoute: () => void;
  disabled?: boolean;
}

const DIGIT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', '⌫'];

export function Numpad({ onRoute, disabled = false }: Props) {
  const inputRoomNumber = useNavigationStore((s) => s.inputRoomNumber);
  const message = useNavigationStore((s) => s.message);
  const targetRoom = useNavigationStore((s) => s.targetRoom);
  const recentRooms = useNavigationStore((s) => s.recentRooms);
  const inputDigit = useNavigationStore((s) => s.inputDigit);
  const clearInput = useNavigationStore((s) => s.clearInput);
  const backspace = useNavigationStore((s) => s.backspace);
  const resetInput = useNavigationStore((s) => s.resetInput);

  const handleKey = (key: string) => {
    if (disabled) return;
    if (key === 'Clear') clearInput();
    else if (key === '⌫') backspace();
    else inputDigit(key);
  };

  const handleRecentClick = (roomId: string) => {
    if (disabled) return;
    resetInput();
    const num = roomId.slice(ROOM_PREFIX.length);
    for (const c of num) inputDigit(c);
    setTimeout(onRoute, 0);
  };

  const isError = message != null && message.toLowerCase().includes('not');

  return (
    <div className={`${styles.section} ${disabled ? styles.sectionDisabled : ''}`}>
      {/* Display */}
      <div className={styles.display}>
        <span className={styles.displayLabel}>Room number</span>
        <div className={styles.displayRow}>
          <div className={styles.inputBox}>
            <span className={styles.prefix}>{ROOM_PREFIX}</span>
            <span className={styles.digits}>{inputRoomNumber}</span>
            <span className={styles.cursor}>|</span>
          </div>
          <button type="button" className={styles.btnGo} onClick={onRoute} disabled={disabled}>
            Go
          </button>
        </div>
      </div>

      {/* Message */}
      <div className={`${styles.message} ${isError ? styles.messageError : ''}`}>
        {message}
      </div>

      {/* Recent rooms */}
      {recentRooms.length > 0 && (
        <div className={styles.recent}>
          {recentRooms.map((r) => (
            <button
              key={r}
              type="button"
              className={`${styles.recentChip} ${r === targetRoom ? styles.recentChipActive : ''}`}
              onClick={() => handleRecentClick(r)}
              disabled={disabled}
            >
              {r}
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
