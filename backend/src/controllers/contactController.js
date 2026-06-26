// ============================================================
// controllers/contactController.js — Buyer → Seller contact flow
// ============================================================
// This is the CORE feature of CampusKart.
// When a buyer clicks "I'm Interested":
//   1. We record the interest (contact_requests table)
//   2. We notify the seller (notifications table → Realtime push)
//   3. We return the seller's contact info to the buyer
//   4. Buyer takes the conversation to WhatsApp/email/telegram etc.
//
// The app's role ends here. No in-app chat. Clean and simple.
// ============================================================

import { supabase } from '../db/supabase.js';

export const showInterest = async (req, res) => {
  try {
    const { productId } = req.params;
    const buyerId = req.user.id;

    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`id, title, price, status, seller_id, seller:seller_id(id, name, email, instagram, telegram, reddit,linkedin)`)
      .eq('id', productId)
      .single();

    if (productError || !product) return res.status(404).json({ error: 'Product not found.' });
    if (product.seller_id === buyerId) return res.status(400).json({ error: 'You cannot contact yourself about your own listing.' });
    if (product.status !== 'live') return res.status(400).json({ error: 'This listing is no longer available.' });

    // ── Check BEFORE upsert whether this buyer has shown interest before ──
    // This is the fix for duplicate notifications.
    // We check FIRST, then insert. If we checked after upsert, count would
    // always be 1 (the same row), so isFirstTime would always be true → duplicate notifications.
    const { count: existingCount } = await supabase
      .from('contact_requests')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('buyer_id', buyerId);

    const isFirstTime = existingCount === 0;

    // Now insert — upsert silently ignores if row already exists
  const { error: contactError } = await supabase
    .from("contact_requests")
    .upsert(
      {
        product_id: productId,
        buyer_id: buyerId,
        seller_id: product.seller_id,
      },
      {
        onConflict: "product_id,buyer_id",
        ignoreDuplicates: true,
      }
    );

  if (contactError) {
    console.error(contactError);
    return res.status(500).json({
      error: "Failed to record interest."
    });
  }

    // Only send notification on the buyer's first "I'm Interested" click
    if (isFirstTime) {
      await supabase.from('notifications').insert({
        user_id:    product.seller_id,
        type:       'interest',
        title:      '👀 Someone is interested!',
        message:    `A buyer is interested in your listing: "${product.title}".`,
        product_id: productId,
      });
    }

    // Total interest count — always fetch after upsert so it includes this buyer
    const { count: totalInterest } = await supabase
      .from('contact_requests')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId);

    const copyMessage = `Hi ${product.seller.name}! I saw your listing "${product.title}" (₹${product.price}) on CampusKart and I'm interested. Is it still available?`;

    return res.json({
      product: { id: product.id, title: product.title, price: product.price },
      seller: {
        name:      product.seller.name,
        email:     product.seller.email,
        instagram: product.seller.instagram,
        telegram:  product.seller.telegram,
        reddit:    product.seller.reddit,
        linkedin:  product.seller.linkedin,
      },
      copy_message:   copyMessage,
      total_interest: totalInterest || 1,
    });

  } catch (err) {
    console.error('[showInterest] unexpected:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const getProductInterests = async (req, res) => {
  try {
    const { productId } = req.params;

    const { data: product } = await supabase
      .from('products').select('id, seller_id').eq('id', productId).single();

    if (!product) return res.status(404).json({ error: 'Product not found.' });
    if (product.seller_id !== req.user.id) return res.status(403).json({ error: 'Only the seller can view interests for this listing.' });

    const { data, count, error } = await supabase
      .from('contact_requests')
      .select('id, created_at, buyer:buyer_id(id, name)', { count: 'exact' })
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Failed to fetch interests.' });
    return res.json({ count: count || 0, interests: data || [] });
  } catch (err) {
    console.error('[getProductInterests] error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};