import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { productCardImage } from '../utils/cloudinaryImage';

const PAGE_LOADED_AT = Date.now();

// ── React.memo ────────────────────────────────────────────────
// memo() wraps the component and tells React: "only re-render this
// component if its props actually changed."
// Without memo, every time Browse re-renders (e.g. setLoading(true)),
// ALL ProductCards re-render even though their product data didn't change.
// With memo, React compares the previous and new `product` prop — if
// identical (same object reference or shallow equal), it skips the re-render.
// For a grid of 20 cards this saves 19 unnecessary re-renders per search.

const ProductCard = memo(({ product }) => {
  const navigate = useNavigate();
  const imageUrl = product.image_url || product.image_urls?.[0];

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);

  const timeAgo = (dateStr) => {
    const diff = PAGE_LOADED_AT - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1d ago';
    if (days < 7)  return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <>
      {/* ── Scoped CSS via <style> tag ──────────────────────────
          CSS hover states cannot be expressed in inline JS style objects —
          you need real CSS selectors. This <style> block scopes the hover
          rule to cards only. The card-hover class handles the lift effect
          purely in CSS — no JS onMouseEnter/onMouseLeave needed.
          This is more performant AND works on touch devices correctly. */}
      <style>{`
        .product-card {
          background: var(--color-bg-subtle);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
        }
        .product-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
          border-color: var(--color-border-strong);
        }
        .product-card:active {
          transform: translateY(-1px);
        }
        .product-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          /* loading="lazy" handled as HTML attribute below */
          transition: transform 0.3s ease;
        }
        .product-card:hover .product-card-img {
          transform: scale(1.03);
        }
      `}</style>

      <Card
        className="product-card"
        onClick={() => navigate(`/product/${product.id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && navigate(`/product/${product.id}`)}
        aria-label={`View ${product.title}, priced at ${formatPrice(product.price)}`}
      >
        {/* Image container — fixed aspect ratio via padding trick */}
        <div style={{ aspectRatio: '4/3', background: 'var(--color-bg-subtle)', overflow: 'hidden', position: 'relative' }}>
          {imageUrl ? (
            <img
              src={productCardImage(imageUrl)}
              alt={product.title}
              className="product-card-img"
              loading="lazy"
              // loading="lazy": browser-native lazy loading.
              // Images outside the viewport are NOT downloaded until the user
              // scrolls near them. Zero JavaScript required. Cuts initial page
              // load time significantly when the grid has many products.
            />
          ) : (
            <div style={{
              height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--color-text-muted)',
            }}>
              <NoImageIcon />
            </div>
          )}

          {/* Category badge — overlaid on image */}
          <Badge variant="secondary" style={{
            position: 'absolute', top: '10px', left: '10px',
            background: 'rgba(3,9,20,0.88)',
            backdropFilter: 'blur(8px)',
            color: 'var(--color-text-secondary)',
            fontSize: '11px', fontWeight: 500,
            padding: '3px 9px', borderRadius: '999px',
            border: '1px solid var(--color-border-strong)',
          }}>
            {product.category}
          </Badge>
        </div>

        {/* Card body */}
        <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Title */}
          <h3 style={{
            fontSize: '14px', fontWeight: 600,
            color: 'var(--color-text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            lineHeight: 1.3,
          }}>
            {product.title}
          </h3>

          {/* Price */}
          <p className="text-price" style={{ fontSize: '16px', fontWeight: 700 }}>
            {formatPrice(product.price)}
          </p>

          {/* Seller + time — pushed to bottom */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginTop: 'auto', paddingTop: '8px',
            borderTop: '1px solid var(--color-border)',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              {product.seller?.name || 'Unknown'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              {timeAgo(product.created_at)}
            </span>
          </div>
        </div>
      </Card>
    </>
  );
});

ProductCard.displayName = 'ProductCard';

const NoImageIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

export default ProductCard;
