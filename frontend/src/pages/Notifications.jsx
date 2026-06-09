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

  if (loading) return (
    <div className="label-caps" style={{ textAlign: 'center', padding: '6rem', color: 'var(--muted-foreground)' }}>
      RETRIEVING INBOX TELEMETRY...
    </div>
  );

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1.5rem' }}>
      <h1 className="section-title">NOTIFICATIONS //</h1>

      {notifications.length === 0 ? (
        <div className="brutalist-card" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🔔</div>
          <p className="label-caps" style={{ margin: 0 }}>NO INCOMING NOTIFICATIONS</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map(n => {
            const isUnread = !n.is_read;
            return (
              <div
                key={n.id}
                onClick={() => n.product_id && navigate(`/product/${n.product_id}`)}
                className={`brutalist-card ${n.product_id ? 'interactive' : ''}`}
                style={{
                  background: isUnread ? 'var(--foreground)' : 'var(--background)',
                  color: isUnread ? 'var(--background)' : 'var(--foreground)',
                  borderColor: 'var(--border)',
                  cursor: n.product_id ? 'pointer' : 'default',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                  padding: '1.25rem',
                }}
              >
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{ICONS[n.type] || '🔔'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.95rem', textTransform: 'uppercase', color: 'inherit' }}>
                    {n.title}
                  </p>
                  <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'inherit', opacity: 0.9, textTransform: 'uppercase' }}>
                    {n.message}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'inherit', opacity: 0.6, fontWeight: 700 }}>
                    {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
