import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabase.js';
import { AppError, asyncHandler, sendSuccess } from '../utils/http.js';

const SALT_ROUNDS = 10;

const createToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

const sanitizeUser = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    throw new AppError('Name, email and password are all required.', 400);
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters.', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { data: existing, error: lookupError } = await supabase
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (lookupError) {
    throw new AppError('Failed to validate the provided email address.', 500);
  }

  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const { data: user, error: insertError } = await supabase
    .from('users')
    .insert({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user',
    })
    .select('id, name, email, role, instagram, telegram, reddit, created_at')
    .single();

  if (insertError || !user) {
    throw new AppError('Failed to create account.', 500, insertError?.message);
  }

  const token = createToken(user);

  return sendSuccess(res, {
    status: 201,
    message: 'Account created successfully.',
    data: {
      token,
      user,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    throw new AppError('Email and password are required.', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('id, name, email, password, role, instagram, telegram, reddit, created_at')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (fetchError || !user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  const safeUser = sanitizeUser(user);
  const token = createToken(safeUser);

  return sendSuccess(res, {
    message: 'Logged in successfully.',
    data: {
      token,
      user: safeUser,
    },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, role, instagram, telegram, reddit, created_at')
    .eq('id', req.user.id)
    .maybeSingle();

  if (error) {
    throw new AppError('Failed to fetch your account.', 500, error.message);
  }

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return sendSuccess(res, {
    message: 'Profile fetched successfully.',
    data: user,
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, instagram, telegram, reddit } = req.body;

  const payload = {
    ...(name !== undefined && { name: name?.trim() || null }),
    ...(instagram !== undefined && { instagram: instagram?.trim() || null }),
    ...(telegram !== undefined && { telegram: telegram?.trim() || null }),
    ...(reddit !== undefined && { reddit: reddit?.trim() || null }),
  };

  if (Object.keys(payload).length === 0) {
    throw new AppError('At least one profile field is required.', 400);
  }

  if (payload.name === null) {
    throw new AppError('Name cannot be empty.', 400);
  }

  const { data: updated, error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', req.user.id)
    .select('id, name, email, role, instagram, telegram, reddit, created_at')
    .single();

  if (error || !updated) {
    throw new AppError('Failed to update profile.', 500, error?.message);
  }

  return sendSuccess(res, {
    message: 'Profile updated successfully.',
    data: updated,
  });
});
