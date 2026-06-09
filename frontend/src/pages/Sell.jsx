import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CATEGORIES = ['Books', 'Electronics', 'Clothing', 'Stationery', 'Sports', 'Other'];

const Sell = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', price: '', category: 'Books' });
  const [images, setImages] = useState([]); // base64 strings
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    const readers = files.map(file => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    }));
    Promise.all(readers).then(results => {
      setImages(results);
      setPreviews(results);
    });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.price) return setError('Title and price are required.');
    setLoading(true); setError('');
    try {
      await api.post('/api/products', { ...form, price: Number(form.price), images });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create listing.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1.5rem' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>Create Listing</h1>
      <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '10px 14px', marginBottom: '1.5rem', fontSize: '13px', color: '#92400e' }}>
        ⚠️ Once your deal is done, it is <strong>your responsibility</strong> to mark the item as sold or hidden.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={labelStyle}>Title *</label>
          <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Engineering Mathematics textbook" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Condition, edition, any notes..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Price (₹) *</label>
            <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="0" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select name="category" value={form.category} onChange={handleChange} style={inputStyle}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Photos (max 4)</label>
          <input type="file" accept="image/*" multiple onChange={handleImages} style={{ fontSize: '13px' }} />
          {previews.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
              {previews.map((src, i) => (
                <img key={i} src={src} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              ))}
            </div>
          )}
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading} style={{
          padding: '12px', background: loading ? '#93c5fd' : '#1d4ed8', color: 'white',
          border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Submitting...' : 'Submit for Review'}
        </button>
        <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', margin: 0 }}>
          Your listing will be reviewed by an admin before going live.
        </p>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '5px' };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' };

export default Sell;
