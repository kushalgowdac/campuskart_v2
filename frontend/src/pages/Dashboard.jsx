import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const STATUS_COLORS = {
  pending:  { bg: '#fffbeb', color: '#92400e', label: 'Pending Review' },
  live:     { bg: '#f0fdf4', color: '#166534', label: 'Live' },
  hidden:   { bg: '#f3f4f6', color: '#374151', label: 'Hidden' },
  sold:     { bg: '#eff6ff', color: '#1e40af', label: 'Sold' },
  rejected: { bg: '#fef2f2', color: '#991b1b', label: 'Rejected' },
  expired:  { bg: '#f3f4f6', color: '#6b7280', label: 'Expired' },
};

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/products/mine')
      .then(res => setProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/products/${id}/status`, { status });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update.');
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this listing permanently?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete.');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>My Listings</h1>
        <button onClick={() => navigate('/sell')} style={{ padding: '8px 16px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
          + New Listing
        </button>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <p>No listings yet. <a href="/sell" style={{ color: '#1d4ed8' }}>Create one!</a></p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {products.map(p => {
            const s = STATUS_COLORS[p.status] || STATUS_COLORS.pending;
            return (
              <div key={p.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                {/* Image */}
                <div style={{ width: '72px', height: '72px', background: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                  {p.image_urls?.[0]
                    ? <img src={p.image_urls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📦</div>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</h3>
                    <span style={{ background: s.bg, color: s.color, fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500, flexShrink: 0 }}>{s.label}</span>
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 700, color: '#059669' }}>₹{p.price}</p>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {p.status === 'live' && (
                      <button onClick={() => updateStatus(p.id, 'hidden')} style={btnStyle('#f3f4f6', '#374151')}>Hide</button>
                    )}
                    {p.status === 'hidden' && (
                      <button onClick={() => updateStatus(p.id, 'live')} style={btnStyle('#f0fdf4', '#166534')}>Unhide</button>
                    )}
                    {(p.status === 'live' || p.status === 'hidden') && (
                      <button onClick={() => updateStatus(p.id, 'sold')} style={btnStyle('#eff6ff', '#1e40af')}>Mark Sold</button>
                    )}
                    {p.status !== 'sold' && (
                      <button onClick={() => deleteProduct(p.id)} style={btnStyle('#fef2f2', '#991b1b')}>Delete</button>
                    )}
                  </div>

                  {p.status === 'rejected' && (
                    <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#991b1b' }}>Rejected — edit and resubmit</p>
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

const btnStyle = (bg, color) => ({
  padding: '5px 12px', background: bg, color, border: 'none',
  borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
});

export default Dashboard;
