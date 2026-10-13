import { memo } from 'react';
import { Link } from 'react-router-dom';
import { productCardImage } from '../utils/cloudinaryImage';

const ProductCard = memo(({ product }) => {
  const imageUrl = product.image_url || product.image_urls?.[0];
  const price = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  return (
    <Link className="gallery-product" to={`/product/${product.id}`} aria-label={`View ${product.title}, priced at ${price}`}>
      <div className="gallery-product-visual">
        {imageUrl ? (
          <img src={productCardImage(imageUrl)} alt={product.title} loading="lazy" />
        ) : (
          <div className="gallery-product-placeholder" aria-hidden="true">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>
      <div className="gallery-product-copy">
        <h3>{product.title}</h3>
        <p>{price}</p>
      </div>
    </Link>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
