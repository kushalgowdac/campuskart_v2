import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Button from '../components/Button';
import Input from '../components/Input';

const Profile = () => {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    name:      user?.name      || '',
    instagram: user?.instagram || '',
    telegram:  user?.telegram  || '',
    reddit:    user?.reddit    || '',
    linkedin:  user?.linkedin  || '',
    other_contact_details: user?.other_contact_details || '',
  });
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Name is required.');
    setSaving(true); setError(''); setSuccess(false);
    try {
      const res = await api.put('/api/auth/profile', form);
      login(localStorage.getItem('token'), res.data);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally { setSaving(false); }
  };

  return (
    <div className="page-narrow">
      <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Profile</h1>
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
        Buyers see your contact info when they click "I'm Interested" on your listings.
      </p>

      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <Input label="Display name" name="name" value={form.name} onChange={handleChange} required />

        <div>
          <label className="label">Email</label>
          <input value={user?.email} disabled className="input" />
          <p className="text-muted" style={{ marginTop: '4px' }}>Email is set by your Google account and cannot be changed here.</p>
        </div>

        <hr className="divider" style={{ margin: '0' }} />

        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
            Contact channels
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px', lineHeight: 1.6 }}>
            Buyers who click <strong style={{ color: 'var(--color-text-secondary)' }}>"I'm Interested"</strong> on your listings can see the
            contact methods you choose to share. Instagram, Telegram, Reddit, and LinkedIn
            are optional — add only the accounts you're comfortable sharing. CampusKart does
            not verify or moderate conversations that happen outside the platform.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Input label="Instagram" name="instagram" value={form.instagram} onChange={handleChange} prefix="@" placeholder="username" />
            <Input label="Telegram"  name="telegram"  value={form.telegram}  onChange={handleChange} prefix="@" placeholder="username" />
            <Input label="Reddit"    name="reddit"    value={form.reddit}    onChange={handleChange} prefix="u/" placeholder="username" />
            <Input label="LinkedIn"  name="linkedin"  value={form.linkedin}  onChange={handleChange} prefix="in/" placeholder="your-profile-slug" />
            <Input
              label="Other contact details"
              name="other_contact_details"
              value={form.other_contact_details}
              onChange={handleChange}
              placeholder="For example: WhatsApp: 9876543210, Discord: username"
              hint="Optional. Add any other way a buyer can reach you."
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

        {success && (
          <div style={{ padding: '10px 12px', background: 'var(--color-accent-subtle)', border: '1px solid #6ee7b7', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Profile saved successfully.
          </div>
        )}

        <Button fullWidth loading={saving} onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default Profile;
