import { supabase } from '../db/supabase.js';
import { deleteMultiple, uploadMultiple } from '../utils/cloudinary.js';
import {
  AppError,
  asyncHandler,
  buildPaginationMeta,
  parsePagination,
  sendSuccess,
} from '../utils/http.js';

const PRODUCT_SELECT = `
  id, title, description, price, category,
  image_urls, public_ids, status, created_at, expires_at, seller_id,
  seller:seller_id (
    id, name, email, instagram, telegram, reddit
  )
`;

const PRODUCT_OWN_SELECT = `
  id, title, description, price, category,
  image_urls, public_ids, status, created_at, expires_at, seller_id, approved_by
`;

const sanitizeSort = (sort) => {
  switch (sort) {
    case 'price_asc':
      return { column: 'price', ascending: true };
    case 'price_desc':
      return { column: 'price', ascending: false };
    case 'oldest':
      return { column: 'created_at', ascending: true };
    default:
      return { column: 'created_at', ascending: false };
  }
};

const validateProductInput = ({ title, price }) => {
  if (!title?.trim()) {
    throw new AppError('Title is required.', 400);
  }

  if (price === undefined || price === null || Number.isNaN(Number(price))) {
    throw new AppError('Price must be a valid number.', 400);
  }

  if (Number(price) < 0) {
    throw new AppError('Price must be zero or greater.', 400);
  }
};

const notifyAdminsForReview = async (title, productId) => {
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin');

  if (!admins?.length) {
    return;
  }

  await supabase.from('notifications').insert(
    admins.map((admin) => ({
      user_id: admin.id,
      type: 'approved',
      title: 'New listing pending review',
      message: `"${title}" is waiting for moderation.`,
      product_id: productId,
    }))
  );
};

export const listProducts = asyncHandler(async (req, res) => {
  const { category, q, sort, minPrice, maxPrice } = req.query;
  const { page, limit, from, to } = parsePagination(req.query);
  const sortConfig = sanitizeSort(sort);

  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .eq('status', 'live');

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  if (q?.trim()) {
    const term = q.trim();
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  if (minPrice !== undefined && minPrice !== '') {
    query = query.gte('price', Number(minPrice));
  }

  if (maxPrice !== undefined && maxPrice !== '') {
    query = query.lte('price', Number(maxPrice));
  }

  const { data, error, count } = await query
    .order(sortConfig.column, { ascending: sortConfig.ascending })
    .range(from, to);

  if (error) {
    throw new AppError('Failed to fetch products.', 500, error.message);
  }

  return sendSuccess(res, {
    message: 'Products fetched successfully.',
    data: data || [],
    meta: {
      pagination: buildPaginationMeta({ page, limit, total: count || 0 }),
      filters: {
        category: category || null,
        q: q || null,
        sort: sort || 'newest',
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
      },
    },
  });
});

export const getMyProducts = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const { page, limit, from, to } = parsePagination(req.query);

  let query = supabase
    .from('products')
    .select(PRODUCT_OWN_SELECT, { count: 'exact' })
    .eq('seller_id', req.user.id);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new AppError('Failed to fetch your listings.', 500, error.message);
  }

  return sendSuccess(res, {
    message: 'Your listings fetched successfully.',
    data: data || [],
    meta: {
      pagination: buildPaginationMeta({ page, limit, total: count || 0 }),
    },
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new AppError('Failed to fetch product.', 500, error.message);
  }

  if (!data) {
    throw new AppError('Product not found.', 404);
  }

  const canViewPrivate =
    req.user?.role === 'admin' || req.user?.id === data.seller_id;

  if (data.status !== 'live' && !canViewPrivate) {
    throw new AppError('Product not found.', 404);
  }

  const { count: interestCount } = await supabase
    .from('contact_requests')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', id);

  return sendSuccess(res, {
    message: 'Product fetched successfully.',
    data: {
      ...data,
      interest_count: interestCount || 0,
    },
  });
});

