import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const CATEGORIES = ['Books', 'Electronics', 'Clothing', 'Stationery', 'Sports', 'Other'];

const Sell = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', description: '', price: '', category: 'Books', notes_to_buyer: '' });
  const [contactForm, setContactForm] = useState({
    instagram:    user?.instagram || '',
    telegram:     user?.telegram || '',
    gmail:        user?.gmail || '',
    reddit:       user?.reddit || '',
    meeting_note: user?.meeting_note || '',
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleContactChange = e => setContactForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const processFiles = useCallback((files) => {
    const remaining = 4 - images.length;
    if (remaining <= 0) return setError('MAX 4 IMAGES ALLOWED.');
    const selected = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, remaining);
    if (selected.length === 0) return;
    const readers = selected.map(file => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    }));
    Promise.all(readers).then(results => {
      setImages(prev => [...prev, ...results]);
      setPreviews(prev => [...prev, ...results]);
      setError('');
    });
  }, [images.length]);

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };
  const handleFileInput = (e) => processFiles(e.target.files);

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.price) return setError('Title and price are required.');
    setLoading(true); setError('');
    try {
      await api.post('/api/products', {
        ...form,
        price: Number(form.price),
        images,
        ...contactForm,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create listing.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '2rem auto', padding: '1.5rem' }}>
      <h1 className="section-title">CREATE LISTING //</h1>
      
      <div style={{
        border: '2px solid #D97706',
        padding: '12px 16px',
        marginBottom: '2rem',
        fontSize: '0.75rem',
        color: '#F59E0B',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
      }}>
        ⚠️ ATTENTION: ONCE YOUR TRANSACTION IS COMPLETED, IT IS YOUR RESPONSIBILITY TO MARK THE LISTING AS SOLD OR HIDDEN.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <label className="label-caps" style={{ marginBottom: '0.5rem', display: 'block' }}>TITLE *</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="E.G. ENGINEERING MATHEMATICS TEXTBOOK"
            className="brutalist-input"
          />
        </div>
        
        <div>
          <label className="label-caps" style={{ marginBottom: '0.5rem', display: 'block' }}>DESCRIPTION</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="SPECIFY CONDITION, EDITION, AND ANY CORRESPONDENCE DETAILS..."
            rows={3}
            className="brutalist-textarea"
            style={{ resize: 'vertical' }}
          />
        </div>

        <div>
          <label className="label-caps" style={{ marginBottom: '0.5rem', display: 'block' }}>NOTES TO BUYER — OPTIONAL</label>
          <textarea
            name="notes_to_buyer"
            value={form.notes_to_buyer}
            onChange={handleChange}
            placeholder="E.G. PREFERS TELEGRAM DM. AVAILABLE 4PM-8PM. MEET AT MAIN GATE OR HOSTEL 3. CASH ONLY."
            rows={3}
            className="brutalist-textarea"
            style={{ resize: 'vertical' }}
          />
          <p className="label-caps" style={{ fontSize: '0.6rem', color: 'var(--muted-foreground)', marginTop: '0.3rem' }}>
            PREFERRED CONTACT METHOD, TIMING, MEETUP SPOT, PAYMENT TERMS — ANYTHING BUYERS SHOULD KNOW
          </p>
        </div>

        {/* Contact Details Section */}
        <div style={{ borderTop: '2px solid var(--border)', paddingTop: '1.5rem' }}>
          <p className="label-caps" style={{ fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 700 }}>
            CONTACT DETAILS — OPTIONAL
          </p>
          <p className="label-caps" style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', marginBottom: '1rem', lineHeight: 1.4 }}>
            FILL IN YOUR CONTACT HANDLES SO BUYERS CAN REACH YOU. THESE WILL BE SAVED TO YOUR PROFILE.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="label-caps" style={{ marginBottom: '0.4rem', display: 'block', fontSize: '0.7rem' }}>📸 INSTAGRAM</label>
              <div style={{ position: 'relative' }}>
                <span className="label-caps" style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', fontSize: '0.9rem', fontWeight: 700 }}>@</span>
                <input name="instagram" value={contactForm.instagram} onChange={handleContactChange} placeholder="USERNAME" className="brutalist-input" style={{ paddingLeft: '20px' }} />
              </div>
            </div>

            <div>
              <label className="label-caps" style={{ marginBottom: '0.4rem', display: 'block', fontSize: '0.7rem' }}>✈️ TELEGRAM</label>
              <div style={{ position: 'relative' }}>
                <span className="label-caps" style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', fontSize: '0.9rem', fontWeight: 700 }}>@</span>
                <input name="telegram" value={contactForm.telegram} onChange={handleContactChange} placeholder="USERNAME" className="brutalist-input" style={{ paddingLeft: '20px' }} />
              </div>
            </div>

            <div>
              <label className="label-caps" style={{ marginBottom: '0.4rem', display: 'block', fontSize: '0.7rem' }}>📧 ALTERNATE EMAIL / GMAIL</label>
              <input name="gmail" value={contactForm.gmail} onChange={handleContactChange} placeholder="you@gmail.com" className="brutalist-input" />
            </div>

            <div>
              <label className="label-caps" style={{ marginBottom: '0.4rem', display: 'block', fontSize: '0.7rem' }}>🤖 REDDIT</label>
              <div style={{ position: 'relative' }}>
                <span className="label-caps" style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', fontSize: '0.9rem', fontWeight: 700 }}>u/</span>
                <input name="reddit" value={contactForm.reddit} onChange={handleContactChange} placeholder="USERNAME" className="brutalist-input" style={{ paddingLeft: '24px' }} />
              </div>
            </div>

            <div>
              <label className="label-caps" style={{ marginBottom: '0.4rem', display: 'block', fontSize: '0.7rem' }}>📍 MEETING PREFERENCE</label>
              <textarea
                name="meeting_note"
                value={contactForm.meeting_note}
                onChange={handleContactChange}
                placeholder="E.G. I USUALLY MEET AT HOSTEL 3 BLOCK. CAMPUS PICKUP ONLY."
                rows={2}
                className="brutalist-textarea"
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{
            border: '2px solid #3B82F6',
            padding: '10px 14px',
            marginTop: '1rem',
            fontSize: '0.7rem',
            color: '#60A5FA',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}>
            ℹ️ TO UPDATE YOUR PROFILE DETAILS ANYTIME, VISIT <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/profile')}>MY PROFILE</span> SECTION.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label className="label-caps" style={{ marginBottom: '0.5rem', display: 'block' }}>PRICE (₹) *</label>
            <input
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              placeholder="0"
              className="brutalist-input"
            />
          </div>
          <div>
            <label className="label-caps" style={{ marginBottom: '0.5rem', display: 'block' }}>CATEGORY</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="brutalist-select"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        {/* Drag and drop image upload */}
        <div>
          <label className="label-caps" style={{ marginBottom: '0.5rem', display: 'block' }}>PHOTOS (MAX 4)</label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--foreground)' : 'var(--border)'}`,
              background: dragging ? 'var(--muted)' : 'transparent',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{dragging ? '📥' : '📷'}</div>
            <p className="label-caps" style={{ fontSize: '0.8rem', margin: '0 0 0.25rem', color: 'var(--foreground)' }}>
              {dragging ? 'DROP IMAGES HERE' : 'DRAG & DROP OR CLICK TO BROWSE'}
            </p>
            <p className="label-caps" style={{ fontSize: '0.65rem', margin: 0, color: 'var(--muted-foreground)' }}>
              {images.length}/4 IMAGES SELECTED
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />

          {/* Image previews with remove */}
          {previews.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '1rem', flexWrap: 'wrap' }}>
              {previews.map((src, i) => (
                <div
                  key={i}
                  style={{
                    width: '80px',
                    height: '80px',
                    border: '2px solid var(--border)',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <img
                    src={src}
                    alt={`Preview ${i}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      width: '20px',
                      height: '20px',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="label-caps" style={{
            color: '#ef4444',
            padding: '0.75rem',
            border: '2px solid #ef4444',
            background: 'rgba(239, 68, 68, 0.1)',
            fontSize: '0.75rem',
            textAlign: 'center',
          }}>
            {error.toUpperCase()}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="brutalist-btn brutalist-btn-primary"
          style={{
            width: '100%',
            height: '50px',
          }}
        >
          {loading ? 'SUBMITTING SPECIFICATIONS...' : 'SUBMIT FOR ADMINISTRATIVE REVIEW'}
        </button>
        
        <p className="label-caps text-muted" style={{ fontSize: '0.7rem', textAlign: 'center', lineHeight: 1.4 }}>
          YOUR OFFER WILL BE REVIEWED BY AN ADMINISTRATOR FOR COMPLIANCE BEFORE GOING LIVE.
        </p>
      </div>
    </div>
  );
};

export default Sell;
