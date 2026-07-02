import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';

const CATEGORIES = ['Books', 'Electronics', 'Clothing', 'Stationery', 'Sports', 'Other'];

// Image size validation — critical for the 512MB Render instance.
// base64 encoding inflates binary data by ~33%.
// A 2MB image becomes ~2.7MB of text in the JSON body.
// Four 2MB images = ~11MB POST body — manageable.
// Four 5MB images = ~27MB POST body — risks OOM on Render free tier.
// We cap each image at 3MB before base64 encoding.
const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3MB

const Sell = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', price: '', category: 'Books' });
  const [images, setImages]   = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleImages = async (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    const oversized = files.filter(f => f.size > MAX_IMAGE_BYTES);
    if (oversized.length > 0) {
      setError(`Some images are too large (max 3MB each): ${oversized.map(f => f.name).join(', ')}`);
      return;
    }
    setError('');
    const readers = files.map(file => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    }));
    const results = await Promise.all(readers);
    setImages(results);
    setPreviews(results);
  };

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
      await api.post('/api/products', { ...form, price: Number(form.price), images });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create listing. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-narrow">
      <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Create Listing</h1>
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
        Your listing goes live after admin review, usually within a few hours.
      </p>

      {/* Responsibility notice */}
      <div style={{ display: 'flex', gap: '10px', padding: '12px 14px', background: 'var(--color-warning-subtle)', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)', marginBottom: '24px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '1px' }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <p style={{ fontSize: '13px', color: '#92400e', margin: 0, lineHeight: 1.5 }}>
          Once your deal is done, it is <strong>your responsibility</strong> to mark the item as sold or hidden from your dashboard.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Title" name="title" value={form.title}
          onChange={handleChange} placeholder="e.g. Engineering Mathematics textbook (3rd year)"
          required error={fieldErrors.title}
        />
        <Input
          label="Description" name="description" value={form.description}
          onChange={handleChange} placeholder="Condition, edition, year, any damage..."
          textarea required={false}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input
            label="Price (₹)" name="price" type="number" value={form.price}
            onChange={handleChange} placeholder="0" required error={fieldErrors.price}
          />
          <div>
            <label className="label">Category</label>
            <select
              name="category" value={form.category} onChange={handleChange}
              className="input" style={{ cursor: 'pointer' }}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Image upload */}
        <div>
          <label className="label">Photos <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(max 4, 3MB each)</span></label>
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '8px', padding: '24px', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)',
            cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
            background: 'var(--color-bg-subtle)',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-bg-subtle)'; }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-text-muted)' }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {previews.length > 0 ? `${previews.length} photo${previews.length > 1 ? 's' : ''} selected` : 'Click to upload photos'}
            </span>
            <input type="file" accept="image/*" multiple onChange={handleImages} style={{ display: 'none' }} />
          </label>

          {previews.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={src} alt={`Preview ${i + 1}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} />
                </div>
              ))}
              <button onClick={() => { setImages([]); setPreviews([]); }}
                style={{ width: '80px', height: '80px', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                Clear all
              </button>
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--color-danger-subtle)', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}

        <Button fullWidth loading={loading} onClick={handleSubmit}>
          Submit for Review
        </Button>
      </div>
    </div>
  );
};

export default Sell;