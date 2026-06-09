import { supabase } from '../db/supabase.js';
import {
  AppError,
  asyncHandler,
  buildPaginationMeta,
  parsePagination,
  sendSuccess,
} from '../utils/http.js';

export const showInterest = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const buyerId = req.user.id;

  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`
      id, title, price, status, seller_id,
      seller:seller_id (
        id, name, email, instagram, telegram, reddit
      )
    `)
    .eq('id', productId)
    .maybeSingle();

  if (productError) {
    throw new AppError('Failed to fetch product.', 500, productError.message);
  }

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  if (product.seller_id === buyerId) {
    throw new AppError('You cannot contact yourself about your own listing.', 400);
  }

  if (product.status !== 'live') {
    throw new AppError('This listing is no longer available.', 400);
  }

  const { error: upsertError } = await supabase
    .from('contact_requests')
    .upsert(
      {
        product_id: productId,
        buyer_id: buyerId,
        seller_id: product.seller_id,
      },
      {
        onConflict: 'product_id,buyer_id',
        ignoreDuplicates: true,
      }
    );

  if (upsertError) {
    throw new AppError('Failed to record your interest.', 500, upsertError.message);
  }

  const [{ count: buyerInterestCount }, { count: totalInterest }] = await Promise.all([
    supabase
      .from('contact_requests')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('buyer_id', buyerId),
    supabase
      .from('contact_requests')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId),
  ]);

  if (buyerInterestCount === 1) {
    await supabase.from('notifications').insert({
      user_id: product.seller_id,
      type: 'interest',
      title: 'Someone is interested!',
      message: `A buyer is interested in your listing "${product.title}".`,
      product_id: productId,
    });
  }

  const copyMessage = `Hi ${product.seller.name}! I saw your listing "${product.title}" (Rs. ${product.price}) on CampusKart and I'm interested. Is it still available?`;

  return sendSuccess(res, {
    message: 'Seller contact details fetched successfully.',
    data: {
      product: {
        id: product.id,
        title: product.title,
        price: product.price,
      },
      seller: product.seller,
      copy_message: copyMessage,
      total_interest: totalInterest || 1,
    },
  });
});

export const getContactHistory = asyncHandler(async (req, res) => {
  const { page, limit, from, to } = parsePagination(req.query);

  const { data, error, count } = await supabase
    .from('contact_requests')
    .select(
      `
        id, created_at,
        product:product_id (
          id, title, price, category, status, image_urls, created_at
        ),
        seller:seller_id (
          id, name, email, instagram, telegram, reddit
        )
      `,
      { count: 'exact' }
    )
    .eq('buyer_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new AppError('Failed to fetch contact history.', 500, error.message);
  }

  return sendSuccess(res, {
    message: 'Contact history fetched successfully.',
    data: data || [],
    meta: {
      pagination: buildPaginationMeta({ page, limit, total: count || 0 }),
    },
  });
});

export const getProductInterests = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page, limit, from, to } = parsePagination(req.query);

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, seller_id')
    .eq('id', productId)
    .maybeSingle();

  if (productError) {
    throw new AppError('Failed to fetch product.', 500, productError.message);
  }

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  if (product.seller_id !== req.user.id) {
    throw new AppError('Only the seller can view interests for this listing.', 403);
  }

  const { data, count, error } = await supabase
    .from('contact_requests')
    .select('id, created_at, buyer:buyer_id(id, name, email)', { count: 'exact' })
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new AppError('Failed to fetch interests.', 500, error.message);
  }

  return sendSuccess(res, {
    message: 'Listing interests fetched successfully.',
    data: data || [],
    meta: {
      pagination: buildPaginationMeta({ page, limit, total: count || 0 }),
    },
  });
});
