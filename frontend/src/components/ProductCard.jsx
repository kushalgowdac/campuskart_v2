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
    if (days === 0) return 'TODAY';
    if (days === 1) return '1 DAY AGO';
    return `${days} DAYS AGO`;
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="brutalist-card interactive"
      style={{
        overflow: 'hidden',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      {/* Product image */}
      <div style={{ height: '200px', background: '#18181b', overflow: 'hidden', borderBottom: '2px solid var(--border)' }}>
        {product.image_urls?.[0] ? (
          <img
            src={product.image_urls[0]}
            alt={product.title}
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
          }}>
            📦
          </div>
        )}
      </div>

      {/* Card content */}
      <div style={{ padding: '1.25rem' }}>
        {/* Category badge */}
        <span className="brutalist-badge" style={{ marginBottom: '0.75rem' }}>
          {product.category}
        </span>

        {/* Title */}
        <h3 className="card-title" style={{
          margin: '0 0 6px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
        }}>
          {product.title}
        </h3>

        {/* Price */}
        <p className="card-price" style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--foreground)',
          margin: '0 0 12px',
        }}>
          {formatPrice(product.price)}
        </p>

        {/* Seller + time */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
        }}>
          <span className="card-seller text-muted" style={{ fontWeight: 700, textTransform: 'uppercase' }}>👤 {product.seller?.name || 'UNKNOWN'}</span>
          <span className="card-date text-muted" style={{ fontWeight: 700 }}>{daysAgo(product.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;