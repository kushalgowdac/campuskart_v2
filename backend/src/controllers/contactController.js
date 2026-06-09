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

// ── showInterest ──────────────────────────────────────────────
// POST /api/contact/:productId
// Protected — buyer must be logged in
// Returns seller contact info so buyer can reach out externally
export const showInterest = async (req, res) => {
  try {
    const { productId } = req.params;
    const buyerId = req.user.id;

    // ── Fetch the product ──
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        id, title, price, status, seller_id, notes_to_buyer,
        seller:seller_id (
          id, name, email, instagram, telegram, reddit, gmail, meeting_note
        )
      `)
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Can't show interest in your own listing
    if (product.seller_id === buyerId) {
      return res.status(400).json({ error: 'You cannot contact yourself about your own listing.' });
    }

    // Can only contact for live products
    if (product.status !== 'live') {
      return res.status(400).json({
        error: 'This listing is no longer available.'
      });
    }

    // ── Record the contact request ──
    // upsert = INSERT if not exists, do nothing if already exists
    // onConflict: 'product_id,buyer_id' matches our UNIQUE constraint
    // ignoreDuplicates: true → if this buyer already showed interest, no error, no duplicate notification
    const { error: contactError } = await supabase
      .from('contact_requests')
      .upsert(
        {
          product_id: productId,
          buyer_id:   buyerId,
          seller_id:  product.seller_id,
        },
        {
          onConflict:       'product_id,buyer_id',
          ignoreDuplicates: true, // Silent ignore on duplicate — no error thrown
        }
      );

    if (contactError) {
      console.error('[showInterest] contact_request error:', contactError.message);
      // Don't block the buyer — still show seller info even if DB record fails
    }

    // ── Check if this is the first time this buyer is showing interest ──
    // We only want to notify the seller ONCE per buyer, not on every revisit
    const { count } = await supabase
      .from('contact_requests')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('buyer_id', buyerId);

    // count = 1 means this is their first time (we just inserted)
    // count > 1 would mean duplicate, but upsert + ignoreDuplicates means it stays 1
    // We send notification only if this is a fresh interest
    if (count === 1) {
      await supabase.from('notifications').insert({
        user_id:    product.seller_id,
        type:       'interest',
        title:      '👀 Someone is interested!',
        message:    `A buyer is interested in your listing: "${product.title}". Check your contact info is up to date.`,
        product_id: productId,
      });
    }

    // ── Get total interest count for this product ──
    const { count: totalInterest } = await supabase
      .from('contact_requests')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId);

    // ── Build the pre-filled message for the buyer to copy ──
    // This message is shown to the buyer with a "Copy" button.
    // They paste it into email/Instagram/Telegram when reaching out.
    const copyMessage = `Hi ${product.seller.name}! I saw your listing "${product.title}" (₹${product.price}) on CampusKart and I'm interested. Is it still available?`;

    // ── Return seller contact info ──
    // This is what the ContactSeller page displays
    return res.json({
      product: {
        id:            product.id,
        title:         product.title,
        price:         product.price,
        notes_to_buyer: product.notes_to_buyer,
      },
      seller: {
        name:        product.seller.name,
        email:       product.seller.email,
        instagram:   product.seller.instagram,
        telegram:    product.seller.telegram,
        reddit:      product.seller.reddit,
        gmail:       product.seller.gmail,
        meeting_note: product.seller.meeting_note,
      },
      copy_message:   copyMessage,
      total_interest: totalInterest || 1,
    });

  } catch (err) {
    console.error('[showInterest] unexpected:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── getProductInterests ───────────────────────────────────────
// GET /api/contact/:productId/interests
// Protected — only the seller of this product can see this
// Shows seller how many (and optionally who) are interested
export const getProductInterests = async (req, res) => {
  try {
    const { productId } = req.params;

    // Verify the requester is the seller of this product
    const { data: product } = await supabase
      .from('products')
      .select('id, seller_id')
      .eq('id', productId)
      .single();

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (product.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the seller can view interests for this listing.' });
    }

    const { data, count, error } = await supabase
      .from('contact_requests')
      .select('id, created_at, buyer:buyer_id(id, name)', { count: 'exact' })
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch interests.' });
    }

    return res.json({ count: count || 0, interests: data || [] });
  } catch (err) {
    console.error('[getProductInterests] error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};