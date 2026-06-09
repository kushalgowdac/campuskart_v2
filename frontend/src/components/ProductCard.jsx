// ============================================================
// components/ProductCard.jsx — Reusable product card
// ============================================================
// WHY a separate component?
// The Browse page shows many products in a grid. Each card looks
// the same — image, title, price, category, seller name.
// Instead of repeating that HTML 50 times, we define it once here
// and reuse it: products.map(p => <ProductCard product={p} />)
//
// This is the React component model — build small reusable pieces,
// compose them into pages. Same as functions in regular programming.
// ============================================================

import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  // Format price in Indian Rupees
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Calculate days ago for "posted X days ago"
  const daysAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
      }}
    >
      {/* Product image */}
      <div style={{ height: '180px', background: '#f3f4f6', overflow: 'hidden' }}>
        {product.image_urls?.[0] ? (
          <img
            src={product.image_urls[0]}
            alt={product.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
          }}>
            📦
          </div>
        )}
      </div>

      {/* Card content */}
      <div style={{ padding: '12px' }}>
        {/* Category badge */}
        <span style={{
          fontSize: '11px',
          background: '#eff6ff',
          color: '#1d4ed8',
          padding: '2px 8px',
          borderRadius: '20px',
          fontWeight: 500,
        }}>
          {product.category}
        </span>

        {/* Title */}
        <h3 style={{
          margin: '8px 0 4px',
          fontSize: '14px',
          fontWeight: 600,
          color: '#111827',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {product.title}
        </h3>

        {/* Price */}
        <p style={{
          fontSize: '16px',
          fontWeight: 700,
          color: '#059669',
          margin: '0 0 8px',
        }}>
          {formatPrice(product.price)}
        </p>

        {/* Seller + time */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#6b7280',
        }}>
          <span>👤 {product.seller?.name || 'Unknown'}</span>
          <span>{daysAgo(product.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;