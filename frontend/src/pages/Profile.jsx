import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Profile = () => {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    instagram: user?.instagram || '',
    telegram: user?.telegram || '',
    reddit: user?.reddit || '',
    linkedin: user?.linkedin || '',
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
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto', padding: '1.5rem' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>My Profile</h1>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '1.5rem' }}>
        Buyers who click <strong>"I'm Interested"</strong> on your listings can see the
        contact methods you choose to share. Instagram, Telegram, Reddit, and LinkedIn
        are optional—add only the accounts you're comfortable sharing. CampusKart does
        not verify or moderate conversations that happen outside the platform.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={labelStyle}>Name</label>
          <input name="name" value={form.name} onChange={handleChange} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input value={user?.email} disabled style={{ ...inputStyle, background: '#f3f4f6', color: '#6b7280' }} />
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' }}>Email cannot be changed</p>
        </div>
        <div>
          <label style={labelStyle}>Instagram username (optional)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '14px' }}>@</span>
            <input name="instagram" value={form.instagram} onChange={handleChange} placeholder="username" style={{ ...inputStyle, paddingLeft: '28px' }} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Telegram username (optional)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '14px' }}>@</span>
            <input name="telegram" value={form.telegram} onChange={handleChange} placeholder="username" style={{ ...inputStyle, paddingLeft: '28px' }} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Reddit username (optional)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '14px' }}>u/</span>
            <input name="reddit" value={form.reddit} onChange={handleChange} placeholder="username" style={{ ...inputStyle, paddingLeft: '28px' }} />
          </div>
        </div>
          <div>
          <label style={labelStyle}>LinkedIn username (optional)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '14px' }}>in/</span>
            <input name="linkedin" value={form.linkedin} onChange={handleChange} placeholder="username" style={{ ...inputStyle, paddingLeft: '28px' }} />
          </div>
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>{error}</p>}
        {success && <p style={{ color: '#059669', fontSize: '13px', margin: 0 }}>{success}</p>}

        <button onClick={handleSave} disabled={saving} style={{
          padding: '12px', background: saving ? '#93c5fd' : '#1d4ed8',
          color: 'white', border: 'none', borderRadius: '8px',
          fontSize: '15px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
        }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '5px' };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' };

export default Profile;
