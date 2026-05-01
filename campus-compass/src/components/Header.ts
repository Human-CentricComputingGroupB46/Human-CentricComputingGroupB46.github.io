// ============================================================
// Header Component
// ============================================================

import { toggleDesignMode, toggleDemoMode, getState } from '../core/state';

export function createHeader(): HTMLElement {
  const header = document.createElement('header');
  header.className = 'app-header';
  header.innerHTML = `
    <div class="header-left">
      <div class="header-logo">
        <svg width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="none" stroke="#e67e22" stroke-width="2"/>
          <circle cx="16" cy="16" r="4" fill="#e67e22"/>
          <line x1="16" y1="2" x2="16" y2="8" stroke="#e67e22" stroke-width="2"/>
          <line x1="16" y1="24" x2="16" y2="30" stroke="#e67e22" stroke-width="2"/>
          <line x1="2" y1="16" x2="8" y2="16" stroke="#e67e22" stroke-width="2"/>
          <line x1="24" y1="16" x2="30" y2="16" stroke="#e67e22" stroke-width="2"/>
        </svg>
      </div>
      <div class="header-title">
        <h1>CampusCompass</h1>
        <span class="header-subtitle">EB Building · Floors 1 and 2 Navigation</span>
      </div>
    </div>
    <div class="header-right">
      <button id="btn-design" class="header-btn">OPEN DESIGN</button>
      <button id="btn-demo" class="header-btn">DEMO MODE</button>
      <span id="header-clock" class="header-clock"></span>
    </div>
  `;

  // Design mode toggle
  header.querySelector('#btn-design')!.addEventListener('click', () => {
    toggleDesignMode();
    const btn = header.querySelector('#btn-design') as HTMLButtonElement;
    btn.textContent = getState().designMode ? 'CLOSE DESIGN' : 'OPEN DESIGN';
    btn.classList.toggle('active', getState().designMode);
  });

  // Demo mode toggle
  header.querySelector('#btn-demo')!.addEventListener('click', () => {
    toggleDemoMode();
    const btn = header.querySelector('#btn-demo') as HTMLButtonElement;
    btn.classList.toggle('active', getState().demoMode);
  });

  // Clock
  const clock = header.querySelector('#header-clock') as HTMLSpanElement;
  function updateClock() {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  updateClock();
  setInterval(updateClock, 30_000);

  return header;
}
