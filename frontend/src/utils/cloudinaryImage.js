const CLOUDINARY_UPLOAD_SEGMENT = '/image/upload/';

export const cloudinaryImage = (url, transformation) => {
  if (!url || !transformation || !url.includes(CLOUDINARY_UPLOAD_SEGMENT)) {
    return url;
  }

  return url.replace(
    CLOUDINARY_UPLOAD_SEGMENT,
    `${CLOUDINARY_UPLOAD_SEGMENT}${transformation}/`
  );
};

export const productCardImage = (url) =>
  cloudinaryImage(url, 'f_auto,q_auto,w_600,h_450,c_fill');

export const squareThumbnailImage = (url, width = 160) =>
  cloudinaryImage(url, `f_auto,q_auto,w_${width},h_${width},c_fill`);

export const productDetailImage = (url) =>
  cloudinaryImage(url, 'f_auto,q_auto,w_1200,c_limit');
