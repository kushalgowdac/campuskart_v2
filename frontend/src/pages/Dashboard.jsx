import { useNavigate } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { mutate } from 'swr';
import api from '../api';

const STATUS_COLORS = {
  pending:  { border: '#D97706', color: '#F59E0B', label: 'PENDING REVIEW' },
  live:     { border: 'var(--foreground)', color: 'var(--foreground)', label: 'LIVE' },
  hidden:   { border: '#3F3F46', color: '#A1A1AA', label: 'HIDDEN' },
  sold:     { border: '#3F3F46', color: '#A1A1AA', label: 'SOLD' },
  rejected: { border: '#EF4444', color: '#EF4444', label: 'REJECTED' },
  expired:  { border: '#3F3F46', color: '#A1A1AA', label: 'EXPIRED' },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { data, error, isLoading } = useFetch('/api/products/mine');
  const products = data?.items || [];

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/products/${id}/status`, { status });
      mutate('/api/products/mine');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update.');
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('DELETE THIS LISTING PERMANENTLY?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      mutate('/api/products/mine');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete.');
    }
  };

  if (isLoading) return (
    <div className="label-caps" style={{ textAlign: 'center', padding: '6rem', color: 'var(--muted-foreground)' }}>
      RETRIEVING YOUR ACTIVE SPECS...
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div className="brutalist-card" style={{ textAlign: 'center', padding: '6rem', color: '#ef4444', borderColor: '#ef4444' }}>
        <span className="label-caps" style={{ color: '#ef4444' }}>FAILED TO LOAD YOUR LISTINGS. RETRYING...</span>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h1 className="section-title" style={{ margin: 0 }}>MY LISTINGS //</h1>
        <button
          onClick={() => navigate('/sell')}
          className="brutalist-btn brutalist-btn-primary"
          style={{ padding: '0.6rem 1.5rem', height: '44px', minHeight: '44px', display: 'flex', alignItems: 'center' }}
        >
          + CREATE NEW
        </button>
      </div>

      {products.length === 0 ? (
        <div className="brutalist-card" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📦</div>
          <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>NO LISTINGS YET</h3>
          <p className="text-muted" style={{ fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '2rem' }}>
            YOU HAVE NOT POSTED ANY OFFERINGS TO THE COMMERCE INDEX.
          </p>
          <button
            onClick={() => navigate('/sell')}
            className="brutalist-btn brutalist-btn-primary"
            style={{ padding: '0.75rem 2rem' }}
          >
            POST YOUR FIRST LISTING
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {products.map(p => {
            const s = STATUS_COLORS[p.status] || STATUS_COLORS.pending;
            return (
              <div key={p.id} className="brutalist-card" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
                {/* Image */}
                <div style={{ height: '180px', background: '#18181b', position: 'relative', borderBottom: '2px solid var(--border)' }}>
                  {p.image_urls?.[0] ? (
                    <img
                      src={p.image_urls[0]}
                      alt={p.title}
                      loading="lazy"
                      decoding="async"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                      📦
                    </div>
                  )}
                  {/* Interest indicator in corner */}
                  {p.interest_count > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'var(--foreground)',
                      color: 'var(--background)',
                      border: '1px solid var(--border)',
                      padding: '3px 8px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                    }}>
                      🔥 {p.interest_count} INTERESTED
                    </div>
                  )}
                </div>

                {/* Text info */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ marginBottom: '10px' }}>
                      <span className="label-caps" style={{
                        border: `2px solid ${s.border}`,
                        color: s.color,
                        padding: '3px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        display: 'inline-block',
                      }}>
                        {s.label}
                      </span>
                    </div>
                    <h3 className="card-title" style={{ margin: '0 0 6px', textTransform: 'uppercase', fontSize: '1.1rem' }}>
                      {p.title}
                    </h3>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 1.5rem' }}>
                      ₹{p.price}
                    </p>
                  </div>

                  {/* Actions row */}
                  <div style={{
                    borderTop: '2px solid var(--border)',
                    paddingTop: '1rem',
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}>
                    {p.status === 'live' && (
                      <button
                        onClick={() => updateStatus(p.id, 'hidden')}
                        className="brutalist-btn"
                        style={{ flex: 1, fontSize: '0.7rem', padding: '0.4rem', height: '32px', minHeight: '32px' }}
                      >
                        HIDE
                      </button>
                    )}
                    {p.status === 'hidden' && (
                      <button
                        onClick={() => updateStatus(p.id, 'live')}
                        className="brutalist-btn"
                        style={{ flex: 1, fontSize: '0.7rem', padding: '0.4rem', height: '32px', minHeight: '32px' }}
                      >
                        UNHIDE
                      </button>
                    )}
                    {(p.status === 'live' || p.status === 'hidden') && (
                      <button
                        onClick={() => updateStatus(p.id, 'sold')}
                        className="brutalist-btn brutalist-btn-primary"
                        style={{ flex: 1, fontSize: '0.7rem', padding: '0.4rem', height: '32px', minHeight: '32px' }}
                      >
                        MARK SOLD
                      </button>
                    )}
                    {p.status !== 'sold' && (
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="brutalist-btn brutalist-btn-danger"
                        style={{ flex: 1, fontSize: '0.7rem', padding: '0.4rem', height: '32px', minHeight: '32px' }}
                      >
                        DELETE
                      </button>
                    )}
                  </div>

                  {p.status === 'rejected' && (
                    <div style={{
                      border: '2px solid #EF4444',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#EF4444',
                      padding: '8px',
                      marginTop: '8px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      textAlign: 'center',
                    }}>
                      REJECTED — SYSTEM POLICY VIOLATION
                    </div>
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
