// ============================================================
// utils/compressImage.js — Browser-side image compression
// ============================================================
// HOW THIS WORKS:
// The browser's Canvas API can draw any image and export it
// as a JPEG at a specified quality level. This is how most
// image compression in browsers works — no external library needed.
//
// Steps:
// 1. Create an <img> element and load the file into it
// 2. Draw the image onto a <canvas> element at reduced dimensions
// 3. Export the canvas as a JPEG base64 string at quality 0.8
// 4. Result is typically 70-90% smaller than the original
//
// WHY CANVAS and not a library like browser-image-compression?
// Zero dependencies. The Canvas API is built into every browser.
// For our use case (compress before upload), it's perfectly sufficient.
// Libraries add bundle size for marginal quality improvement.
//
// QUALITY 0.8 = 80% JPEG quality. This is the industry standard
// for web images — visually indistinguishable from 100% at 1/3 the size.
// Instagram, Twitter, WhatsApp all compress to ~80% JPEG.
// ============================================================

const MAX_WIDTH  = 1200; // px — enough for full-screen display
const MAX_HEIGHT = 1200; // px — maintains aspect ratio
const QUALITY    = 0.82; // JPEG quality (0-1). 0.82 = visually lossless

// ── compressImage ─────────────────────────────────────────────
// Takes a File object (from <input type="file">)
// Returns a Promise that resolves to a base64 data URL (compressed)
// and the compressed size in KB for display.
export const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    // Step 1: Read the file as a data URL
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      // Step 2: Load that data URL into an Image element
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        // Step 3: Calculate new dimensions maintaining aspect ratio
        // If image is smaller than max, don't upscale it
        let { width, height } = img;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width  = Math.round(width  * ratio);
          height = Math.round(height * ratio);
        }

        // Step 4: Draw onto canvas at new dimensions
        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Step 5: Export as JPEG base64
        // toDataURL('image/jpeg', quality) compresses to JPEG
        // JPEG doesn't support transparency — if original had alpha
        // (PNG with transparent bg), the transparent parts become white
        const compressed = canvas.toDataURL('image/jpeg', QUALITY);

        // Calculate compressed size for display
        // base64 length * 0.75 = approximate byte size
        const compressedBytes = Math.round(compressed.length * 0.75);
        const compressedKB    = Math.round(compressedBytes / 1024);
        const originalKB      = Math.round(file.size / 1024);

        resolve({
          base64:       compressed,
          compressedKB,
          originalKB,
          // How much we saved — useful for showing "Compressed: 2.1MB → 180KB"
          savedPercent: Math.round((1 - compressedKB / originalKB) * 100),
        });
      };

      img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
    };

    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
  });
};

// ── compressMultiple ──────────────────────────────────────────
// Compresses an array of File objects in parallel.
// Returns array of compression results.
export const compressMultiple = async (files) => {
  // Promise.all: compress all images simultaneously
  // If one fails, the whole thing fails — better than silent partial failure
  return Promise.all(files.map(file => compressImage(file)));
};
