import { useState, useEffect } from 'react';
import api from '../api';
import Button from '../components/Button';

const Admin = () => {
  const [tab, setTab]             = useState('pending');
  const [pending, setPending]     = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [rejectReason, setRejectReason] = useState({});
  const [actionError, setActionError]   = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pendingRes, analyticsRes] = await Promise.all([
          api.get('/api/admin/products/pending'),
          api.get('/api/admin/analytics'),
        ]);
        setPending(pendingRes.data.items);
        setAnalytics(analyticsRes.data);
      } catch {
        setActionError('Failed to load admin data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const approve = async (id) => {
    setBusyId(id); setActionError('');
    try {
      await api.patch(`/api/admin/products/${id}/approve`);
      setPending(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to approve listing.');
    } finally { setBusyId(null); }
  };

  const reject = async (id) => {
    const reason = rejectReason[id];
    if (!reason || reason.trim().length < 5) {
      setActionError('Please enter a rejection reason (minimum 5 characters).');
      return;
    }
    setBusyId(id); setActionError('');
    try {
      await api.patch(`/api/admin/products/${id}/reject`, { reason });
      setPending(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to reject listing.');
    } finally { setBusyId(null); }
  };

  if (loading) return (
    <div className="page">
      <div className="skeleton" style={{ height: '24px', width: '160px', marginBottom: '24px', borderRadius: '4px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius-lg)' }} />
        ))}
      </div>
    </div>
  );

  const NoImageIcon = () => (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
  );

  return (
    <div className="page">
      <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>Admin Panel</h1>

      {actionError && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--color-danger-subtle)', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '13px', marginBottom: '20px' }}>
          {actionError}
          <button onClick={() => setActionError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', fontSize: '16px', padding: '0 4px' }}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)' }}>
        {['pending', 'analytics'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 500, fontFamily: 'var(--font-sans)',
            borderBottom: tab === t ? '2px solid var(--color-text-primary)' : '2px solid transparent',
            color: tab === t ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            marginBottom: '-1px', textTransform: 'capitalize',
          }}>
            {t === 'pending' ? `Pending (${pending.length})` : 'Analytics'}
          </button>
        ))}
      </div>

      {/* Pending tab */}
      {tab === 'pending' && (
        pending.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 16px', display: 'block' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>All caught up — no pending listings</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {pending.map(p => {
              const isBusy = busyId === p.id;
              return (
                <div key={p.id} className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>

                    {/* Image column — 120px main + thumbnail strip for extras */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, width: '120px' }}>
                      {/* Main image — large enough to actually review */}
                      <div style={{ width: '120px', height: '120px', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                        {p.image_urls?.[0]
                          ? <img src={p.image_urls[0]} alt={p.title} loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                              onClick={() => window.open(p.image_urls[0], '_blank')}
                            />
                          : <NoImageIcon />
                        }
                      </div>
                      {/* Thumbnail strip — only if more than 1 image */}
                      {p.image_urls?.length > 1 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {p.image_urls.slice(1).map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Photo ${i + 2}`}
                              loading="lazy"
                              title="Click to open full size"
                              style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                              onClick={() => window.open(url, '_blank')}
                            />
                          ))}
                        </div>
                      )}
                      {/* Image count badge */}
                      {p.image_urls?.length > 0 && (
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
                          {p.image_urls.length} photo{p.image_urls.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    {/* Content column */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{p.title}</h3>
                      <p className="text-price" style={{ fontSize: '16px', marginBottom: '4px' }}>₹{p.price}</p>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                        {p.category} · {p.seller?.name} ({p.seller?.email})
                      </p>
                      {p.description && (
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                          {p.description}
                        </p>
                      )}

                      {/* Approve / Reject controls */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button
                          variant="primary"
                          loading={isBusy}
                          onClick={() => approve(p.id)}
                          style={{ padding: '7px 16px', fontSize: '13px' }}
                        >
                          Approve
                        </Button>
                        <input
                          placeholder="Rejection reason…"
                          value={rejectReason[p.id] || ''}
                          onChange={e => setRejectReason(prev => ({ ...prev, [p.id]: e.target.value }))}
                          className="input"
                          style={{ flex: 1, minWidth: '160px', padding: '7px 10px', fontSize: '13px' }}
                        />
                        <Button
                          variant="danger"
                          loading={isBusy}
                          onClick={() => reject(p.id)}
                          style={{ padding: '7px 14px', fontSize: '13px' }}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Analytics tab */}
      {tab === 'analytics' && analytics && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Total Users',     value: analytics.users },
              { label: 'Live Listings',   value: analytics.products.live },
              { label: 'Pending Review',  value: analytics.products.pending },
              { label: 'Sold',            value: analytics.products.sold },
              { label: 'Total Interests', value: analytics.total_interests },
            ].map(stat => (
              <div key={stat.label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: 'var(--color-text-secondary)' }}>
            Recent Listings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {analytics.recent_listings.map(p => (
              <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', fontSize: '13px' }}>
                <span style={{ fontWeight: 500 }}>{p.title}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{p.seller?.name} · {p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;