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
// GET /api/products?category=Books&q=chemistry
// Public — no auth needed. Only returns 'live' products.
// Supports: category filter, text search, price sort
const PRODUCT_PAGE_SIZE = 20;

const encodeProductCursor = (product, sort) => {
  const value = sort === 'price_asc' || sort === 'price_desc'
    ? Number(product.price)
    : product.created_at;

  return Buffer.from(JSON.stringify({ value, id: product.id })).toString('base64url');
};

const decodeProductCursor = (cursor, sort) => {
  if (!cursor) return null;

  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    const validId = typeof parsed.id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parsed.id);
    const validValue = sort === 'price_asc' || sort === 'price_desc'
      ? Number.isFinite(Number(parsed.value))
      : typeof parsed.value === 'string' && Number.isFinite(Date.parse(parsed.value));

    return validId && validValue
      ? { id: parsed.id, value: parsed.value }
      : null;
  } catch {
    return null;
  }
};

export const listProducts = async (req, res) => {
  try {
    const { category, q, sort = '', cursor, page } = req.query;
    const usesPagination = page === 'cursor' || Boolean(cursor);
    const decodedCursor = decodeProductCursor(cursor, sort);
    if (cursor && !decodedCursor) {
      return res.status(400).json({ error: 'Invalid pagination cursor.' });
    }

    const isPriceSort = sort === 'price_asc' || sort === 'price_desc';
    const sortColumn = isPriceSort ? 'price' : 'created_at';
    const ascending = sort === 'price_asc';

    // Build query step by step — Supabase SDK is chainable like this.
    // Each .eq(), .ilike(), .order() adds to the query.
    // Nothing runs until we await the final result.
    let query = supabase
      .from('products')
      // The * gets all product columns.
      // seller:users(...) does the JOIN — fetches seller info
      // via the foreign key products.seller_id → users.id
      // This replaces: LEFT JOIN users u ON products.seller_id = u.id
      .select(`
        id, title, price, category, image_urls, created_at,
        seller:seller_id (
          id, name
        )
      `)
      .eq('status', 'live')  // Only show approved products to public
      .order(sortColumn, { ascending })
      .order('id', { ascending });

    if (usesPagination) {
      query = query.limit(PRODUCT_PAGE_SIZE + 1);
    }

    // Apply category filter if provided
    // ?category=Books → AND category = 'Books'
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    // Full text search on title
    // ilike = case-insensitive LIKE
    // %term% means "contains term anywhere"
    // ?q=chemistry → AND title ILIKE '%chemistry%'
    if (q && q.trim()) {
      query = query.ilike('title', `%${q.trim()}%`);
    }

    // Continue strictly after the final item from the previous page. The id
    // tie-breaker prevents duplicate/skipped products with equal price/time.
    if (decodedCursor) {
      const comparison = ascending ? 'gt' : 'lt';
      const cursorValue = isPriceSort
        ? Number(decodedCursor.value)
        : decodedCursor.value;
      query = query.or(
        `${sortColumn}.${comparison}.${cursorValue},` +
        `and(${sortColumn}.eq.${cursorValue},id.${comparison}.${decodedCursor.id})`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('[listProducts] error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch products.' });
    }

    const rows = data || [];
    // Keep the old array response working during a backend-first deployment.
    // The new frontend opts into cursor pagination with ?page=cursor.
    if (!usesPagination) {
      return res.json(rows.map(({ image_urls: imageUrls, ...product }) => ({
        ...product,
        image_urls: imageUrls?.slice(0, 1) || [],
      })));
    }

    const hasNextPage = rows.length > PRODUCT_PAGE_SIZE;
    const pageRows = rows.slice(0, PRODUCT_PAGE_SIZE);
    const items = pageRows.map(({ image_urls: imageUrls, ...product }) => ({
      ...product,
      image_url: imageUrls?.[0] || null,
    }));
    const lastProduct = pageRows.at(-1);

    return res.json({
      items,
      nextCursor: hasNextPage && lastProduct
        ? encodeProductCursor(lastProduct, sort)
        : null,
    });
  } catch (err) {
    console.error('[listProducts] unexpected error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── listClosedProducts ───────────────────────────────────────
// GET /api/products/closed?page=cursor&cursor=...
// Public — shows sold items until their original 90-day listing expiry.
export const listClosedProducts = async (req, res) => {
  try {
    const { cursor } = req.query;
    const decodedCursor = decodeProductCursor(cursor, '');
    if (cursor && !decodedCursor) {
      return res.status(400).json({ error: 'Invalid pagination cursor.' });
    }

    let query = supabase
      .from('products')
      .select(`
        id, title, price, category, image_urls, created_at, expires_at,
        seller:seller_id (
          id, name
        )
      `)
      .eq('status', 'sold')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(PRODUCT_PAGE_SIZE + 1);

    if (decodedCursor) {
      query = query.or(
        `created_at.lt.${decodedCursor.value},` +
        `and(created_at.eq.${decodedCursor.value},id.lt.${decodedCursor.id})`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error('[listClosedProducts] error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch closed deals.' });
    }

    const rows = data || [];
    const hasNextPage = rows.length > PRODUCT_PAGE_SIZE;
    const pageRows = rows.slice(0, PRODUCT_PAGE_SIZE);
    const items = pageRows.map(({ image_urls: imageUrls, ...product }) => ({
      ...product,
      image_url: imageUrls?.[0] || null,
    }));
    const lastProduct = pageRows.at(-1);

    return res.json({
      items,
      nextCursor: hasNextPage && lastProduct
        ? encodeProductCursor(lastProduct, '')
        : null,
    });
  } catch (err) {
    console.error('[listClosedProducts] unexpected error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── getMyProducts ─────────────────────────────────────────────
// GET /api/products/mine
// Protected — returns ALL of this seller's listings (all statuses)
// Used in the seller dashboard
export const getMyProducts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, title, description, price, category,
        image_urls, status, created_at, expires_at, approved_by
      `)
      .eq('seller_id', req.user.id)  // req.user.id from JWT — secure
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getMyProducts] error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch your listings.' });
    }

    return res.json(data || []);
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
        image_urls, status, created_at, expires_at,
        seller:seller_id (
          id, name, email, instagram, telegram, reddit
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
      images, // array of base64 strings from frontend
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
        seller_id:   req.user.id,          // FROM JWT — secure
        title:       title.trim(),
        description: description?.trim() || null,
        price:       Number(price),
        category:    category || 'Other',
        image_urls:  imageUrls,
        public_ids:  publicIds,
        status:      'pending',             // Always starts as pending — admin must approve
      })
      .select()
      .single();

    if (insertError) {
      console.error('[createProduct] DB error:', insertError.message);
      // If DB insert fails but we already uploaded images, clean them up
      if (publicIds.length > 0) await deleteMultiple(publicIds);
      return res.status(500).json({ error: 'Failed to create listing.' });
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
    const { title, description, price, category, images } = req.body;

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

// ── updateListingDetails ─────────────────────────────────────
// PATCH /api/products/:id/details
// Lets the owner change only price/description on an approved listing.
// The listing returns to pending so edited public content is reviewed again.
export const updateListingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, description } = req.body;

    if (price === undefined && description === undefined) {
      return res.status(400).json({ error: 'Price or description is required.' });
    }

    const numericPrice = price === undefined ? undefined : Number(price);
    if (price !== undefined && (!Number.isFinite(numericPrice) || numericPrice < 0)) {
      return res.status(400).json({ error: 'Price must be a valid non-negative number.' });
    }

    if (description !== undefined && description !== null && typeof description !== 'string') {
      return res.status(400).json({ error: 'Description must be text.' });
    }

    if (description?.trim().length > 2000) {
      return res.status(400).json({ error: 'Description must be 2000 characters or fewer.' });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('products')
      .select('id, seller_id, title, status')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (existing.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own listings.' });
    }

    if (!['live', 'hidden'].includes(existing.status)) {
      return res.status(400).json({
        error: 'Only live or hidden listings can be edited.',
      });
    }

    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update({
        ...(numericPrice !== undefined && { price: numericPrice }),
        ...(description !== undefined && { description: description?.trim() || null }),
        status: 'pending',
        approved_by: null,
      })
      .eq('id', id)
      .select(`
        id, title, description, price, category,
        image_urls, status, created_at, expires_at, approved_by
      `)
      .single();

    if (updateError) {
      console.error('[updateListingDetails] error:', updateError.message);
      return res.status(500).json({ error: 'Failed to update listing.' });
    }

    // Match new-listing behavior so admins know another review is waiting.
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (admins?.length) {
      await supabase.from('notifications').insert(
        admins.map(admin => ({
          user_id: admin.id,
          type: 'approved',
          title: 'Edited listing pending review',
          message: `"${existing.title}" was edited and needs your approval.`,
          product_id: existing.id,
        }))
      );
    }

    return res.json({
      message: 'Listing updated and sent for review.',
      product: updated,
    });
  } catch (err) {
    console.error('[updateListingDetails] unexpected:', err.message);
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
