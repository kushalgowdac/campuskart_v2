import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';

const Setup = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name:      user?.name      || '',
    instagram: user?.instagram || '',
    telegram:  user?.telegram  || '',
    reddit:    user?.reddit    || '',
    linkedin:  user?.linkedin  || '',
    other_contact_details: user?.other_contact_details || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError('Name is required.');
    setSaving(true); setError('');
    try {
      const res = await api.put('/api/auth/profile', { ...form, is_profile_complete: true });
      login(null, res.data);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile.');
    } finally { setSaving(false); }
  };

  const handleSkip = () => navigate('/', { replace: true });

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--color-bg-primary)', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Welcome to CampusKart
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Set up how buyers can reach you when you list items.
          </p>
        </div>

        <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <Input
            label="Your name" name="name" value={form.name} onChange={handleChange} required
            hint="Pre-filled from Google — edit if you'd prefer a shorter name."
          />

          <hr className="divider" style={{ margin: '0' }} />

          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Contact channels
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px', lineHeight: 1.6 }}>
              Only the contact methods you choose to provide will be shared with interested buyers.
              Instagram, Telegram, Reddit, and LinkedIn are completely optional — add only the
              accounts you're comfortable sharing. Communication happens outside CampusKart, so
              please use your judgment and stay safe.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Input label="Instagram" name="instagram" value={form.instagram} onChange={handleChange} prefix="@"   placeholder="username" />
              <Input label="Telegram"  name="telegram"  value={form.telegram}  onChange={handleChange} prefix="@"   placeholder="username" />
              <Input label="Reddit"    name="reddit"    value={form.reddit}    onChange={handleChange} prefix="u/"  placeholder="username" />
              <Input label="LinkedIn"  name="linkedin"  value={form.linkedin}  onChange={handleChange} prefix="in/" placeholder="profile-slug" />
              <Input
                label="Other contact details"
                name="other_contact_details"
                value={form.other_contact_details}
                onChange={handleChange}
                placeholder="For example: WhatsApp: 9876543210, Discord: username"
                textarea
                rows={2}
                maxLength={500}
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 12px', background: 'var(--color-danger-subtle)', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--color-danger)' }}>
              {error}
            </div>
          )}

          <Button fullWidth loading={saving} onClick={handleSubmit}>
            Save & Continue
          </Button>

          <button onClick={handleSkip} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '13px', padding: '4px', fontFamily: 'var(--font-sans)' }}>
            Skip for now — I'll update this in Profile later
          </button>
        </div>
      </div>
    </div>
  );
};

export default Setup;
