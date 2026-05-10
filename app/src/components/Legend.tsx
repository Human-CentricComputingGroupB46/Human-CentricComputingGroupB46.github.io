import styles from './Legend.module.css';

export function Legend() {
  return (
    <div className={styles.legend} aria-label="Map legend">
      <span className={styles.item}>
        <span className={`${styles.dot} ${styles.dotCurrent}`} />
        You are here
      </span>
      <span className={styles.item}>
        <span className={`${styles.dot} ${styles.dotDestination}`} />
        Destination
      </span>
      <span className={styles.item}>
        <span className={styles.routeLine} />
        Route
      </span>
      <span className={styles.item}>
        <span className={styles.hatch} />
        Inaccessible
      </span>
    </div>
  );
}
