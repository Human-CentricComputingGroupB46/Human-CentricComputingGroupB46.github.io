// ============================================================
// Sidebar Component — right panel assembly
// ============================================================

import { createEntranceSelector } from './EntranceSelector';
import { createNumpad } from './Numpad';

export function createSidebar(onRoute: () => void): HTMLElement {
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';

  sidebar.appendChild(createEntranceSelector());
  sidebar.appendChild(createNumpad(onRoute));

  return sidebar;
}
