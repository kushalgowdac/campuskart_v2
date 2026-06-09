import { supabase } from '../db/supabase.js';
import { deleteMultiple } from '../utils/cloudinary.js';
import {
  AppError,
  asyncHandler,
  buildPaginationMeta,
  parsePagination,
  sendSuccess,
} from '../utils/http.js';

const ADMIN_SELECT = `
  id, title, description, price, category, image_urls, public_ids,
  status, created_at, expires_at, seller_id,
  seller:seller_id ( id, name, email )
`;

export const getPendingProducts = asyncHandler(async (req, res) => {
  const { page, limit, from, to } = parsePagination(req.query);

  const { data, error, count } = await supabase
    .from('products')
    .select(ADMIN_SELECT, { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .range(from, to);

  if (error) {
    throw new AppError('Failed to fetch pending listings.', 500, error.message);
  }

  return sendSuccess(res, {
    message: 'Pending listings fetched successfully.',
    data: data || [],
    meta: {
      pagination: buildPaginationMeta({ page, limit, total: count || 0 }),
    },
  });
});

export const getAllProducts = asyncHandler(async (req, res) => {
  const { status, category, q, sort = 'newest' } = req.query;
  const { page, limit, from, to } = parsePagination(req.query);

  let query = supabase
    .from('products')
    .select(ADMIN_SELECT, { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }

  if (category) {
    query = query.eq('category', category);
  }

  if (q?.trim()) {
    const term = q.trim();
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const sortColumn = sort === 'price_asc' || sort === 'price_desc' ? 'price' : 'created_at';
  const ascending = sort === 'price_asc' || sort === 'oldest';

  const { data, error, count } = await query
    .order(sortColumn, { ascending })
    .range(from, to);

  if (error) {
    throw new AppError('Failed to fetch products.', 500, error.message);
  }

  return sendSuccess(res, {
    message: 'Listings fetched successfully.',
    data: data || [],
    meta: {
      pagination: buildPaginationMeta({ page, limit, total: count || 0 }),
    },
  });
});

export const approveProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('id, title, seller_id, status')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    throw new AppError('Failed to fetch listing.', 500, fetchError.message);
  }

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  if (product.status !== 'pending') {
    throw new AppError(`Product is not pending. Current status: ${product.status}`, 400);
  }

  const { data: updated, error: updateError } = await supabase
    .from('products')
    .update({
      status: 'live',
      approved_by: req.user.id,
    })
    .eq('id', id)
    .select(ADMIN_SELECT)
    .single();

  if (updateError || !updated) {
    throw new AppError('Failed to approve product.', 500, updateError?.message);
  }

  await supabase.from('notifications').insert({
    user_id: product.seller_id,
    type: 'approved',
    title: 'Your listing is live!',
    message: `"${product.title}" has been approved and is now visible to buyers.`,
    product_id: product.id,
  });

  return sendSuccess(res, {
    message: 'Product approved successfully.',
    data: updated,
  });
});

export const rejectProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason?.trim() || reason.trim().length < 5) {
    throw new AppError('A rejection reason is required and must be at least 5 characters.', 400);
  }

  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('id, title, seller_id, status')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    throw new AppError('Failed to fetch listing.', 500, fetchError.message);
  }

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  if (product.status !== 'pending') {
    throw new AppError(`Only pending products can be rejected. Current status: ${product.status}`, 400);
  }

  const { data: updated, error: updateError } = await supabase
    .from('products')
    .update({
      status: 'rejected',
      approved_by: req.user.id,
    })
    .eq('id', id)
    .select(ADMIN_SELECT)
    .single();

  if (updateError || !updated) {
    throw new AppError('Failed to reject product.', 500, updateError?.message);
  }

  await supabase.from('notifications').insert({
    user_id: product.seller_id,
    type: 'rejected',
    title: 'Listing not approved',
    message: `"${product.title}" was not approved. Reason: ${reason.trim()}.`,
    product_id: product.id,
  });

  return sendSuccess(res, {
    message: 'Product rejected successfully.',
    data: updated,
  });
});

export const deleteAnyProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('id, title, public_ids')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    throw new AppError('Failed to fetch listing.', 500, fetchError.message);
  }

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  if (product.public_ids?.length) {
    await deleteMultiple(product.public_ids);
  }

  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (deleteError) {
    throw new AppError('Failed to delete listing.', 500, deleteError.message);
  }

  return sendSuccess(res, {
    message: 'Listing deleted successfully.',
    data: { id },
  });
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const [
    usersResult,
    pendingResult,
    liveResult,
    soldResult,
    rejectedResult,
    interestResult,
    recentProducts,
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'live'),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase.from('contact_requests').select('*', { count: 'exact', head: true }),
    supabase
      .from('products')
      .select('id, title, status, created_at, seller:seller_id(name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return sendSuccess(res, {
    message: 'Analytics fetched successfully.',
    data: {
      users: usersResult.count || 0,
      products: {
        pending: pendingResult.count || 0,
        live: liveResult.count || 0,
        sold: soldResult.count || 0,
        rejected: rejectedResult.count || 0,
      },
      total_interests: interestResult.count || 0,
      recent_listings: recentProducts.data || [],
    },
  });
});
