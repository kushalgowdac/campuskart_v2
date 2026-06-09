import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import { mutate } from 'swr';
import api from '../api';

const Admin = () => {
  const [tab, setTab] = useState('pending');
  const [rejectReason, setRejectReason] = useState({});

  const { data: pendingData, error: pendingError, isLoading: pendingLoading } = useFetch('/api/admin/products/pending');
  const { data: analyticsData, error: analyticsError, isLoading: analyticsLoading } = useFetch('/api/admin/analytics');

  const pending = pendingData?.items || [];
  const analytics = analyticsData;
  const loading = pendingLoading || analyticsLoading;

  const approve = async (id) => {
    try {
      await api.patch(`/api/admin/products/${id}/approve`);
      mutate('/api/admin/products/pending');
      mutate('/api/admin/analytics');
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const reject = async (id) => {
    const reason = rejectReason[id];
    if (!reason || reason.trim().length < 5) return alert('Please enter a rejection reason (min 5 chars).');
    try {
      await api.patch(`/api/admin/products/${id}/reject`, { reason });
      mutate('/api/admin/products/pending');
      mutate('/api/admin/analytics');
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return (
    <div className="label-caps" style={{ textAlign: 'center', padding: '6rem', color: 'var(--muted-foreground)' }}>
      RETRIEVING ADMINISTRATIVE DATA...
    </div>
  );

  if (pendingError || analyticsError) return (
    <div className="brutalist-card" style={{ textAlign: 'center', padding: '6rem', color: '#ef4444', borderColor: '#ef4444' }}>
      <span className="label-caps" style={{ color: '#ef4444' }}>FAILED TO LOAD ADMIN DATA. RETRYING...</span>
    </div>
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 className="section-title">ADMINISTRATIVE PORTAL //</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '2.5rem' }}>
        {['pending', 'analytics'].map(t => {
          const active = tab === t;
          const label = t === 'pending' ? `PENDING ITEMS (${pending.length})` : 'ANALYTICS FEED';
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={active ? 'brutalist-btn brutalist-btn-primary' : 'brutalist-btn'}
              style={{
                padding: '0.5rem 1.5rem',
                height: '42px',
                minHeight: '42px',
                fontSize: '0.8rem',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Pending tab */}
      {tab === 'pending' && (
        pending.length === 0 ? (
          <div className="brutalist-card" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✅</div>
            <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>ALL CLEAR</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem', textTransform: 'uppercase' }}>
              NO LISTINGS ARE CURRENTLY AWAITING SYSTEM CLEARANCE.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {pending.map(p => (
              <div key={p.id} className="brutalist-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  {/* Image */}
                  <div style={{ width: '120px', height: '120px', background: '#18181b', border: '2px solid var(--border)', overflow: 'hidden', flexShrink: 0 }}>
                    {p.image_urls?.[0] ? (
                      <img src={p.image_urls[0]} alt={p.title} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>📦</div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <span className="brutalist-badge brutalist-badge-accent" style={{ marginBottom: '0.5rem' }}>
                      {p.category.toUpperCase()}
                    </span>
                    <h3 className="card-title" style={{ fontSize: '1.4rem', margin: '0 0 4px', textTransform: 'uppercase' }}>{p.title}</h3>
                    <p style={{ margin: '0 0 10px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)' }}>₹{p.price}</p>
                    <p className="label-caps" style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem', marginBottom: '1rem' }}>
                      POSTED BY: {p.seller?.name?.toUpperCase()} ({p.seller?.email?.toUpperCase()})
                    </p>
                    {p.description && (
                      <p style={{ margin: '0 0 1.5rem', fontSize: '0.95rem', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>{p.description}</p>
                    )}
                    
                    {/* Decision row */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', borderTop: '2px solid var(--border)', paddingTop: '1.5rem' }}>
                      <button
                        onClick={() => approve(p.id)}
                        className="brutalist-btn brutalist-btn-primary"
                        style={{ padding: '0 1.25rem', height: '38px', minHeight: '38px', fontSize: '0.8rem', background: '#059669', borderColor: '#059669', color: 'white' }}
                      >
                        ✓ APPROVE
                      </button>
                      <input
                        placeholder="REJECTION REASON (MIN 5 CHARS)..."
                        value={rejectReason[p.id] || ''}
                        onChange={e => setRejectReason(prev => ({ ...prev, [p.id]: e.target.value }))}
                        className="brutalist-input"
                        style={{ flex: 1, minWidth: '160px', height: '38px' }}
                      />
                      <button
                        onClick={() => reject(p.id)}
                        className="brutalist-btn brutalist-btn-danger"
                        style={{ padding: '0 1.25rem', height: '38px', minHeight: '38px', fontSize: '0.8rem' }}
                      >
                        ✗ REJECT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Analytics tab */}
      {tab === 'analytics' && analytics && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px', marginBottom: '3rem' }}>
            {[
              { label: 'TOTAL USERS', value: analytics.users, icon: '👥' },
              { label: 'LIVE LISTINGS', value: analytics.products.live, icon: '🟢' },
              { label: 'PENDING REVIEW', value: analytics.products.pending, icon: '⏳' },
              { label: 'SOLD ITEMS', value: analytics.products.sold, icon: '✅' },
              { label: 'TOTAL INTERESTS', value: analytics.total_interests, icon: '👀' },
            ].map(stat => (
              <div key={stat.label} className="brutalist-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{stat.icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.03em' }}>{stat.value}</div>
                <div className="label-caps" style={{ color: 'var(--muted-foreground)', fontSize: '0.7rem', marginTop: '6px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>RECENT USER SUBMISSIONS //</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {analytics.recent_listings.map(p => (
              <div
                key={p.id}
                className="brutalist-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  alignItems: 'center',
                }}
              >
                <span className="label-caps" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.title.toUpperCase()}</span>
                <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  {p.seller?.name} · {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
