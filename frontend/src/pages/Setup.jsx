import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Setup = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:      user?.name      || '',
    instagram: user?.instagram || '',
    telegram:  user?.telegram  || '',
    reddit:    user?.reddit    || '',
    linkedin:  user?.linkedin  || '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError('Name is required.');
    setSaving(true); setError('');
    try {
      const res = await api.put('/api/auth/profile', {
        ...form,
        is_profile_complete: true,
      });
      login(null, res.data); // update AuthContext with new profile
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => navigate('/', { replace: true });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: '1.5rem' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e5e7eb', width: '100%', maxWidth: '480px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👋</div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 700 }}>Welcome to CampusKart!</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            Set up your profile so buyers can contact you when you list items.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          <div>
            <label style={labelStyle}>Your name *</label>
            <input name="name" value={form.name} onChange={handleChange}
              placeholder="How you want to appear to buyers"
              style={inputStyle} />
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
              Pre-filled from your Google account — edit if you prefer a shorter name.
            </p>
          </div>

          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '14px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
              Contact channels <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
            </p>
                <div
                    style={{
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        marginBottom: '14px',
                        fontSize: '12px',
                        color: '#6b7280',
                        lineHeight: 1.5,
                    }}
                    >
                    Only the contact methods you choose to provide will be shared with interested buyers.
                    Instagram, Telegram, Reddit, and LinkedIn are completely optional—add only the
                    accounts you're comfortable sharing. Communication happens outside CampusKart, so
                    please use your judgment and stay safe.
            </div>
            {[
              { name: 'instagram', label: 'Instagram', prefix: '@',   placeholder: 'username' },
              { name: 'telegram',  label: 'Telegram',  prefix: '@',   placeholder: 'username' },
              { name: 'reddit',    label: 'Reddit',    prefix: 'u/',  placeholder: 'username' },
              { name: 'linkedin',  label: 'LinkedIn',  prefix: 'in/', placeholder: 'your-profile-url-slug' },
            ].map(field => (
              <div key={field.name} style={{ marginBottom: '10px' }}>
                <label style={labelStyle}>{field.label}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '13px', pointerEvents: 'none' }}>
                    {field.prefix}
                  </span>
                  <input
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    style={{ ...inputStyle, paddingLeft: field.prefix.length > 1 ? '36px' : '28px' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {error && <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>{error}</p>}

          <button onClick={handleSubmit} disabled={saving} style={{
            padding: '12px', background: saving ? '#93c5fd' : '#1d4ed8',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '15px', fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>

          <button onClick={handleSkip} style={{
            padding: '10px', background: 'none', border: 'none',
            color: '#9ca3af', fontSize: '13px', cursor: 'pointer',
          }}>
            Skip for now (you can add this later in Profile)
          </button>
        </div>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '5px' };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' };

export default Setup;