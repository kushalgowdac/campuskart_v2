// ============================================================
// utils/cloudinary.js — Image upload and delete helpers
// ============================================================
// Cloudinary is a cloud image hosting service.
// When a seller uploads product photos:
//   1. Frontend sends base64 image data to our backend
//   2. Backend calls uploadImage() → Cloudinary stores it
//   3. Cloudinary returns a public URL + a public_id
//   4. We save BOTH in products.image_urls[] and products.public_ids[]
//
// WHY store public_id separately?
// The URL is for DISPLAYING the image.
// The public_id is for DELETING it later (when product expires/is deleted).
// Without public_id, you can never clean up Cloudinary storage.
//
// HOW base64 works:
// Images are binary data. base64 encodes binary as text so it can
// travel in a JSON request body. It looks like: "data:image/jpeg;base64,/9j/4AAQ..."
// Cloudinary accepts this directly — you don't need multipart/form-data.
// ============================================================

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure with your Cloudinary credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── uploadImage ──────────────────────────────────────────────
// Takes a base64 string, uploads to Cloudinary under the
// 'campuskart' folder, returns { url, public_id }.
//
// The folder keeps our images organised — all CampusKart images
// are in one place in the Cloudinary dashboard.
export const uploadImage = async (base64String) => {
  const result = await cloudinary.uploader.upload(base64String, {
    folder: 'campuskart',
    // Cloudinary auto-detects format from base64 content
    resource_type: 'auto',
  });

  return {
    url:       result.secure_url,  // HTTPS URL to display the image
    public_id: result.public_id,   // ID to delete the image later
  };
};

// ── deleteImage ──────────────────────────────────────────────
// Takes a Cloudinary public_id and permanently deletes the image.
// Called when: product deleted, product expired, image replaced.
export const deleteImage = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
};

// ── uploadMultiple ───────────────────────────────────────────
// Uploads an array of base64 strings, returns arrays of urls and public_ids.
// Used in createProduct when seller uploads multiple photos at once.
export const uploadMultiple = async (base64Array) => {
  const uploads = await Promise.all(
    base64Array.map(b64 => uploadImage(b64))
  );

  return {
    urls:      uploads.map(u => u.url),
    publicIds: uploads.map(u => u.public_id),
  };
};

// ── deleteMultiple ───────────────────────────────────────────
// Deletes an array of Cloudinary images.
// Used in cleanup job and product deletion.
export const deleteMultiple = async (publicIds) => {
  // Promise.allSettled (not Promise.all) — even if one delete fails,
  // the others still run. We don't want one bad image to block all deletes.
  await Promise.allSettled(
    publicIds.map(id => deleteImage(id))
  );
};