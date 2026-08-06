// ============================================================
// controllers/authController.js — Google OAuth only
// ============================================================
// WHAT CHANGED:
// Removed: register, login, bcrypt, JWT signing
// Kept:    syncUser (new), getMe, updateProfile
//
// FLOW:
//   1. User clicks "Continue with Google" on frontend
//   2. Supabase handles OAuth — returns a session with access_token
//   3. Frontend calls POST /api/auth/sync-user with the access_token
//   4. Backend verifies it's a real @rvce.edu.in email via Supabase
//   5. Creates or fetches the user's row in our users table
//   6. Returns user profile to frontend
//   7. Frontend stores the Supabase access_token (used for all future requests)
//
// NO JWT_SECRET needed. No bcrypt. No password column.
// ============================================================

// import { link } from 'fs';
import { supabase } from '../db/supabase.js';

// ── syncUser ──────────────────────────────────────────────────
// POST /api/auth/sync-user
// Called by frontend immediately after Google login succeeds.
// The access_token from Supabase is sent in the Authorization header,
// so verifyToken middleware runs first and sets req.user.
// Wait — actually this route does NOT use verifyToken because the
// user may not have a row in our users table yet (first login).
// Instead we verify the token manually here.
export const syncUser = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    // Verify the Supabase session token and get the authenticated user's email
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({ error: 'Invalid session. Please log in again.' });
    }

    const email = authUser.email?.trim().toLowerCase();

    // ── RVCE email restriction ──
    // This is the security gate that OTP was going to solve.
    // Google verified the user owns this email — we just check the domain.
    if (!email.endsWith('@rvce.edu.in')) {
      // Sign them out of Supabase too so they can't retry
      return res.status(403).json({
        error: 'Only RVCE email addresses (@rvce.edu.in) are allowed.'
      });
    }

    //to be removed later 
    // console.log("[SYNC] Email:", email);

    // ── Find or create user in our application users table ──
    let { data: existingUser } = await supabase
      .from('users')
      .select('id, name, email, role, instagram, telegram, reddit, linkedin, other_contact_details, is_profile_complete, created_at')
      .eq('email', email)
      .single();

    //to be removed later 
    // console.log("[SYNC] Existing user:", existingUser);

    if (existingUser) {
      // User already exists — just return their profile
    //to be removed later 
      // console.log("[SYNC] Returning existing user");
      return res.json({ user: existingUser, isNew: false });
    }

    // First time login — create their profile row
    // Name comes from Google profile (authUser.user_metadata.full_name)
    const googleName = authUser.user_metadata?.full_name
      || authUser.user_metadata?.name
      || email.split('@')[0]; // fallback: use email prefix

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        name:  googleName,
        // No password — Google handles authentication.
        role:  'user',
      })
      .select('id, name, email, role, instagram, telegram, reddit, linkedin, other_contact_details, is_profile_complete, created_at')
      .single();

    if (insertError) {
      console.error('[syncUser] insert error:', insertError.message);
      return res.status(500).json({ error: 'Failed to create user profile.' });
    }
    //to be removed later 
    // console.log("[SYNC] Returning NEW user");
    return res.status(201).json({ user: newUser, isNew: true });

  } catch (err) {
    console.error('[syncUser] unexpected:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── getMe ─────────────────────────────────────────────────────
// GET /api/auth/me — protected by verifyToken middleware
// Used by frontend on page load to get fresh user data
export const getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, instagram, telegram, reddit, linkedin, other_contact_details, is_profile_complete, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json(user);
  } catch (err) {
    console.error('[getMe] error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── updateProfile ─────────────────────────────────────────────
// PUT /api/auth/profile — protected by verifyToken
// Seller updates their profile and contact information.
export const updateProfile = async (req, res) => {
  try {
    const { name, instagram, telegram, reddit, linkedin, other_contact_details, is_profile_complete } = req.body;

    if (other_contact_details !== undefined && typeof other_contact_details !== 'string') {
      return res.status(400).json({ error: 'Other contact details must be text.' });
    }

    if (other_contact_details?.trim().length > 500) {
      return res.status(400).json({ error: 'Other contact details must be 500 characters or fewer.' });
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update({
        ...(name      && { name: name.trim() }),
        ...(instagram !== undefined && { instagram: instagram || null }),
        ...(telegram  !== undefined && { telegram:  telegram  || null }),
        ...(reddit    !== undefined && { reddit:    reddit    || null }),
        ...(linkedin    !== undefined && { linkedin:    linkedin    || null }),
        ...(other_contact_details !== undefined && { other_contact_details: other_contact_details.trim() || null }),
        ...(is_profile_complete !== undefined && { is_profile_complete }),
      })
      .eq('id', req.user.id)
      .select('id, name, email, role, instagram, telegram, reddit, linkedin, other_contact_details, is_profile_complete')
      .single();

    if (error) {
      console.error('[updateProfile] error:', error.message);
      return res.status(500).json({ error: 'Failed to update profile.' });
    }

    return res.json(updated);
  } catch (err) {
    console.error('[updateProfile] error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};