export const createProduct = asyncHandler(async (req, res) => {
  const { title, description, price, category, images } = req.body;

  validateProductInput({ title, price });

  let imageUrls = [];
  let publicIds = [];

  if (Array.isArray(images) && images.length > 0) {
    const uploaded = await uploadMultiple(images);
    imageUrls = uploaded.urls;
    publicIds = uploaded.publicIds;
  }

  const { data: newProduct, error: insertError } = await supabase
    .from('products')
    .insert({
      seller_id: req.user.id,
      title: title.trim(),
      description: description?.trim() || null,
      price: Number(price),
      category: category?.trim() || 'Other',
      image_urls: imageUrls,
      public_ids: publicIds,
      status: 'pending',
    })
    .select(PRODUCT_OWN_SELECT)
    .single();

  if (insertError || !newProduct) {
    if (publicIds.length > 0) {
      await deleteMultiple(publicIds);
    }

    throw new AppError('Failed to create listing.', 500, insertError?.message);
  }

  await notifyAdminsForReview(newProduct.title, newProduct.id);

  return sendSuccess(res, {
    status: 201,
    message: 'Listing created successfully and sent for review.',
    data: newProduct,
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, price, category, images } = req.body;

  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('id, seller_id, public_ids, status')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    throw new AppError('Failed to fetch listing.', 500, fetchError.message);
  }

  if (!existing) {
    throw new AppError('Product not found.', 404);
  }

  if (existing.seller_id !== req.user.id) {
    throw new AppError('You can only edit your own listings.', 403);
  }

  if (existing.status === 'sold') {
    throw new AppError('Cannot edit a sold listing.', 400);
  }

  const updates = {};

  if (title !== undefined) {
    if (!title?.trim()) {
      throw new AppError('Title cannot be empty.', 400);
    }
    updates.title = title.trim();
  }

  if (description !== undefined) {
    updates.description = description?.trim() || null;
  }

  if (price !== undefined) {
    if (Number.isNaN(Number(price)) || Number(price) < 0) {
      throw new AppError('Price must be zero or greater.', 400);
    }
    updates.price = Number(price);
  }

  if (category !== undefined) {
    updates.category = category?.trim() || 'Other';
  }

  if (images !== undefined) {
    if (!Array.isArray(images)) {
      throw new AppError('Images must be an array.', 400);
    }

    if (existing.public_ids?.length) {
      await deleteMultiple(existing.public_ids);
    }

    if (images.length > 0) {
      const uploaded = await uploadMultiple(images);
      updates.image_urls = uploaded.urls;
      updates.public_ids = uploaded.publicIds;
    } else {
      updates.image_urls = [];
      updates.public_ids = [];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('At least one field is required to update the listing.', 400);
  }

  updates.status = 'pending';

  const { data: updated, error: updateError } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select(PRODUCT_OWN_SELECT)
    .single();

  if (updateError || !updated) {
    throw new AppError('Failed to update listing.', 500, updateError?.message);
  }

  await notifyAdminsForReview(updated.title, updated.id);

  return sendSuccess(res, {
    message: 'Listing updated successfully and sent for re-review.',
    data: updated,
  });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const sellerAllowedStatuses = ['sold', 'hidden', 'live'];

  if (!sellerAllowedStatuses.includes(status)) {
    throw new AppError(`Status must be one of: ${sellerAllowedStatuses.join(', ')}`, 400);
  }

  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('id, seller_id, status')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    throw new AppError('Failed to fetch listing.', 500, fetchError.message);
  }

  if (!existing) {
    throw new AppError('Product not found.', 404);
  }

  if (existing.seller_id !== req.user.id) {
    throw new AppError('You can only update your own listings.', 403);
  }

  if (existing.status === 'sold' && status !== 'sold') {
    throw new AppError('Cannot change status of a sold item.', 400);
  }

  if (status === 'live' && existing.status !== 'hidden') {
    throw new AppError('Can only un-hide a previously hidden listing.', 400);
  }

  const { data: updated, error } = await supabase
    .from('products')
    .update({ status })
    .eq('id', id)
    .select(PRODUCT_OWN_SELECT)
    .single();

  if (error || !updated) {
    throw new AppError('Failed to update listing status.', 500, error?.message);
  }

  return sendSuccess(res, {
    message: `Listing marked as ${status}.`,
    data: updated,
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('id, seller_id, public_ids')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    throw new AppError('Failed to fetch listing.', 500, fetchError.message);
  }

  if (!existing) {
    throw new AppError('Product not found.', 404);
  }

  if (existing.seller_id !== req.user.id) {
    throw new AppError('You can only delete your own listings.', 403);
  }

  if (existing.public_ids?.length > 0) {
    await deleteMultiple(existing.public_ids);
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
