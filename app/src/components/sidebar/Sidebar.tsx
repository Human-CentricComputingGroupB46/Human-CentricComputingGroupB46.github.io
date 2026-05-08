import { EntranceSelector } from './EntranceSelector';
import { Numpad } from './Numpad';
import styles from './Sidebar.module.css';

interface Props {
  onRoute: () => void;
  disabled?: boolean;
}

export function Sidebar({ onRoute, disabled = false }: Props) {
  return (
    <aside className={styles.sidebar}>
      <EntranceSelector />
      <div className={styles.divider} />
      <Numpad onRoute={onRoute} disabled={disabled} />
    </aside>
  );
}
