import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Header } from '../components/layout/Header';
import { FloorTabs } from '../components/layout/FloorTabs';
import { MapView } from '../components/map/MapView';
import { Legend } from '../components/Legend';
import { Sidebar } from '../components/sidebar/Sidebar';
import { DesignPanel } from '../components/design/DesignPanel';
import { floorPlans } from '../core/floorPlans';
import { useDesignStore } from '../store/designStore';
import { useNavigationStore } from '../store/navigationStore';
import { useRoute } from '../hooks/useRoute';
import { useDemoMode } from '../hooks/useDemoMode';
import styles from './HomePage.module.css';

export function HomePage() {
  const handleRoute = useRoute();
  const designMode = useDesignStore((s) => s.designMode);
  const demoMode = useDesignStore((s) => s.demoMode);
  const currentFloor = useNavigationStore((s) => s.currentFloor);
  const mapStageRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const [legendPosition, setLegendPosition] = useState<{ left: number; top: number } | null>(null);

  useDemoMode();

  useEffect(() => {
    const stage = mapStageRef.current;
    const legend = legendRef.current;
    if (!stage || !legend) return;

    const updateLegendPosition = () => {
      const svg = stage.querySelector('svg');
      if (!svg) return;

      const stageRect = stage.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      const legendRect = legend.getBoundingClientRect();
      const plan = floorPlans[currentFloor];
      const planAspect = plan.viewBoxWidth / plan.viewBoxHeight;
      const svgAspect = svgRect.width / svgRect.height;
      const gap = 8;

      const imageWidth = svgAspect > planAspect ? svgRect.height * planAspect : svgRect.width;
      const imageHeight = svgAspect > planAspect ? svgRect.height : svgRect.width / planAspect;
      const imageLeft = (svgRect.width - imageWidth) / 2;
      const imageTop = (svgRect.height - imageHeight) / 2;
      const svgLeft = svgRect.left - stageRect.left;
      const svgTop = svgRect.top - stageRect.top;
      const rightSpace = svgRect.width - imageLeft - imageWidth;
      const bottomSpace = svgRect.height - imageTop - imageHeight;

      let left: number;
      let top: number;

      if (rightSpace >= legendRect.width + gap * 2) {
        left = svgLeft + imageLeft + imageWidth + gap;
        top = svgTop + imageTop + imageHeight - legendRect.height - gap;
      } else if (bottomSpace >= legendRect.height + gap * 2) {
        left = svgLeft + imageLeft + imageWidth - legendRect.width - gap;
        top = svgTop + imageTop + imageHeight + gap;
      } else {
        left = svgLeft + svgRect.width - legendRect.width - gap;
        top = svgTop + svgRect.height - legendRect.height - gap;
      }

      setLegendPosition((prev) => {
        const next = { left: Math.round(left), top: Math.round(top) };
        if (prev && prev.left === next.left && prev.top === next.top) return prev;
        return next;
      });
    };

    const frame = requestAnimationFrame(updateLegendPosition);
    const observer = new ResizeObserver(updateLegendPosition);
    observer.observe(stage);
    observer.observe(legend);
    const svg = stage.querySelector('svg');
    if (svg) observer.observe(svg);
    window.addEventListener('resize', updateLegendPosition);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', updateLegendPosition);
    };
  }, [currentFloor]);

  const legendStyle: CSSProperties | undefined = legendPosition
    ? { left: legendPosition.left, top: legendPosition.top, right: 'auto', bottom: 'auto' }
    : undefined;

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.floorBar}>
        <div className={styles.titleGroup}>
          <h2 className={styles.floorLabel}>EB Building Navigation</h2>
        </div>
        <FloorTabs />
      </div>
      <div className={styles.main}>
        <div className={styles.mapArea}>
          <div className={styles.mapStage} ref={mapStageRef}>
            <MapView />
            <div className={styles.legendOverlay} ref={legendRef} style={legendStyle}>
              <Legend />
            </div>
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
