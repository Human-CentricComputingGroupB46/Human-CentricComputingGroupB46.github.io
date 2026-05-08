export function Legend() {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#e67e22' }} />
        You are here
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#27ae60' }} />
        Destination
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ display: 'inline-block', width: 14, height: 2, background: '#e67e22', borderRadius: 1 }} />
        Route
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          background: 'repeating-linear-gradient(45deg, #bdc3c7, #bdc3c7 1px, transparent 1px, transparent 4px)',
          borderRadius: 1,
        }} />
        Inaccessible
      </span>
    </div>
  );
}
