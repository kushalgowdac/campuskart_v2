// ============================================================
// controllers/adminController.js — Admin moderation panel
// ============================================================
// All routes here are protected by BOTH verifyToken AND requireAdmin.
// Regular users who somehow reach these routes get a 403 Forbidden.
//
// Responsibilities:
//   GET  /api/admin/products/pending  → list products awaiting review
//   GET  /api/admin/products/all      → all products with filters
//   PATCH /api/admin/products/:id/approve → approve → status = live
//   PATCH /api/admin/products/:id/reject  → reject  → status = rejected
//   GET  /api/admin/analytics         → dashboard stats
// ============================================================

import { supabase } from '../db/supabase.js';

// ── getPendingProducts ────────────────────────────────────────
// GET /api/admin/products/pending
// Returns all products with status = 'pending', newest first
// Admin reviews these and approves or rejects each one
export const getPendingProducts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, title, description, price, category,
        image_urls, status, created_at,
        seller:seller_id (
          id, name, email
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true }); // Oldest pending first (review queue)

    if (error) {
      console.error('[getPendingProducts] error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch pending listings.' });
    }

    return res.json({ count: (data || []).length, items: data || [] });
  } catch (err) {
    console.error('[getPendingProducts] unexpected:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── getAllProducts ────────────────────────────────────────────
// GET /api/admin/products/all?status=live
// Admin can see ALL products regardless of status, with optional filter
export const getAllProducts = async (req, res) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('products')
      .select(`
        id, title, price, category, status, created_at, expires_at,
        seller:seller_id ( id, name, email )
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch products.' });
    }

    return res.json({ count: (data || []).length, items: data || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── approveProduct ────────────────────────────────────────────
// PATCH /api/admin/products/:id/approve
// Sets status = 'live' and records which admin approved it.
// Sends a notification to the seller.
export const approveProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch product to get seller_id and title (needed for notification)
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, title, seller_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Can only approve pending products
    if (product.status !== 'pending') {
      return res.status(400).json({
        error: `Product is not pending. Current status: ${product.status}`
      });
    }

    // ── Update product status ──
    const { error: updateError } = await supabase
      .from('products')
      .update({
        status:      'live',
        approved_by: req.user.id,  // Track which admin approved — audit trail
      })
      .eq('id', id);

    if (updateError) {
      console.error('[approveProduct] update error:', updateError.message);
      return res.status(500).json({ error: 'Failed to approve product.' });
    }

    // ── Notify the seller ──
    // This INSERT into notifications triggers Supabase Realtime →
    // seller's browser gets a WebSocket push instantly
    await supabase.from('notifications').insert({
      user_id:    product.seller_id,
      type:       'approved',
      title:      'Your listing is live',
      message:    `"${product.title}" has been approved and is now visible to buyers.`,
      product_id: product.id,
    });

    return res.json({
      message: 'Product approved and is now live.',
      product_id: id
    });
  } catch (err) {
    console.error('[approveProduct] unexpected:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── rejectProduct ─────────────────────────────────────────────
// PATCH /api/admin/products/:id/reject
// Body: { reason: 'Why it was rejected' }
// Sets status = 'rejected'. Notifies seller with the reason.
export const rejectProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        error: 'A rejection reason is required (min 5 characters). The seller needs to know why.'
      });
    }

    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, title, seller_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (product.status !== 'pending') {
      return res.status(400).json({
        error: `Only pending products can be rejected. Current status: ${product.status}`
      });
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({
        status:      'rejected',
        approved_by: req.user.id,
      })
      .eq('id', id);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to reject product.' });
    }

    // Notify seller with the rejection reason
    await supabase.from('notifications').insert({
      user_id:    product.seller_id,
      type:       'rejected',
      title:      'Listing not approved',
      message:    `"${product.title}" was not approved. Reason: ${reason.trim()}.`,
      product_id: product.id,
    });

    return res.json({
      message: 'Product rejected. Seller has been notified.',
      product_id: id
    });
  } catch (err) {
    console.error('[rejectProduct] unexpected:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── getAnalytics ──────────────────────────────────────────────
// GET /api/admin/analytics
// Returns dashboard stats: user count, products by status, recent activity
// This is what the admin dashboard home page shows
export const getAnalytics = async (req, res) => {
  try {
    // Run all count queries in PARALLEL using Promise.all
    // Instead of waiting for each one sequentially (slow),
    // they all run at the same time. Total time = slowest single query.
    const [
      usersResult,
      pendingResult,
      liveResult,
      soldResult,
      recentProducts,
      interestResult,
    ] = await Promise.all([
      // Total registered users
      supabase.from('users').select('*', { count: 'exact', head: true }),
      // Products by status
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'live'),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
      // 5 most recent listings (for activity feed)
      supabase.from('products')
        .select('id, title, status, created_at, seller:seller_id(name)')
        .order('created_at', { ascending: false })
        .limit(5),
      // Total contact requests (buyer interest signals)
      supabase.from('contact_requests').select('*', { count: 'exact', head: true }),
    ]);

    return res.json({
      users:            usersResult.count  || 0,
      products: {
        pending:        pendingResult.count || 0,
        live:           liveResult.count    || 0,
        sold:           soldResult.count    || 0,
      },
      total_interests:  interestResult.count || 0,
      recent_listings:  recentProducts.data  || [],
    });
  } catch (err) {
    console.error('[getAnalytics] error:', err.message);
    return res.status(500).json({ error: 'Failed to load analytics.' });
  }
};