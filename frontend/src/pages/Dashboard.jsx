import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';
import { squareThumbnailImage } from '../utils/cloudinaryImage';

const STATUS_STYLES = {
  pending:  { className: 'badge-amber', label: 'Pending Review' },
  live:     { className: 'badge-green', label: 'Live' },
  hidden:   { className: 'badge-gray',  label: 'Hidden' },
  sold:     { className: 'badge-blue',  label: 'Sold' },
  rejected: { className: 'badge-red',   label: 'Rejected' },
  expired:  { className: 'badge-gray',  label: 'Expired' },
};

const Dashboard = () => {
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [busyId, setBusyId]           = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // id of product pending confirm
  const [editingId, setEditingId]     = useState(null);
  const [editForm, setEditForm]       = useState({ price: '', description: '' });
  const [editErrors, setEditErrors]   = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/products/mine')
      .then(res => setProducts(res.data))
      .catch(() => setActionError('Failed to load your listings.'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    setBusyId(id); setActionError(''); setActionNotice('');
    try {
      await api.patch(`/api/products/${id}/status`, { status });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update listing.');
    } finally { setBusyId(null); }
  };

  const deleteProduct = async (id) => {
    setBusyId(id); setActionError(''); setActionNotice(''); setConfirmDelete(null);
    try {
      await api.delete(`/api/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to delete listing.');
    } finally { setBusyId(null); }
  };

  const startEditing = (product) => {
    setEditingId(product.id);
    setEditForm({
      price: String(product.price),
      description: product.description || '',
    });
    setEditErrors({});
    setActionError('');
    setActionNotice('');
    setConfirmDelete(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditErrors({});
  };

  const saveListingDetails = async (event, id) => {
    event.preventDefault();
    const errors = {};
    const numericPrice = Number(editForm.price);

    if (editForm.price.trim() === '' || !Number.isFinite(numericPrice) || numericPrice < 0) {
      errors.price = 'Enter a valid non-negative price.';
    }
    if (editForm.description.trim().length > 2000) {
      errors.description = 'Description must be 2000 characters or fewer.';
    }
    if (Object.keys(errors).length) {
      setEditErrors(errors);
      return;
    }

    setBusyId(id);
    setActionError('');
    setActionNotice('');
    try {
      const res = await api.patch(`/api/products/${id}/details`, {
        price: numericPrice,
        description: editForm.description,
      });
      setProducts(previous => previous.map(product =>
        product.id === id ? { ...product, ...res.data.product } : product
      ));
      setEditingId(null);
      setEditErrors({});
      setActionNotice('Listing updated and sent for admin review.');
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update listing.');
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

      {actionError && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--color-danger-subtle)', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '13px', marginBottom: '20px' }}>
          {actionError}
          <button onClick={() => setActionError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', fontSize: '16px', padding: '0 4px' }}>×</button>
        </div>
      )}

      {actionNotice && (
        <div style={{ padding: '12px 16px', background: 'var(--color-accent-subtle)', border: '1px solid #6ee7b7', borderRadius: 'var(--radius-md)', color: '#065f46', fontSize: '13px', marginBottom: '20px' }}>
          {actionNotice}
        </div>
      )}

      {/* Inline delete confirmation — replaces window.confirm() entirely */}
      {confirmDelete && (
        <div style={{ padding: '14px 16px', background: 'var(--color-warning-subtle)', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
            Delete this listing permanently? This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" style={{ fontSize: '13px', padding: '6px 12px' }} onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busyId === confirmDelete} style={{ fontSize: '13px', padding: '6px 12px' }} onClick={() => deleteProduct(confirmDelete)}>
              Delete
            </Button>
          </div>
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
            const isEditing = editingId === p.id;

            // Extract rejection reason from the notification message stored on the product.
            // The backend stores it in the notifications table — we don't have it directly
            // on the product row. But we can show a generic helpful message pointing to notifications.
            const isRejected = p.status === 'rejected';

            return (
              <div key={p.id} className="card" style={{ padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                {/* Thumbnail */}
                <div style={{ width: '72px', height: '72px', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                  {p.image_urls?.[0]
                    ? <img src={squareThumbnailImage(p.image_urls[0])} alt={p.title} loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => window.open(p.image_urls[0], '_blank')}
                      />
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

                  {!isEditing && p.description && (
                    <p style={{ margin: '0 0 10px', color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                      {p.description}
                    </p>
                  )}

                  {isEditing && (
                    <form onSubmit={event => saveListingDetails(event, p.id)} style={{ padding: '14px', marginBottom: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-subtle)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <Input
                          label="Price (₹)"
                          name="price"
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={editForm.price}
                          error={editErrors.price}
                          onChange={event => {
                            setEditForm(previous => ({ ...previous, price: event.target.value }));
                            setEditErrors(previous => ({ ...previous, price: '' }));
                          }}
                        />
                        <Input
                          label="Description"
                          name="description"
                          textarea
                          rows={3}
                          maxLength={2000}
                          value={editForm.description}
                          error={editErrors.description}
                          onChange={event => {
                            setEditForm(previous => ({ ...previous, description: event.target.value }));
                            setEditErrors(previous => ({ ...previous, description: '' }));
                          }}
                          hint={`${editForm.description.length}/2000 characters`}
                        />
                        <p style={{ margin: 0, color: '#92400e', fontSize: '12px', lineHeight: 1.5 }}>
                          Saving changes temporarily removes this listing from Browse and sends it for admin review again.
                        </p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <Button type="submit" loading={isBusy} style={{ padding: '6px 12px', fontSize: '12px' }}>
                            Save changes
                          </Button>
                          <Button type="button" variant="secondary" disabled={isBusy} onClick={cancelEditing} style={{ padding: '6px 12px', fontSize: '12px' }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Rejection notice — shown inline on the card */}
                  {isRejected && (
                    <div style={{ padding: '10px 12px', background: 'var(--color-danger-subtle)', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--color-danger)', marginBottom: '10px', lineHeight: 1.5 }}>
                      <strong>Not approved.</strong> Check your notifications for the reason.
                      To sell this item, delete this listing and submit a new one with the issue fixed.
                    </div>
                  )}

                  {!isEditing && <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(p.status === 'live' || p.status === 'hidden') && (
                      <Button variant="secondary" disabled={isBusy} onClick={() => startEditing(p)} style={{ padding: '5px 12px', fontSize: '12px' }}>Edit price & description</Button>
                    )}
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
                      <Button variant="danger" loading={isBusy} onClick={() => { setConfirmDelete(p.id);   window.scrollTo({ top: 0, behavior: 'smooth' }); } }style={{ padding: '5px 12px', fontSize: '12px' }}>Delete</Button>
                    )}
                  </div>}
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
