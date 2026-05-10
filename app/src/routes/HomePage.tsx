import { Header } from '../components/layout/Header';
import { FloorTabs } from '../components/layout/FloorTabs';
import { MapView } from '../components/map/MapView';
import { Legend } from '../components/Legend';
import { Sidebar } from '../components/sidebar/Sidebar';
import { DesignPanel } from '../components/design/DesignPanel';
import { useDesignStore } from '../store/designStore';
import { useRoute } from '../hooks/useRoute';
import { useDemoMode } from '../hooks/useDemoMode';
import styles from './HomePage.module.css';

export function HomePage() {
  const handleRoute = useRoute();
  const designMode = useDesignStore((s) => s.designMode);
  const demoMode = useDesignStore((s) => s.demoMode);

  useDemoMode();

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.floorBar}>
        <span className={styles.floorLabel}>EB Building Navigation</span>
        <FloorTabs />
      </div>
      <div className={styles.main}>
        <div className={styles.mapArea}>
          <div className={styles.mapStage}>
            <MapView />
          </div>
          <div className={styles.legendBar}>
            <Legend />
          </div>
        </div>
        <div className={styles.sidebarContainer}>
          <Sidebar onRoute={handleRoute} disabled={demoMode} />
        </div>
        {designMode && <DesignPanel />}
      </div>
    </div>
  );
}
