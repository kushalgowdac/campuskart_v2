import { useState, useEffect } from 'react';
import api from '../api';

const Admin = () => {
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState({});

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pendingRes, analyticsRes] = await Promise.all([
          api.get('/api/admin/products/pending'),
          api.get('/api/admin/analytics'),
        ]);
        setPending(pendingRes.data.items);
        setAnalytics(analyticsRes.data);
      } catch {}
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const approve = async (id) => {
    try {
      await api.patch(`/api/admin/products/${id}/approve`);
      setPending(prev => prev.filter(p => p.id !== id));
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const reject = async (id) => {
    const reason = rejectReason[id];
    if (!reason || reason.trim().length < 5) return alert('Please enter a rejection reason (min 5 chars).');
    try {
      await api.patch(`/api/admin/products/${id}/reject`, { reason });
      setPending(prev => prev.filter(p => p.id !== id));
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '1.5rem' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>Admin Panel</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
        {['pending', 'analytics'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 500, borderBottom: tab === t ? '2px solid #1d4ed8' : '2px solid transparent',
            color: tab === t ? '#1d4ed8' : '#6b7280', textTransform: 'capitalize',
          }}>{t === 'pending' ? `Pending (${pending.length})` : 'Analytics'}</button>
        ))}
      </div>

      {/* Pending tab */}
      {tab === 'pending' && (
        pending.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem' }}>✅</div>
            <p>All caught up! No pending listings.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {pending.map(p => (
              <div key={p.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div style={{ width: '80px', height: '80px', background: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                    {p.image_urls?.[0]
                      ? <img src={p.image_urls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>📦</div>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600 }}>{p.title}</h3>
                    <p style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: 700, color: '#059669' }}>₹{p.price}</p>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#6b7280' }}>
                      {p.category} · by {p.seller?.name} ({p.seller?.email})
                    </p>
                    {p.description && (
                      <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>{p.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => approve(p.id)} style={{
                        padding: '7px 16px', background: '#059669', color: 'white',
                        border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '13px',
                      }}>✓ Approve</button>
                      <input
                        placeholder="Rejection reason..."
                        value={rejectReason[p.id] || ''}
                        onChange={e => setRejectReason(prev => ({ ...prev, [p.id]: e.target.value }))}
                        style={{ flex: 1, minWidth: '160px', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                      />
                      <button onClick={() => reject(p.id)} style={{
                        padding: '7px 16px', background: '#dc2626', color: 'white',
                        border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '13px',
                      }}>✗ Reject</button>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Users', value: analytics.users, icon: '👥' },
              { label: 'Live Listings', value: analytics.products.live, icon: '🟢' },
              { label: 'Pending Review', value: analytics.products.pending, icon: '⏳' },
              { label: 'Sold', value: analytics.products.sold, icon: '✅' },
              { label: 'Total Interests', value: analytics.total_interests, icon: '👀' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{stat.icon}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#111827' }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: '#374151' }}>Recent Listings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {analytics.recent_listings.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }}>
                <span style={{ fontWeight: 500 }}>{p.title}</span>
                <span style={{ color: '#6b7280' }}>{p.seller?.name} · {p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
