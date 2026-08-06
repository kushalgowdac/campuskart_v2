// ============================================================
// jobs/cleanup.js — Background job for expired listings
// ============================================================
// A "job" is code that runs on a schedule, not triggered by an HTTP request.
// This job runs once when the server starts, then every 24 hours.
//
// What it does:
//   1. Every day: finds products expiring in 7 days → notifies sellers
//   2. Every day: finds products past 90 days → deletes them fully
//      (DB row + Cloudinary images)
//
// WHY do we need this?
// Without cleanup, the DB fills up with dead listings forever.
// Sold items stay visible in Closed deals until the same original
// 90-day expiry, then their database row and images are removed too.
// ============================================================

import { supabase } from '../db/supabase.js';
import { deleteMultiple } from '../utils/cloudinary.js';

// ── notifyExpiringSoon ────────────────────────────────────────
// Finds products expiring within the next 7 days (but not already expired)
// and sends the seller a reminder notification.
// We check 'expiring_soon' type to avoid duplicate notifications.
const notifyExpiringSoon = async () => {
  const now       = new Date();
  const in7days   = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000);

  // Find live/hidden/pending products expiring in the next 7 days
  const { data: expiringSoon } = await supabase
    .from('products')
    .select('id, title, seller_id, expires_at')
    .in('status', ['live', 'hidden', 'pending'])
    .lte('expires_at', in7days.toISOString())  // expires_at <= 7 days from now
    .gte('expires_at', now.toISOString());      // expires_at >= now (not already expired)

  if (!expiringSoon || expiringSoon.length === 0) return;

  for (const product of expiringSoon) {
    // Check if we already sent an expiring_soon notification for this product
    // to avoid spamming the seller every day
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', product.id)
      .eq('type', 'expiring_soon');

    if (count === 0) {
      const daysLeft = Math.ceil(
        (new Date(product.expires_at) - now) / (1000 * 60 * 60 * 24)
      );

      await supabase.from('notifications').insert({
        user_id:    product.seller_id,
        type:       'expiring_soon',
        title:      '⏰ Listing expiring soon',
        message:    `Your listing "${product.title}" will be automatically deleted in ${daysLeft} day(s). If it has sold, mark it as sold so it appears in Closed deals until then.`,
        product_id: product.id,
      });

      console.log(`[Cleanup] Sent expiry warning for product ${product.id} (${daysLeft} days left)`);
    }
  }
};

// ── deleteExpiredProducts ─────────────────────────────────────
// Finds products past their expires_at date and fully removes them.
const deleteExpiredProducts = async () => {
  const now = new Date();

  const { data: expired, error } = await supabase
    .from('products')
    .select('id, title, public_ids')
    .in('status', ['live', 'hidden', 'pending', 'rejected', 'sold'])
    .lt('expires_at', now.toISOString()); // expires_at < now

  if (error) {
    throw new Error(`Could not fetch expired products: ${error.message}`);
  }

  if (!expired || expired.length === 0) {
    console.log('[Cleanup] No expired products found.');
    return;
  }

  console.log(`[Cleanup] Found ${expired.length} expired products.`);

  for (const product of expired) {
    try {
      // 1. Delete Cloudinary images
      if (product.public_ids?.length > 0) {
        await deleteMultiple(product.public_ids);
        console.log(`[Cleanup] Deleted ${product.public_ids.length} Cloudinary images for product ${product.id}`);
      }

      // 2. Update status to 'expired' (soft delete first, then hard delete)
      // Soft delete: mark as expired so it disappears from browse immediately
      // Hard delete: remove the row entirely
      await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      // CASCADE in schema handles:
      // - contact_requests with this product_id → deleted
      // - notifications with this product_id → product_id set to null (notification stays)

      console.log(`[Cleanup] Deleted expired product: "${product.title}" (${product.id})`);
    } catch (err) {
      console.error(`[Cleanup] Failed to delete product ${product.id}:`, err.message);
      // Continue with other products even if one fails
    }
  }
};

// ── runCleanup ────────────────────────────────────────────────
const runCleanup = async () => {
  console.log('[Cleanup] Running daily cleanup job...');
  try {
    await notifyExpiringSoon();
    await deleteExpiredProducts();
    console.log('[Cleanup] Daily cleanup complete.');
  } catch (err) {
    console.error('[Cleanup] Job failed:', err.message);
  }
};

// ── startCleanupJob ───────────────────────────────────────────
// Called once from app.js when the server starts.
// setInterval runs the function repeatedly every 24 hours.
// 24 * 60 * 60 * 1000 = milliseconds in a day.
export const startCleanupJob = () => {
  console.log('[Cleanup] Scheduling daily cleanup job...');
  runCleanup();
  setInterval(runCleanup, 24 * 60 * 60 * 1000);

  // Keep Supabase active — ping every 4 days
  // Free tier pauses after ~7 days of inactivity
  setInterval(async () => {
    try {
      await supabase.from('users').select('id').limit(1);
      console.log('[Keepalive] Supabase pinged successfully');
    } catch (err) {
      console.error('[Keepalive] Ping failed:', err.message);
    }
  }, 4 * 24 * 60 * 60 * 1000); // every 4 days
};
