import { EntranceSelector } from './EntranceSelector';
import { Numpad } from './Numpad';
import type { RouteHandler } from '../../hooks/useRoute';
import styles from './Sidebar.module.css';

interface Props {
  onRoute: RouteHandler;
  disabled?: boolean;
}

export function Sidebar({ onRoute, disabled = false }: Props) {
  return (
    <aside className={styles.sidebar}>
      <EntranceSelector />
      <Numpad onRoute={onRoute} disabled={disabled} />
    </aside>
  );
}
