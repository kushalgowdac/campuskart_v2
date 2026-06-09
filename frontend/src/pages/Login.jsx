import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(''); // clear error on any change
  };

  const handleSubmit = async () => {
    setError('');

    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }
    if (isRegister && !form.name) {
      setError('Name is required.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const res = await api.post(endpoint, payload);
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 70px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background)',
      padding: '2rem 1rem',
    }}>
      <div className="brutalist-card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem 2rem',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <h1 className="card-title" style={{ fontSize: '1.8rem', marginBottom: '0.25rem', letterSpacing: '-0.04em' }}>
            CAMPUSKART //
          </h1>
          <p className="label-caps" style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>
            {isRegister ? 'CREATE AN ACCOUNT' : 'AUTHENTICATE SESSION'}
          </p>
        </div>

        {/* Toggle */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '2rem',
        }}>
          {['Login', 'Register'].map((tab) => {
            const active = (tab === 'Register') === isRegister;
            return (
              <button
                key={tab}
                onClick={() => { setIsRegister(tab === 'Register'); setError(''); }}
                className={active ? 'brutalist-btn brutalist-btn-primary' : 'brutalist-btn'}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  height: '40px',
                  minHeight: '40px',
                  fontSize: '0.8rem',
                }}
              >
                {tab.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {isRegister && (
            <div>
              <label className="label-caps" style={{ marginBottom: '0.25rem', display: 'block' }}>FULL NAME</label>
              <input
                name="name"
                placeholder="YOUR NAME"
                value={form.name}
                onChange={handleChange}
                className="brutalist-input"
              />
            </div>
          )}
          <div>
            <label className="label-caps" style={{ marginBottom: '0.25rem', display: 'block' }}>EMAIL ADDRESS</label>
            <input
              name="email"
              type="email"
              placeholder="ENTER EMAIL"
              value={form.email}
              onChange={handleChange}
              className="brutalist-input"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div>
            <label className="label-caps" style={{ marginBottom: '0.25rem', display: 'block' }}>PASSWORD</label>
            <input
              name="password"
              type="password"
              placeholder="ENTER PASSWORD"
              value={form.password}
              onChange={handleChange}
              className="brutalist-input"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="label-caps" style={{
            color: '#ef4444',
            margin: '1.5rem 0 0',
            padding: '0.75rem',
            border: '2px solid #ef4444',
            background: 'rgba(239, 68, 68, 0.1)',
            fontSize: '0.75rem',
            textAlign: 'center',
          }}>
            {error.toUpperCase()}
          </p>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="brutalist-btn brutalist-btn-primary"
          style={{
            width: '100%',
            marginTop: '2rem',
            height: '50px',
          }}
        >
          {loading ? 'PROCESSING...' : isRegister ? 'CREATE ACCOUNT' : 'LOGIN'}
        </button>
      </div>
    </div>
  );
};

export default Login;
