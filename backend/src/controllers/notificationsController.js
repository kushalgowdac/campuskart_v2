// ============================================================
// controllers/notificationsController.js
// ============================================================
// Handles fetching and managing in-app notifications.
// The actual notification CREATION happens in other controllers:
//   - contactController creates 'interest' notifications for sellers
//   - adminController creates 'approved'/'rejected' notifications for sellers
//   - cleanup job creates 'expiring_soon' notifications
//
// This controller only handles READING and MARKING READ.
// Realtime delivery (WebSocket push) is handled by Supabase automatically
// when any controller inserts into the notifications table.
// ============================================================

import { supabase } from '../db/supabase.js';

// ── getNotifications ──────────────────────────────────────────
// GET /api/notifications
// Returns the logged-in user's notifications, unread first
export const getNotifications = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, title, message, product_id, is_read, created_at')
      .eq('user_id', req.user.id)
      // Order: unread first, then by newest
      // Supabase doesn't support multi-column order with mixed directions in one call easily,
      // so we order by is_read asc (false=0 comes first), then created_at desc
      .order('is_read',    { ascending: true })
      .order('created_at', { ascending: false })
      .limit(50); // Cap at 50 — enough for any user

    if (error) {
      console.error('[getNotifications] error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch notifications.' });
    }

    // Count unread separately for the bell badge in navbar
    const unreadCount = (data || []).filter(n => !n.is_read).length;

    return res.json({
      notifications: data || [],
      unread_count:  unreadCount,
    });
  } catch (err) {
    console.error('[getNotifications] unexpected:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── markAsRead ────────────────────────────────────────────────
// PATCH /api/notifications/:id/read
// Marks a single notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user.id); // Security: can only mark YOUR OWN notifications

    if (error) {
      return res.status(500).json({ error: 'Failed to mark notification as read.' });
    }

    return res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── markAllAsRead ─────────────────────────────────────────────
// PATCH /api/notifications/read-all
// Marks ALL of the user's notifications as read at once
// Triggered when user opens the notification panel
export const markAllAsRead = async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false); // Only update unread ones (skip already-read)

    if (error) {
      return res.status(500).json({ error: 'Failed to mark notifications as read.' });
    }

    return res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};