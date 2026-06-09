import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Profile = () => {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    name:         user?.name || '',
    instagram:    user?.instagram || '',
    telegram:     user?.telegram || '',
    gmail:        user?.gmail || '',
    reddit:       user?.reddit || '',
    meeting_note: user?.meeting_note || '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await api.put('/api/auth/profile', form);
      login(localStorage.getItem('token'), res.data);
      setSuccess('PROFILE UPDATED SUCCESSFULLY!');
    } catch (err) {
      setError(err.response?.data?.error || 'FAILED TO UPDATE PROFILE.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '2rem auto', padding: '1.5rem' }}>
      <h1 className="section-title">MY PROFILE //</h1>
      <p className="label-caps" style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem', marginBottom: '2.5rem', lineHeight: 1.5 }}>
        YOUR CONTACT DETAILS ARE SHOWN TO BUYERS WHEN THEY DECLARE INTEREST IN YOUR LISTINGS. ONLY FILL IN WHAT YOU'RE COMFORTABLE SHARING.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* ── BASIC INFO ── */}
        <div>
          <label className="label-caps" style={{ marginBottom: '0.5rem', display: 'block' }}>FULL NAME</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="YOUR NAME"
            className="brutalist-input"
          />
        </div>

        <div>
          <label className="label-caps" style={{ marginBottom: '0.5rem', display: 'block' }}>EMAIL ADDRESS</label>
          <input
            value={user?.email || ''}
            disabled
            className="brutalist-input"
            style={{ color: 'var(--muted-foreground)', cursor: 'not-allowed', borderBottom: '2px dashed var(--border)' }}
          />
          <p className="label-caps" style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
            SYSTEM ID — CANNOT BE CHANGED
          </p>
        </div>

        {/* ── SOCIAL HANDLES ── */}
        <div style={{ borderTop: '2px solid var(--border)', paddingTop: '1.5rem' }}>
          <p className="label-caps" style={{ fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 700 }}>
            CONTACT HANDLES — OPTIONAL
          </p>
          <p className="label-caps" style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem', lineHeight: 1.4 }}>
            ADD HANDLES SO BUYERS CAN REACH YOU ON THEIR PREFERRED PLATFORM.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Instagram */}
            <div>
              <label className="label-caps" style={{ marginBottom: '0.4rem', display: 'block', fontSize: '0.7rem' }}>📸 INSTAGRAM</label>
              <div style={{ position: 'relative' }}>
                <span className="label-caps" style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', fontSize: '0.9rem', fontWeight: 700 }}>@</span>
                <input name="instagram" value={form.instagram} onChange={handleChange} placeholder="USERNAME" className="brutalist-input" style={{ paddingLeft: '20px' }} />
              </div>
            </div>

            {/* Telegram */}
            <div>
              <label className="label-caps" style={{ marginBottom: '0.4rem', display: 'block', fontSize: '0.7rem' }}>✈️ TELEGRAM</label>
              <div style={{ position: 'relative' }}>
                <span className="label-caps" style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', fontSize: '0.9rem', fontWeight: 700 }}>@</span>
                <input name="telegram" value={form.telegram} onChange={handleChange} placeholder="USERNAME" className="brutalist-input" style={{ paddingLeft: '20px' }} />
              </div>
            </div>

            {/* Gmail */}
            <div>
              <label className="label-caps" style={{ marginBottom: '0.4rem', display: 'block', fontSize: '0.7rem' }}>📧 ALTERNATE EMAIL / GMAIL</label>
              <input name="gmail" value={form.gmail} onChange={handleChange} placeholder="you@gmail.com" className="brutalist-input" />
            </div>

            {/* Reddit */}
            <div>
              <label className="label-caps" style={{ marginBottom: '0.4rem', display: 'block', fontSize: '0.7rem' }}>🤖 REDDIT</label>
              <div style={{ position: 'relative' }}>
                <span className="label-caps" style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', fontSize: '0.9rem', fontWeight: 700 }}>u/</span>
                <input name="reddit" value={form.reddit} onChange={handleChange} placeholder="USERNAME" className="brutalist-input" style={{ paddingLeft: '24px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── MEETING PREFERENCE ── */}
        <div style={{ borderTop: '2px solid var(--border)', paddingTop: '1.5rem' }}>
          <p className="label-caps" style={{ fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 700 }}>
            MEETING PREFERENCE — OPTIONAL
          </p>
          <p className="label-caps" style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', marginBottom: '1rem', lineHeight: 1.4 }}>
            WHERE DO YOU USUALLY MEET BUYERS? E.G. "HOSTEL 3 BLOCK", "NEAR LIBRARY", "OFF CAMPUS ONLY".
          </p>
          <textarea
            name="meeting_note"
            value={form.meeting_note}
            onChange={handleChange}
            placeholder="E.G. I USUALLY MEET AT HOSTEL 3 BLOCK. CAMPUS PICKUP ONLY."
            rows={2}
            className="brutalist-textarea"
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* ── BUYER PREVIEW ── */}
        <div style={{ borderTop: '2px solid var(--border)', paddingTop: '1.5rem' }}>
          <p className="label-caps" style={{ fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 700 }}>
            PREVIEW — THIS IS WHAT BUYERS WILL SEE
          </p>
          <p className="label-caps" style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', marginBottom: '1rem', lineHeight: 1.4 }}>
            WHEN A BUYER CLICKS "I'M INTERESTED" ON YOUR LISTING, THEY'LL SEE:
          </p>

          <div className="brutalist-card" style={{ background: 'var(--muted)', padding: '1.25rem' }}>
            <p className="label-caps" style={{ margin: '0 0 0.75rem', fontSize: '0.7rem', fontWeight: 700 }}>SELLER CONTACT</p>
            <p style={{ margin: '0 0 0.75rem', fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase' }}>
              👤 {form.name || 'YOUR NAME'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                <span>✉️</span>
                <span style={{ fontWeight: 700, textTransform: 'uppercase', minWidth: '60px' }}>EMAIL:</span>
                <span style={{ color: 'var(--muted-foreground)' }}>{user?.email}</span>
              </div>
              {form.instagram && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                  <span>📸</span>
                  <span style={{ fontWeight: 700, textTransform: 'uppercase', minWidth: '60px' }}>INSTA:</span>
                  <span style={{ color: 'var(--muted-foreground)' }}>@{form.instagram}</span>
                </div>
              )}
              {form.telegram && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                  <span>✈️</span>
                  <span style={{ fontWeight: 700, textTransform: 'uppercase', minWidth: '60px' }}>TG:</span>
                  <span style={{ color: 'var(--muted-foreground)' }}>@{form.telegram}</span>
                </div>
              )}
              {form.gmail && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                  <span>📧</span>
                  <span style={{ fontWeight: 700, textTransform: 'uppercase', minWidth: '60px' }}>GMAIL:</span>
                  <span style={{ color: 'var(--muted-foreground)' }}>{form.gmail}</span>
                </div>
              )}
              {form.reddit && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                  <span>🤖</span>
                  <span style={{ fontWeight: 700, textTransform: 'uppercase', minWidth: '60px' }}>REDDIT:</span>
                  <span style={{ color: 'var(--muted-foreground)' }}>u/{form.reddit}</span>
                </div>
              )}
              {form.meeting_note && (
                <div style={{ marginTop: '0.5rem', padding: '8px', border: '1px dashed var(--border)', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  📍 {form.meeting_note}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="label-caps" style={{
            color: '#ef4444', padding: '0.75rem', border: '2px solid #ef4444',
            background: 'rgba(239, 68, 68, 0.1)', fontSize: '0.75rem', textAlign: 'center', margin: 0,
          }}>
            {error.toUpperCase()}
          </p>
        )}

        {success && (
          <p className="label-caps" style={{
            color: '#34D399', padding: '0.75rem', border: '2px solid #059669',
            background: 'rgba(5, 150, 105, 0.1)', fontSize: '0.75rem', textAlign: 'center', margin: 0,
          }}>
            {success}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="brutalist-btn brutalist-btn-primary"
          style={{ width: '100%', height: '50px', marginTop: '1rem' }}
        >
          {saving ? 'SAVING SPECIFICATIONS...' : 'SAVE PROFILE CHANGES'}
        </button>
      </div>
    </div>
  );
};

export default Profile;
