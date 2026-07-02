import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const ICONS = {
  interest:      { icon: '👀', badge: 'badge-gray' },
  approved:      { icon: '✓',  badge: 'badge-green' },
  rejected:      { icon: '✕',  badge: 'badge-red'   },
  expiring_soon: { icon: '!',  badge: 'badge-amber' },
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Named async function to avoid shadowing window.fetch
    const loadNotifications = async () => {
      try {
        const res = await api.get('/api/notifications');
        setNotifications(res.data.notifications);
        await api.patch('/api/notifications/read-all');
      } catch {}
      finally { setLoading(false); }
    };
    loadNotifications();
  }, []);

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) return (
    <div className="page-narrow">
      <div className="skeleton" style={{ height: '24px', width: '160px', marginBottom: '24px', borderRadius: '4px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '72px', borderRadius: 'var(--radius-md)' }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="page-narrow">
      <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Notifications</h1>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 16px', display: 'block' }}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>No notifications yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {notifications.map(n => {
            const meta = ICONS[n.type] || ICONS.approved;
            return (
              <div
                key={n.id}
                onClick={() => n.product_id && navigate(`/product/${n.product_id}`)}
                style={{
                  display: 'flex', gap: '14px', alignItems: 'flex-start',
                  padding: '14px 16px',
                  background: n.is_read ? 'white' : 'var(--color-bg-subtle)',
                  border: `1px solid ${n.is_read ? 'var(--color-border)' : 'var(--color-border-strong)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: n.product_id ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (n.product_id) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = n.is_read ? 'white' : 'var(--color-bg-subtle)'; }}
              >
                {/* Icon badge */}
                <div className={`badge ${meta.badge}`} style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, padding: 0 }}>
                  {meta.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: n.is_read ? 400 : 600, color: 'var(--color-text-primary)', margin: '0 0 2px', lineHeight: 1.4 }}>
                    {n.title}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 4px', lineHeight: 1.5 }}>
                    {n.message}
                  </p>
                  <p className="text-muted">{timeAgo(n.created_at)}</p>
                </div>

                {!n.is_read && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-text-primary)', flexShrink: 0, marginTop: '6px' }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;