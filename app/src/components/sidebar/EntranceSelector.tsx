import type { EntranceId } from '../../core/types';
import { useNavigationStore } from '../../store/navigationStore';
import styles from './EntranceSelector.module.css';

const ENTRANCES: EntranceId[] = ['NW', 'NE', 'SW'];

const NAMES: Record<EntranceId, string> = {
  NW: 'North-West Entrance',
  NE: 'North-East Entrance',
  SW: 'South-West Entrance',
};

export function EntranceSelector() {
  const currentEntrance = useNavigationStore((s) => s.currentEntrance);
  const selectEntrance = useNavigationStore((s) => s.selectEntrance);

  return (
    <div className={styles.selector}>
      <div className={styles.label}>
        You are here: <strong>{NAMES[currentEntrance]}</strong>
      </div>
      <div className={styles.buttons}>
        {ENTRANCES.map((id) => (
          <button
            key={id}
            type="button"
            className={`${styles.btn} ${id === currentEntrance ? styles.btnActive : ''}`}
            onClick={() => selectEntrance(id)}
          >
            {id}
          </button>
        ))}
      </div>
    </div>
  );
}
