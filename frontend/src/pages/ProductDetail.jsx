import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { productDetailImage, squareThumbnailImage } from '../utils/cloudinaryImage';
import {
  PRODUCT_DETAIL_CACHE_TTL,
  productDetailCacheKey,
  readMarketplaceCache,
  writeMarketplaceCache,
} from '../utils/marketplaceCache';

const ProductDetail = () => {
  const { id } = useParams();
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [interested, setInterested] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = productDetailCacheKey(id);
    const load = async () => {
      // Keep state updates asynchronous when this function is started by an effect.
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      setError('');
      setActiveImage(0);
      const cached = readMarketplaceCache(cacheKey, PRODUCT_DETAIL_CACHE_TTL);
      if (cached) {
        if (cancelled) return;
        setProduct(cached.data);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/api/products/${id}`);
        if (cancelled) return;
        setProduct(res.data);
        writeMarketplaceCache(cacheKey, res.data);
      } catch {
        if (cancelled) return;
        setError('Product not found or no longer available.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  const handleInterest = () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setInterested(true);
    navigate(`/contact/${id}`);
  };

  if (loading) return (
    <div className="page" style={{ maxWidth: '900px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div className="skeleton" style={{ aspectRatio: '4/3', borderRadius: 'var(--radius-lg)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '8px' }}>
          <div className="skeleton" style={{ height: '12px', width: '60px', borderRadius: '4px' }} />
          <div className="skeleton" style={{ height: '24px', width: '80%', borderRadius: '4px' }} />
          <div className="skeleton" style={{ height: '28px', width: '40%', borderRadius: '4px' }} />
          <div className="skeleton" style={{ height: '80px', width: '100%', borderRadius: '4px', marginTop: '8px' }} />
        </div>
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="page" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>{error || 'Product not found'}</p>
      <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
    </div>
  );

  const isOwn  = user?.id === product.seller?.id;
  const images = product.image_urls || [];

  return (
    <>
      <style>{`
        .thumb { width: 56px; height: 56px; object-fit: cover; border-radius: var(--radius-sm); cursor: pointer; border: 2px solid transparent; transition: border-color 0.15s; flex-shrink: 0; }
        .thumb.active { border-color: var(--color-text-primary); }
        .thumb:hover  { border-color: var(--color-border-strong); }
        .main-img { width: 100%; height: 100%; object-fit: cover; transition: opacity 0.2s; }
        .main-img-wrap { cursor: zoom-in; }
        .main-img-wrap:hover::after {
          content: 'Click to view full size';
          position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
          background: rgba(0,0,0,0.65); color: white; font-size: 12px;
          padding: 4px 10px; border-radius: 20px; white-space: nowrap; pointer-events: none;
        }
        @media (max-width: 640px) { .product-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <div className="page" style={{ maxWidth: '1100px' }}>
        <button onClick={() => navigate(-1)} className="btn-ghost" style={{ marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 8px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>

        <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(340px, .85fr)', gap: '40px', alignItems: 'start' }}>

          {/* Images */}
          <div>
            {/* Main image — click to open full size */}
            <div
              className="main-img-wrap"
              style={{ aspectRatio: '4/3', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '10px', position: 'relative' }}
              onClick={() => images[activeImage] && window.open(images[activeImage], '_blank')}
              title="Click to view full size"
            >
              {images.length > 0 ? (
                <img src={productDetailImage(images[activeImage])} alt={product.title} className="main-img" loading="eager" />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {images.map((url, i) => (
                  <img key={i} src={squareThumbnailImage(url)} alt={`Photo ${i + 1}`}
                    className={`thumb${i === activeImage ? ' active' : ''}`}
                    loading="lazy" onClick={() => setActiveImage(i)} />
                ))}
              </div>
            )}

            {images.length > 0 && (
              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                Click image to view full size
              </p>
            )}
          </div>

          {/* Details */}
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', position: 'sticky', top: '84px' }}>
            <div>
              <Badge variant="secondary" style={{ marginBottom: '8px' }}>{product.category}</Badge>
              <h1 style={{ fontSize: '25px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.25, margin: '8px 0 0' }}>
                {product.title}
              </h1>
            </div>

            <p className="text-price" style={{ fontSize: '26px', margin: 0 }}>
              {formatPrice(product.price)}
            </p>

            {product.description && (
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                {product.description}
              </p>
            )}

            <hr className="divider" style={{ margin: 0 }} />

            {/* Seller */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                {product.seller?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 1px' }}>Listed by</p>
                <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{product.seller?.name || 'Unknown'}</p>
              </div>
            </div>

            {product.interest_count > 0 && (
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                {product.interest_count} {product.interest_count === 1 ? 'person' : 'people'} interested
              </p>
            )}

            <div style={{ padding: '12px 14px', display: 'flex', gap: '9px', background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              <ShieldCheck size={18} style={{ flexShrink: 0, color: 'var(--color-accent)' }} />
              <span>Meet in a safe, public place on campus and verify the item before paying.</span>
            </div>

            {!isOwn && product.status === 'live' && (
              <Button size="lg" style={{ width: '100%' }} onClick={handleInterest} disabled={interested}>
                {interested ? 'Opening seller details…' : "I'm Interested — Contact Seller"}
              </Button>
            )}

            {isOwn && (
              <div style={{ padding: '12px 14px', background: 'var(--color-success-subtle)', border: '1px solid #285f48', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--color-success)', textAlign: 'center' }}>
                This is your listing.{' '}
                <a href="/dashboard" style={{ color: 'var(--color-success)', fontWeight: 600 }}>Manage it in My Listings →</a>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default ProductDetail;
