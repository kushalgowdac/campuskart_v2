import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const ICONS = { interest: '👀', approved: '🎉', rejected: '❌', expiring_soon: '⏰' };

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/api/notifications');
        setNotifications(res.data.notifications);
        // Mark all as read when page opens
        await api.patch('/api/notifications/read-all');
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1.5rem' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>Notifications</h1>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
          <p>No notifications yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => n.product_id && navigate(`/product/${n.product_id}`)}
              style={{
                background: n.is_read ? 'white' : '#eff6ff',
                border: `1px solid ${n.is_read ? '#e5e7eb' : '#bfdbfe'}`,
                borderRadius: '10px',
                padding: '14px 16px',
                cursor: n.product_id ? 'pointer' : 'default',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{ICONS[n.type] || '🔔'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '14px', color: '#111827' }}>{n.title}</p>
                <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#4b5563' }}>{n.message}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                  {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
