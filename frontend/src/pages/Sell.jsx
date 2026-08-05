import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';
import { compressMultiple } from '../utils/compressImage';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Books', 'Electronics', 'Clothing', 'Stationery', 'Sports', 'Other'];
const MAX_IMAGES = 4;

// No hard size limit per image anymore — compression handles it.
// We still reject files over 20MB because they take too long to
// even load into the browser for compression.
const ABSOLUTE_MAX_BYTES = 20 * 1024 * 1024; // 20MB

const Sell = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [form, setForm]   = useState({ title: '', description: '', price: '', category: 'Books' });
  const [contactForm, setContactForm] = useState({
    instagram:            user?.instagram || '',
    telegram:             user?.telegram || '',
    reddit:               user?.reddit || '',
    linkedin:             user?.linkedin || '',
    other_contact_details: user?.other_contact_details || '',
  });
  const [imageItems, setImageItems] = useState([]); // [{ base64, preview, name, originalKB, compressedKB, savedPercent }]
  const [compressing, setCompressing] = useState(false); // true while canvas is working
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleContactChange = e => {
    setContactForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddImages = async (e) => {
    const newFiles  = Array.from(e.target.files);
    const slotsLeft = MAX_IMAGES - imageItems.length;

    if (slotsLeft <= 0) {
      setError(`Maximum ${MAX_IMAGES} photos allowed.`);
      e.target.value = '';
      return;
    }

    const filesToAdd = newFiles.slice(0, slotsLeft);

    // Only reject truly enormous files (>20MB) — compression handles the rest
    const tooBig = filesToAdd.filter(f => f.size > ABSOLUTE_MAX_BYTES);
    if (tooBig.length > 0) {
      setError(`Some files are too large to process (max 20MB): ${tooBig.map(f => f.name).join(', ')}`);
      e.target.value = '';
      return;
    }

    setError('');
    setCompressing(true); // show "Compressing..." state

    try {
      // Compress all selected images using Canvas API
      // This runs in the browser — no network request
      const results = await compressMultiple(filesToAdd);

      const newItems = results.map((result, i) => ({
        base64:       result.base64,
        preview:      result.base64, // same data URL used for <img src>
        name:         filesToAdd[i].name,
        originalKB:   result.originalKB,
        compressedKB: result.compressedKB,
        savedPercent: result.savedPercent,
      }));

      setImageItems(prev => [...prev, ...newItems]);
    } catch (err) {
      setError(`Failed to process images: ${err.message}`);
    } finally {
      setCompressing(false);
      e.target.value = '';
    }
  };

  const removeImage = (i) => setImageItems(prev => prev.filter((_, idx) => idx !== i));

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      errs.price = 'Enter a valid price';
    if (imageItems.length === 0)
      setError('Please add at least 1 photo so buyers can see what you\'re selling.');
    setFieldErrors(errs);
    return Object.keys(errs).length === 0 && imageItems.length > 0;	
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setError('');
    try {
      // Contact methods belong to the seller's profile so every listing always
      // uses the latest information and future listing forms can pre-fill it.
      const profileRes = await api.put('/api/auth/profile', contactForm);
      login(null, profileRes.data);

      await api.post('/api/products', {
        ...form,
        price:  Number(form.price),
        images: imageItems.map(item => item.base64),
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create listing. Try again.');
    } finally { setLoading(false); }
  };

  // Total size info for the seller
  const totalCompressedKB = imageItems.reduce((sum, item) => sum + item.compressedKB, 0);
  const totalOriginalKB   = imageItems.reduce((sum, item) => sum + item.originalKB, 0);

  return (
    <div className="page-narrow">
      <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Create Listing</h1>
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
        Your listing goes live after admin review, usually within a few hours.
      </p>

      {/* Responsibility notice */}
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
            <select name="category" value={form.category} onChange={handleChange}
              className="input" style={{ cursor: 'pointer' }}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Buyer communication section */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 650, margin: '0 0 5px' }}>
              How buyers can contact you
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.55 }}>
              After a buyer clicks <strong style={{ color: 'var(--color-text-secondary)' }}>“I’m Interested”</strong>, they can see the contact methods below. Communication happens outside CampusKart. Any changes you make here will also be saved to your Profile for future listings.
            </p>
          </div>

          <div>
            <label className="label">Email</label>
            <input value={user?.email || ''} disabled className="input" aria-label="Email" />
            <p className="text-muted" style={{ marginTop: '4px' }}>Provided by your Google account.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
            <Input label="Instagram" name="instagram" value={contactForm.instagram} onChange={handleContactChange} prefix="@" placeholder="username" />
            <Input label="Telegram" name="telegram" value={contactForm.telegram} onChange={handleContactChange} prefix="@" placeholder="username" />
            <Input label="Reddit" name="reddit" value={contactForm.reddit} onChange={handleContactChange} prefix="u/" placeholder="username" />
            <Input label="LinkedIn" name="linkedin" value={contactForm.linkedin} onChange={handleContactChange} prefix="in/" placeholder="profile-slug" />
          </div>

          <Input
            label="Other contact details"
            name="other_contact_details"
            value={contactForm.other_contact_details}
            onChange={handleContactChange}
            placeholder="For example: WhatsApp: 9876543210, Discord: username"
            hint="Optional. Add any other way a buyer can reach you."
            textarea
            rows={2}
            maxLength={500}
          />
        </div>

        {/* Image section */}
        <div>
          <label className="label">
            Photos
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>
              {' '}({imageItems.length}/{MAX_IMAGES} — images are automatically compressed)
            </span>
          </label>

          {/* Selected images */}
          {imageItems.length > 0 && (
            <>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {imageItems.map((item, i) => (
                  <div key={i} style={{ position: 'relative', width: '88px' }}>
                    <div style={{ width: '88px', height: '88px', position: 'relative' }}>
                      <img src={item.preview} alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', display: 'block' }} />
                      {/* Remove button */}
                      <button onClick={() => removeImage(i)} title="Remove"
                        style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', background: '#0a0a0a', color: 'white', border: '2px solid white', borderRadius: '50%', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        ×
                      </button>
                      {/* Image number */}
                      <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: '10px', fontWeight: 600, padding: '1px 5px', borderRadius: '3px' }}>
                        {i + 1}
                      </span>
                    </div>
                    {/* Compression info per image */}
                    {item.savedPercent > 0 && (
                      <p style={{ fontSize: '10px', color: 'var(--color-accent)', margin: '3px 0 0', textAlign: 'center', fontWeight: 500 }}>
                        -{item.savedPercent}%
                      </p>
                    )}
                  </div>
                ))}

                {/* Add more slot */}
                {imageItems.length < MAX_IMAGES && !compressing && (
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

              {/* Total compression summary */}
              {totalOriginalKB > 0 && (
                <div style={{ padding: '8px 12px', background: 'var(--color-accent-subtle)', border: '1px solid #6ee7b7', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Compressed: {totalOriginalKB > 1024 ? `${(totalOriginalKB/1024).toFixed(1)}MB` : `${totalOriginalKB}KB`} → {totalCompressedKB > 1024 ? `${(totalCompressedKB/1024).toFixed(1)}MB` : `${totalCompressedKB}KB`}
                  {' '}({Math.round((1 - totalCompressedKB/totalOriginalKB) * 100)}% smaller)
                </div>
              )}
            </>
          )}

          {/* Compressing state */}
          {compressing && (
            <div style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2"/>
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              Compressing images…
            </div>
          )}

          {/* Initial upload area */}
          {imageItems.length === 0 && !compressing && (
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '28px', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'var(--color-bg-subtle)', transition: 'border-color 0.15s, background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-bg-subtle)'; }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-text-muted)' }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Click to upload photos</span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Up to {MAX_IMAGES} photos · Any size · Automatically compressed
              </span>
              <input type="file" accept="image/*" multiple onChange={handleAddImages} style={{ display: 'none' }} />
            </label>
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
