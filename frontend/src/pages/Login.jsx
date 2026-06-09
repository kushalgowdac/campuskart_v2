// ============================================================
// pages/Login.jsx — Login and Register (toggled)
// ============================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    // Computed property name: [e.target.name] dynamically sets the key
    // So if input has name="email", it sets form.email = value
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(''); // clear error on any change
  };

  const handleSubmit = async () => {
    setError('');

    // Basic validation
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
      // res.data = { token, user: { id, name, email, role, ... } }
      login(res.data.token, res.data.user);
      navigate('/'); // redirect to browse page after login
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9fafb',
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🛒</div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#111827' }}>
            CampusKart
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
            {isRegister ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {/* Toggle */}
        <div style={{
          display: 'flex',
          background: '#f3f4f6',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '1.5rem',
        }}>
          {['Login', 'Register'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setIsRegister(tab === 'Register'); setError(''); }}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                background: (tab === 'Register') === isRegister ? 'white' : 'transparent',
                color: (tab === 'Register') === isRegister ? '#111827' : '#6b7280',
                boxShadow: (tab === 'Register') === isRegister ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isRegister && (
            <input
              name="name"
              placeholder="Full name"
              value={form.name}
              onChange={handleChange}
              style={inputStyle}
            />
          )}
          <input
            name="email"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            style={inputStyle}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            style={inputStyle}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* Error message */}
        {error && (
          <p style={{
            color: '#dc2626',
            fontSize: '13px',
            margin: '12px 0 0',
            padding: '8px 12px',
            background: '#fef2f2',
            borderRadius: '6px',
          }}>
            {error}
          </p>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? '#93c5fd' : '#1d4ed8',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '16px',
            transition: 'background 0.15s',
          }}
        >
          {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
        </button>
      </div>
    </div>
  );
};

const inputStyle = {
  padding: '10px 14px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

export default Login;
