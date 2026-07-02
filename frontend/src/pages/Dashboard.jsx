import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Button from '../components/Button';

const STATUS_STYLES = {
  pending:  { className: 'badge-amber', label: 'Pending Review' },
  live:     { className: 'badge-green', label: 'Live' },
  hidden:   { className: 'badge-gray',  label: 'Hidden' },
  sold:     { className: 'badge-blue',  label: 'Sold' },
  rejected: { className: 'badge-red',   label: 'Rejected' },
  expired:  { className: 'badge-gray',  label: 'Expired' },
};

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  // actionError replaces window.alert() — shown inline, dismissible,
  // doesn't block the UI thread the way a native alert() does.
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null); // tracks which card's button is mid-request
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/products/mine')
      .then(res => setProducts(res.data))
      .catch(() => setActionError('Failed to load your listings.'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    setBusyId(id);
    setActionError('');
    try {
      await api.patch(`/api/products/${id}/status`, { status });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update listing.');
    } finally {
      setBusyId(null);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this listing permanently? This cannot be undone.')) return;
    setBusyId(id);
    setActionError('');
    try {
      await api.delete(`/api/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to delete listing.');
    } finally {
      setBusyId(null);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  if (loading) return (
    <div className="page">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: '16px', display: 'flex', gap: '14px' }}>
            <div className="skeleton" style={{ width: '72px', height: '72px', borderRadius: '8px', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
              <div className="skeleton" style={{ height: '14px', width: '40%', borderRadius: '4px' }} />
              <div className="skeleton" style={{ height: '18px', width: '20%', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700 }}>My Listings</h1>
        <Button onClick={() => navigate('/sell')}>+ New Listing</Button>
      </div>

      {/* Inline error banner — replaces alert(). Dismissible, non-blocking. */}
      {actionError && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', background: 'var(--color-danger-subtle)', border: '1px solid #fecaca',
          borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '13px', marginBottom: '20px',
        }}>
          {actionError}
          <button onClick={() => setActionError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', fontSize: '16px', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
      )}

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 16px', display: 'block' }}>
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            No listings yet. <a href="/sell" style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>Create one</a>
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {products.map(p => {
            const status = STATUS_STYLES[p.status] || STATUS_STYLES.pending;
            const isBusy = busyId === p.id;
            return (
              <div key={p.id} className="card" style={{ padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '72px', height: '72px', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                  {p.image_urls?.[0]
                    ? <img src={p.image_urls[0]} alt={p.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      </div>
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</h3>
                    <span className={`badge ${status.className}`} style={{ flexShrink: 0 }}>{status.label}</span>
                  </div>
                  <p className="text-price" style={{ fontSize: '15px', marginBottom: '10px' }}>{formatPrice(p.price)}</p>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {p.status === 'live' && (
                      <Button variant="secondary" loading={isBusy} onClick={() => updateStatus(p.id, 'hidden')} style={{ padding: '5px 12px', fontSize: '12px' }}>Hide</Button>
                    )}
                    {p.status === 'hidden' && (
                      <Button variant="secondary" loading={isBusy} onClick={() => updateStatus(p.id, 'live')} style={{ padding: '5px 12px', fontSize: '12px' }}>Unhide</Button>
                    )}
                    {(p.status === 'live' || p.status === 'hidden') && (
                      <Button variant="secondary" loading={isBusy} onClick={() => updateStatus(p.id, 'sold')} style={{ padding: '5px 12px', fontSize: '12px' }}>Mark Sold</Button>
                    )}
                    {p.status !== 'sold' && (
                      <Button variant="danger" loading={isBusy} onClick={() => deleteProduct(p.id)} style={{ padding: '5px 12px', fontSize: '12px' }}>Delete</Button>
                    )}
                  </div>

                  {p.status === 'rejected' && (
                    <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-danger)' }}>Rejected — edit and resubmit from Sell page</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;