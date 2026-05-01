// ============================================================
// Legend Component (map footer)
// ============================================================

export function createLegend(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'map-legend';
  container.innerHTML = `
    <div class="legend-item">
      <span class="legend-dot" style="background:#e67e22"></span>
      You are here
    </div>
    <div class="legend-item">
      <span class="legend-dot" style="background:#27ae60"></span>
      Destination
    </div>
    <div class="legend-item">
      <span class="legend-line"></span>
      Route
    </div>
    <div class="legend-item">
      <span class="legend-hatch"></span>
      Inaccessible
    </div>
  `;
  return container;
}
