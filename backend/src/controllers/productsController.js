// ============================================================
// controllers/productsController.js — All product operations
// ============================================================
// This controller handles everything about products:
//   GET    /api/products          → browse live products (public)
//   GET    /api/products/mine     → seller's own listings
//   GET    /api/products/:id      → single product detail
//   POST   /api/products          → create listing
//   PUT    /api/products/:id      → edit own listing
//   PATCH  /api/products/:id/status → mark sold/hidden
//   DELETE /api/products/:id      → delete own listing
//
// KEY DESIGN DECISION:
// We use Supabase JS SDK directly — NO SQL shim, NO raw SQL strings.
// supabase.from('products').select('*').eq('status','live')
// is cleaner, type-safe, and handles JOINs properly via
// Supabase's "foreign table" syntax.
//
// HOW Supabase joins work:
// Instead of SQL "JOIN users ON products.seller_id = users.id",
// Supabase lets you write: select('*, seller:users(name,email,instagram,telegram,reddit)')
// It follows the foreign key relationship automatically.
// ============================================================

import { supabase } from '../db/supabase.js';
import { uploadMultiple, deleteMultiple } from '../utils/cloudinary.js';

// ── listProducts ─────────────────────────────────────────────
// GET /api/products?category=Books&q=chemistry&limit=20&offset=0
// Public — no auth needed. Only returns 'live' products.
// Supports: category filter, text search, price sort, pagination
export const listProducts = async (req, res) => {
  try {
    const { category, q, sort, limit = 20, offset = 0 } = req.query;
    const safeLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 50);
    const safeOffset = Math.max(parseInt(offset) || 0, 0);

    let query = supabase
      .from('products')
      .select(`
        id, title, description, price, category,
        image_urls, status, created_at, expires_at, notes_to_buyer,
        seller:seller_id (
          id, name, email, instagram, telegram, reddit, gmail, meeting_note
        )
      `, { count: 'exact' })
      .eq('status', 'live')
      .order('created_at', { ascending: false });

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (q && q.trim()) {
      query = query.ilike('title', `%${q.trim()}%`);
    }

    if (sort === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price_desc') {
      query = query.order('price', { ascending: false });
    }

    query = query.range(safeOffset, safeOffset + safeLimit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[listProducts] error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch products.' });
    }

    return res.json({
      items: data || [],
      total: count || 0,
      limit: safeLimit,
      offset: safeOffset,
    });
  } catch (err) {
    console.error('[listProducts] unexpected error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── getMyProducts ─────────────────────────────────────────────
// GET /api/products/mine
// Protected — returns ALL of this seller's listings (all statuses)
// Used in the seller dashboard
export const getMyProducts = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const safeLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
    const safeOffset = Math.max(parseInt(offset) || 0, 0);

    const { data, error, count } = await supabase
      .from('products')
      .select(`
        id, title, description, price, category,
        image_urls, status, created_at, expires_at, approved_by
      `, { count: 'exact' })
      .eq('seller_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(safeOffset, safeOffset + safeLimit - 1);

    if (error) {
      console.error('[getMyProducts] error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch your listings.' });
    }

    return res.json({ items: data || [], total: count || 0 });
  } catch (err) {
    console.error('[getMyProducts] unexpected:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── getProductById ────────────────────────────────────────────
// GET /api/products/:id
// Public — returns a single product with full seller info
// Used on the product detail page
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select(`
        id, title, description, price, category,
        image_urls, status, created_at, expires_at, notes_to_buyer,
        seller:seller_id (
          id, name, email, instagram, telegram, reddit, gmail, meeting_note
        )
      `)
      .eq('id', id)
      .single(); // Expect exactly one row

    if (error || !data) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Count how many people have shown interest (for the seller to see)
    const { count } = await supabase
      .from('contact_requests')
      .select('*', { count: 'exact', head: true }) // head:true = don't return rows, just count
      .eq('product_id', id);

    return res.json({ ...data, interest_count: count || 0 });
  } catch (err) {
    console.error('[getProductById] error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── createProduct ─────────────────────────────────────────────
// POST /api/products
// Protected — requires login
// Body: { title, description, price, category, images: [base64,...] }
// seller_id comes from req.user.id (JWT) — never from the request body
export const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      notes_to_buyer,
      images, // array of base64 strings from frontend
      instagram,
      telegram,
      gmail,
      reddit,
      meeting_note,
    } = req.body;

    // ── Validate required fields ──
    if (!title || price == null) {
      return res.status(400).json({ error: 'Title and price are required.' });
    }

    if (isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ error: 'Price must be a valid positive number.' });
    }

    // ── Upload images to Cloudinary ──
    // If no images provided, imageData defaults to empty arrays
    let imageUrls = [];
    let publicIds = [];

    if (images && Array.isArray(images) && images.length > 0) {
      try {
        const uploaded = await uploadMultiple(images);
        imageUrls = uploaded.urls;
        publicIds = uploaded.publicIds;
      } catch (uploadErr) {
        console.error('[createProduct] Cloudinary upload failed:', uploadErr.message);
        return res.status(500).json({ error: 'Image upload failed. Try again.' });
      }
    }

    // ── Insert product into database ──
    // seller_id = req.user.id (from JWT) — NOT from req.body
    // This is the security fix from the old code.
    // Even if someone sends { seller_id: 'someoneElsesId' } in the body, we ignore it.
    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert({
        seller_id:      req.user.id,          // FROM JWT — secure
        title:          title.trim(),
        description:    description?.trim() || null,
        price:          Number(price),
        category:       category || 'Other',
        notes_to_buyer: notes_to_buyer?.trim() || null,
        image_urls:     imageUrls,
        public_ids:     publicIds,
        status:         'pending',             // Always starts as pending — admin must approve
      })
      .select()
      .single();

    if (insertError) {
      console.error('[createProduct] DB error:', insertError.message);
      // If DB insert fails but we already uploaded images, clean them up
      if (publicIds.length > 0) await deleteMultiple(publicIds);
      return res.status(500).json({ error: 'Failed to create listing.' });
    }

    // ── Update seller's profile with contact details if provided ──
    // This allows users to set contact info during listing creation
    const contactUpdates = {
      ...(instagram    !== undefined && { instagram: instagram || null }),
      ...(telegram     !== undefined && { telegram: telegram || null }),
      ...(gmail        !== undefined && { gmail: gmail || null }),
      ...(reddit       !== undefined && { reddit: reddit || null }),
      ...(meeting_note !== undefined && { meeting_note: meeting_note || null }),
    };

    if (Object.keys(contactUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from('users')
        .update(contactUpdates)
        .eq('id', req.user.id);

      if (profileError) {
        console.error('[createProduct] Profile update error:', profileError.message);
        // Non-critical — listing was created, just log the error
      }
    }

    // ── Notify admins that a new listing needs review ──
    // Find all admin users and create a notification for each
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      const adminNotifications = admins.map(admin => ({
        user_id:    admin.id,
        type:       'approved',       // Reusing type — admins see pending review
        title:      'New listing pending review',
        message:    `"${title}" by a seller needs your approval.`,
        product_id: newProduct.id,
      }));

      // Insert all admin notifications in one query (batch insert)
      await supabase.from('notifications').insert(adminNotifications);
    }

    return res.status(201).json(newProduct);
  } catch (err) {
    console.error('[createProduct] unexpected:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── updateProduct ─────────────────────────────────────────────
// PUT /api/products/:id
// Protected — only the seller who owns this product can edit it
// Body: { title, description, price, category, images }
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category, notes_to_buyer, images } = req.body;

    // ── Verify ownership ──
    // First fetch the product to check seller_id matches req.user.id
    // Never skip this check — without it anyone could edit any listing
    const { data: existing, error: fetchError } = await supabase
      .from('products')
      .select('id, seller_id, public_ids, status')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Ownership check: is the logged-in user the seller?
    if (existing.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own listings.' });
    }

    // Can't edit a sold listing
    if (existing.status === 'sold') {
      return res.status(400).json({ error: 'Cannot edit a sold listing.' });
    }

    // ── Handle image replacement ──
    let imageUrls;
    let publicIds;

    if (images && Array.isArray(images) && images.length > 0) {
      // Delete old Cloudinary images first
      if (existing.public_ids?.length > 0) {
        await deleteMultiple(existing.public_ids);
      }
      // Upload new ones
      const uploaded = await uploadMultiple(images);
      imageUrls = uploaded.urls;
      publicIds = uploaded.publicIds;
    }

    // ── Build update object with only provided fields ──
    // Spread syntax: { ...obj } copies all properties
    // Conditional spread: ...(condition && { key: value }) adds key only if condition is true -?
    const updates = {
      ...(title       && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(price       !== undefined && { price: Number(price) }),
      ...(category    && { category }),
      ...(notes_to_buyer !== undefined && { notes_to_buyer: notes_to_buyer?.trim() || null }),
      ...(imageUrls   && { image_urls: imageUrls, public_ids: publicIds }),
      // Editing resets to pending — admin needs to re-approve changed listings
      status: 'pending',
    };

    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[updateProduct] error:', updateError.message);
      return res.status(500).json({ error: 'Failed to update listing.' });
    }

    return res.json(updated);
  } catch (err) {
    console.error('[updateProduct] unexpected:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── updateStatus ──────────────────────────────────────────────
// PATCH /api/products/:id/status
// Protected — seller marks their product as 'sold' or 'hidden'
// Body: { status: 'sold' | 'hidden' | 'live' }
// 'live' here means: seller un-hides a hidden listing (back to visible)
// Note: only admin can set status to 'live' initially (approval flow)
//       but seller can un-hide a previously hidden listing
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Sellers are only allowed to set these statuses
    const sellerAllowedStatuses = ['sold', 'hidden', 'live'];
    if (!sellerAllowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${sellerAllowedStatuses.join(', ')}`
      });
    }

    // Verify ownership -?
    const { data: existing } = await supabase
      .from('products')
      .select('id, seller_id, title, status')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (existing.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own listings.' });
    }

    // Can't un-sell something
    if (existing.status === 'sold' && status !== 'sold') {
      return res.status(400).json({ error: 'Cannot change status of a sold item.' });
    }

    // Seller can only set live if the product was previously approved (was live before hidden)
    // They cannot bypass the admin approval by setting status = live on a pending product
    if (status === 'live' && !['hidden'].includes(existing.status)) {
      return res.status(400).json({
        error: 'Can only un-hide a previously hidden listing.'
      });
    }

    const { data: updated, error } = await supabase
      .from('products')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update status.' });
    }

    return res.json({
      message: `Listing marked as ${status}.`,
      product: updated
    });
  } catch (err) {
    console.error('[updateStatus] error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── deleteProduct ─────────────────────────────────────────────
// DELETE /api/products/:id
// Protected — seller can delete their own listing
// Also deletes images from Cloudinary
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch product to verify ownership and get public_ids for Cloudinary cleanup
    const { data: existing } = await supabase
      .from('products')
      .select('id, seller_id, public_ids')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (existing.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own listings.' });
    }

    // Delete Cloudinary images first
    // (If DB delete succeeds but Cloudinary fails, images are orphaned.
    //  Delete Cloudinary first — if it fails, we don't delete from DB either.)
    if (existing.public_ids?.length > 0) {
      await deleteMultiple(existing.public_ids);
    }

    // Delete from DB — CASCADE in schema handles:
    // contact_requests with this product_id → auto deleted
    // notifications with this product_id → set to null
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[deleteProduct] error:', deleteError.message);
      return res.status(500).json({ error: 'Failed to delete listing.' });
    }

    return res.json({ message: 'Listing deleted successfully.' });
  } catch (err) {
    console.error('[deleteProduct] unexpected:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};