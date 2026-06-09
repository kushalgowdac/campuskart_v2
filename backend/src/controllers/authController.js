// ============================================================
// controllers/authController.js — Register and Login
// ============================================================
// A controller is a function that:
//   1. Reads data from the request (req.body, req.params, req.user)
//   2. Runs business logic (validate, hash password, query DB)
//   3. Sends a response (res.json(...))
//
// This controller handles two operations:
//   POST /api/auth/register → create account, return token
//   POST /api/auth/login    → verify credentials, return token
//
// WHY bcrypt for passwords?
// Never store plain text passwords. If your DB is ever hacked,
// attackers get everything. bcrypt is a one-way hash function —
// you can verify a password matches a hash, but you can't
// reverse a hash back to the original password.
// bcrypt also adds a "salt" (random data) so two identical
// passwords produce different hashes. Rainbow table attacks fail.
// ============================================================

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabase.js';

// How many bcrypt "rounds" to use for hashing.
// More rounds = more secure but slower.
// 10 is the industry standard — takes ~100ms, not noticeable to users.
const SALT_ROUNDS = 10;

// ── createToken ──────────────────────────────────────────────
// Helper to generate a JWT. Called after register and login.
// Payload { id, role } is what gets embedded in the token.
// The frontend decodes this (without verifying) to know the user's role.
// The backend verifies + decodes this on every protected request.
const createToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },  // payload — data embedded in token
    process.env.JWT_SECRET,             // secret — only our server knows this
    { expiresIn: '7d' }                 // expiry — token invalid after 7 days
  );
};

// ── register ─────────────────────────────────────────────────
// POST /api/auth/register
// Body: { name, email, password }
// Returns: { token, user: { id, name, email, role } }
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ── Input validation ──
    // Always validate on the backend even if frontend also validates.
    // Never trust the client — someone could call your API directly with curl.
    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Name, email and password are all required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters.'
      });
    }

    // Normalise email — trim whitespace, lowercase
    // So "User@RVCE.edu.in" and "user@rvce.edu.in" are treated as the same
    const normalizedEmail = email.trim().toLowerCase();

    // ── Check if email already exists ──
    const { data: existing } = await supabase
      .from('users')
      .select('id')           // Only fetch id — we don't need all columns
      .eq('email', normalizedEmail)
      .single();              // .single() returns one row or null (not an array)

    if (existing) {
      return res.status(409).json({
        // 409 Conflict — the resource already exists
        error: 'An account with this email already exists.'
      });
    }

    // ── Hash the password ──
    // bcrypt.hash(plainText, saltRounds) → returns a 60-char hash string
    // This is a slow operation by design (prevents brute-force attacks)
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // ── Insert into database ──
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name:     name.trim(),
        email:    normalizedEmail,
        password: hashedPassword,   // NEVER store the plain password
        role:     'user',           // Everyone starts as a regular user
      })
      .select('id, name, email, role') // Return only these columns (not password)
      .single();

    if (insertError) {
      console.error('[register] DB insert error:', insertError.message);
      return res.status(500).json({ error: 'Failed to create account.' });
    }

    // ── Create and return JWT ──
    const token = createToken(newUser);

    // 201 Created — resource was successfully created
    return res.status(201).json({
      token,
      user: newUser  // { id, name, email, role } — no password field
    });

  } catch (err) {
    console.error('[register] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
};

// ── login ─────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
// Returns: { token, user: { id, name, email, role, instagram, telegram, reddit } }
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Find user by email ──
    // We SELECT password here because we need it to verify.
    // But we WON'T include it in the response.
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, name, email, password, role, instagram, telegram, reddit')
      .eq('email', normalizedEmail)
      .single();

    // IMPORTANT: We give the same vague error for "user not found" AND
    // "wrong password". This prevents "email enumeration attacks" where
    // an attacker probes which emails are registered.
    if (fetchError || !user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // ── Verify password ──
    // bcrypt.compare(plain, hash) → true or false
    // It rehashes the input and compares — you can't reverse the hash.
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // ── Create token ──
    const token = createToken(user);

    // Destructure to exclude password from response
    // ES6 destructuring: pull out 'password', put the rest in 'userWithoutPassword'
    const { password: _excluded, ...userWithoutPassword } = user;

    return res.status(200).json({
      token,
      user: userWithoutPassword
    });

  } catch (err) {
    console.error('[login] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Server error during login.' });
  }
};

// ── getMe ─────────────────────────────────────────────────────
// GET /api/auth/me
// Protected route — requires valid JWT (verifyToken middleware runs first)
// Used by frontend on page load to check if token is still valid
// and get fresh user data (e.g. if role was changed to admin)
export const getMe = async (req, res) => {
  try {
    // req.user.id was set by verifyToken middleware from the JWT payload
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, instagram, telegram, reddit, created_at')
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
// PUT /api/auth/profile
// Protected route — seller updates their contact info
// Body: { name, instagram, telegram, reddit }
export const updateProfile = async (req, res) => {
  try {
    const { name, instagram, telegram, reddit } = req.body;

    const { data: updated, error } = await supabase
      .from('users')
      .update({
        // Only update fields that were actually sent
        // If instagram is undefined, it won't be included in the update
        ...(name      && { name: name.trim() }),
        ...(instagram !== undefined && { instagram: instagram || null }),
        ...(telegram  !== undefined && { telegram:  telegram  || null }),
        ...(reddit    !== undefined && { reddit:    reddit    || null }),
      })
      .eq('id', req.user.id)
      .select('id, name, email, role, instagram, telegram, reddit')
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