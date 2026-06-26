import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const ContactSeller = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await api.post(`/api/contact/${productId}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load seller info.');
      } finally {
        setLoading(false);
      }
    };
    fetchContact();
  }, [productId]);

  const copyMessage = () => {
    navigator.clipboard.writeText(data.copy_message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>Loading...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '4rem', color: '#dc2626' }}>{error}</div>;

  const { seller, product, copy_message, total_interest } = data;

  const contacts = [
    { label: '✉️ Email', value: seller.email, url: `mailto:${seller.email}`, required: true },
    { label: '📸 Instagram', value: seller.instagram, url: `https://instagram.com/${seller.instagram}` },
    { label: '✈️ Telegram', value: seller.telegram, url: `https://t.me/${seller.telegram}` },
    { label: '🤖 Reddit', value: seller.reddit, url: `https://reddit.com/u/${seller.reddit}` },
    { label: '💼 LinkedIn', value: seller.linkedin, url: `https://linkedin.com/in/${seller.linkedin}` },
  ].filter(c => c.value);

  return (
    <div style={{ maxWidth: '540px', margin: '2rem auto', padding: '1.5rem' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', marginBottom: '1rem', fontSize: '14px' }}>← Back</button>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 700 }}>Contact Seller</h2>
        <p style={{ margin: '0 0 1.5rem', color: '#6b7280', fontSize: '14px' }}>
          {product.title} — ₹{product.price}
          {total_interest > 1 && <span style={{ marginLeft: '8px', color: '#dc2626' }}>🔥 {total_interest} interested</span>}
        </p>

        {/* Copy message */}
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px', marginBottom: '1.5rem' }}>
          <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Copy this message:</p>
          <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#4b5563', lineHeight: 1.6 }}>{copy_message}</p>
          <button
            onClick={copyMessage}
            style={{
              padding: '8px 16px',
              background: copied ? '#059669' : '#1d4ed8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'background 0.2s',
            }}
          >
            {copied ? '✓ Copied!' : 'Copy Message'}
          </button>
        </div>

        {/* Contact buttons */}
        <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>Reach out on:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {contacts.map(c => (
            <a
              key={c.label}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                textDecoration: 'none',
                color: '#111827',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <span>{c.label}</span>
              <span style={{ color: '#6b7280', fontSize: '13px' }}>{c.value} →</span>
            </a>
          ))}
        </div>

        <p style={{ marginTop: '1.5rem', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
          Communication happens outside CampusKart. Always meet in a safe, public place.
        </p>
      </div>
    </div>
  );
};

export default ContactSeller;
