import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';

const CATEGORIES = ['Books', 'Electronics', 'Clothing', 'Stationery', 'Sports', 'Other'];
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_IMAGES = 4;

const Sell = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', price: '', category: 'Books' });
  const [imageItems, setImageItems] = useState([]); // [{ base64, preview, name }]
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  // Accumulates new images onto existing selection instead of replacing
  const handleAddImages = async (e) => {
    const newFiles  = Array.from(e.target.files);
    const slotsLeft = MAX_IMAGES - imageItems.length;

    if (slotsLeft <= 0) {
      setError(`Maximum ${MAX_IMAGES} photos allowed.`);
      e.target.value = '';
      return;
    }

    const filesToAdd = newFiles.slice(0, slotsLeft);
    const oversized  = filesToAdd.filter(f => f.size > MAX_IMAGE_BYTES);
    if (oversized.length > 0) {
      setError(`Images exceed 3MB limit: ${oversized.map(f => f.name).join(', ')}`);
      e.target.value = '';
      return;
    }

    setError('');

    const newItems = await Promise.all(filesToAdd.map(file =>
      new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve({ base64: reader.result, preview: reader.result, name: file.name });
        reader.readAsDataURL(file);
      })
    ));

    setImageItems(prev => [...prev, ...newItems]);
    e.target.value = '';
  };

  const removeImage = (i) => setImageItems(prev => prev.filter((_, idx) => idx !== i));

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) errs.price = 'Enter a valid price';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setError('');
    try {
      await api.post('/api/products', { ...form, price: Number(form.price), images: imageItems.map(i => i.base64) });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create listing.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-narrow">
      <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Create Listing</h1>
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
        Your listing goes live after admin review, usually within a few hours.
      </p>

      <div style={{ display: 'flex', gap: '10px', padding: '12px 14px', background: 'var(--color-warning-subtle)', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)', marginBottom: '24px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '1px' }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <p style={{ fontSize: '13px', color: '#92400e', margin: 0, lineHeight: 1.5 }}>
          Once your deal is done, it is <strong>your responsibility</strong> to mark the item as sold or hidden.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input label="Title" name="title" value={form.title} onChange={handleChange}
          placeholder="e.g. Engineering Mathematics textbook (3rd year)" required error={fieldErrors.title} />
        <Input label="Description" name="description" value={form.description} onChange={handleChange}
          placeholder="Condition, edition, year, any damage..." textarea />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input label="Price (₹)" name="price" type="number" value={form.price}
            onChange={handleChange} placeholder="0" required error={fieldErrors.price} />
          <div>
            <label className="label">Category</label>
            <select name="category" value={form.category} onChange={handleChange} className="input" style={{ cursor: 'pointer' }}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Image section */}
        <div>
          <label className="label">
            Photos
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>
              {' '}({imageItems.length}/{MAX_IMAGES}, max 3MB each)
            </span>
          </label>

          {imageItems.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {imageItems.map((item, i) => (
                <div key={i} style={{ position: 'relative', width: '88px', height: '88px' }}>
                  <img src={item.preview} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} />
                  {/* Remove button */}
                  <button onClick={() => removeImage(i)} title="Remove image"
                    style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', background: '#0a0a0a', color: 'white', border: '2px solid white', borderRadius: '50%', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                    ×
                  </button>
                  <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: '10px', fontWeight: 600, padding: '1px 5px', borderRadius: '3px' }}>
                    {i + 1}
                  </span>
                </div>
              ))}

              {/* Add more slot */}
              {imageItems.length < MAX_IMAGES && (
                <label style={{ width: '88px', height: '88px', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '11px', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add
                  <input type="file" accept="image/*" multiple onChange={handleAddImages} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          )}

          {imageItems.length === 0 && (
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '28px', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'var(--color-bg-subtle)', transition: 'border-color 0.15s, background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-bg-subtle)'; }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-text-muted)' }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Click to upload photos</span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Up to {MAX_IMAGES} photos, 3MB each</span>
              <input type="file" accept="image/*" multiple onChange={handleAddImages} style={{ display: 'none' }} />
            </label>
          )}
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--color-danger-subtle)', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}

        <Button fullWidth loading={loading} onClick={handleSubmit}>Submit for Review</Button>
      </div>
    </div>
  );
};

export default Sell;