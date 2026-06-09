import { supabase } from '../db/supabase.js';
import {
  AppError,
  asyncHandler,
  buildPaginationMeta,
  parsePagination,
  sendSuccess,
} from '../utils/http.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, from, to } = parsePagination(req.query);

  const { data, error, count } = await supabase
    .from('notifications')
    .select('id, type, title, message, product_id, is_read, created_at', { count: 'exact' })
    .eq('user_id', req.user.id)
    .order('is_read', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new AppError('Failed to fetch notifications.', 500, error.message);
  }

  const unreadCount = (data || []).filter((item) => !item.is_read).length;

  return sendSuccess(res, {
    message: 'Notifications fetched successfully.',
    data: data || [],
    meta: {
      unreadCount,
      pagination: buildPaginationMeta({ page, limit, total: count || 0 }),
    },
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select('id, type, title, message, product_id, is_read, created_at')
    .maybeSingle();

  if (error) {
    throw new AppError('Failed to mark notification as read.', 500, error.message);
  }

  if (!data) {
    throw new AppError('Notification not found.', 404);
  }

  return sendSuccess(res, {
    message: 'Notification marked as read.',
    data,
  });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', req.user.id)
    .eq('is_read', false);

  if (error) {
    throw new AppError('Failed to mark notifications as read.', 500, error.message);
  }

  return sendSuccess(res, {
    message: 'All notifications marked as read.',
    data: null,
  });
});
