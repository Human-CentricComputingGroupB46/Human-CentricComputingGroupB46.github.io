import { useEffect, useState } from 'react';
import styles from './Header.module.css';

export function Header() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      );
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <svg className={styles.logo} width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="14" fill="none" stroke="#f28a1a" strokeWidth="2" />
          <circle cx="16" cy="16" r="4" fill="#f28a1a" />
          <line x1="16" y1="2" x2="16" y2="8" stroke="#f28a1a" strokeWidth="2" />
          <line x1="16" y1="24" x2="16" y2="30" stroke="#f28a1a" strokeWidth="2" />
          <line x1="2" y1="16" x2="8" y2="16" stroke="#f28a1a" strokeWidth="2" />
          <line x1="24" y1="16" x2="30" y2="16" stroke="#f28a1a" strokeWidth="2" />
        </svg>
        <div className={styles.title}>
          <h1 className={styles.brand}>CampusCompass</h1>
          <span className={styles.subtitle}>EB Building - Floors 1 and 2 Navigation</span>
        </div>
      </div>

      <div className={styles.right}>
        <span className={styles.clock}>{time}</span>
      </div>
    </header>
  );
}
