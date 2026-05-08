import { useNavigationStore } from '../../store/navigationStore';
import { FLOOR_LABELS, FLOOR_ORDER } from '../../core/floorPlans';
import styles from './FloorTabs.module.css';

export function FloorTabs() {
  const currentFloor = useNavigationStore((s) => s.currentFloor);
  const switchFloor = useNavigationStore((s) => s.switchFloor);

  return (
    <div className={styles.tabs} role="tablist" aria-label="Floor switcher">
      {FLOOR_ORDER.map((id) => {
        const active = id === currentFloor;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            data-floor={id}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            onClick={() => switchFloor(id)}
          >
            {FLOOR_LABELS[id]}
          </button>
        );
      })}
    </div>
  );
}
