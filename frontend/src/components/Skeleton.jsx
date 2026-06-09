export const SkeletonCard = () => (
  <div className="brutalist-card" style={{ padding: 0, overflow: 'hidden' }}>
    <div style={{
      height: '200px',
      background: '#18181b',
      borderBottom: '2px solid var(--border)',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
    <div style={{ padding: '1.25rem' }}>
      <div style={{
        height: '18px',
        width: '60px',
        background: 'var(--muted)',
        marginBottom: '12px',
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
      <div style={{
        height: '20px',
        width: '80%',
        background: 'var(--muted)',
        marginBottom: '8px',
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
      <div style={{
        height: '24px',
        width: '40%',
        background: 'var(--muted)',
        marginBottom: '16px',
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <div style={{ height: '12px', width: '30%', background: 'var(--muted)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: '12px', width: '20%', background: 'var(--muted)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 8 }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '24px',
  }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);
