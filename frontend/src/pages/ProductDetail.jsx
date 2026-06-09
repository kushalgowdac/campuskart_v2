import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const ProductDetail = () => {
  const { id } = useParams();
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/api/products/${id}`);
        setProduct(res.data);
      } catch {
        setError('Product not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(price);

  const handleInterest = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    navigate(`/contact/${id}`);
  };

  if (loading) return (
    <div className="label-caps" style={{ textAlign: 'center', padding: '6rem', color: 'var(--muted-foreground)' }}>
      LOADING PRODUCT SPECS...
    </div>
  );

  if (error || !product) return (
    <div className="brutalist-card" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', borderColor: '#ef4444' }}>
      <span className="label-caps" style={{ color: '#ef4444' }}>{error || 'PRODUCT NOT FOUND'}</span>
    </div>
  );

  const isOwnProduct = user?.id === product.seller?.id;
  const images = product.image_urls || [];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="brutalist-btn"
        style={{ marginBottom: '2rem', height: '40px', minHeight: '40px', padding: '0 1rem', fontSize: '0.8rem' }}
      >
        ← BACK TO BROWSE
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>

        {/* Left: images */}
        <div>
          <div className="brutalist-card" style={{
            padding: 0,
            overflow: 'hidden',
            height: '400px',
            marginBottom: '1rem',
          }}>
            {images.length > 0 ? (
              <img
                src={images[activeImage]}
                alt={product.title}
                loading="lazy"
                decoding="async"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>
                📦
              </div>
            )}
          </div>
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {images.map((url, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImage(i)}
                  style={{
                    width: '64px',
                    height: '64px',
                    cursor: 'pointer',
                    border: i === activeImage ? '2px solid var(--foreground)' : '2px solid var(--border)',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={url}
                    alt={`Thumbnail ${i}`}
                    loading="lazy"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: details */}
        <div>
          <span className="brutalist-badge brutalist-badge-accent" style={{ marginBottom: '1rem' }}>
            {product.category}
          </span>

          <h1 className="display-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', marginBottom: '1rem', lineHeight: '1' }}>
            {product.title}
          </h1>

          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 1.5rem', letterSpacing: '-0.03em' }}>
            {formatPrice(product.price)}
          </p>

          {product.description && (
            <div style={{ marginBottom: '2rem' }}>
              <label className="label-caps" style={{ display: 'block', marginBottom: '0.5rem' }}>DESCRIPTION //</label>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
                {product.description}
              </p>
            </div>
          )}

          {/* Notes to buyer */}
          {product.notes_to_buyer && (
            <div style={{
              marginBottom: '2rem',
              padding: '12px 16px',
              border: '2px dashed var(--border)',
              fontSize: '0.85rem',
              color: 'var(--muted-foreground)',
              lineHeight: 1.5,
            }}>
              <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block', marginBottom: '4px' }}>📝 SELLER'S NOTE:</span>
              {product.notes_to_buyer}
            </div>
          )}

          {/* Seller info */}
          <div className="brutalist-card" style={{
            background: 'var(--muted)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}>
            <p className="label-caps" style={{ margin: '0 0 0.5rem', fontSize: '0.7rem' }}>SELLER SPECIFICATIONS</p>
            <p style={{ margin: '0 0 0.5rem', fontWeight: 700, color: 'var(--foreground)', fontSize: '1.1rem', textTransform: 'uppercase' }}>
              👤 {product.seller?.name}
            </p>
            {/* Available contact channels as badges */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {product.seller?.instagram && (
                <span style={{ fontSize: '0.65rem', padding: '2px 8px', border: '1px solid var(--border)', fontWeight: 700 }}>📸 IG</span>
              )}
              {product.seller?.telegram && (
                <span style={{ fontSize: '0.65rem', padding: '2px 8px', border: '1px solid var(--border)', fontWeight: 700 }}>✈️ TG</span>
              )}
              {product.seller?.gmail && (
                <span style={{ fontSize: '0.65rem', padding: '2px 8px', border: '1px solid var(--border)', fontWeight: 700 }}>📧 GMAIL</span>
              )}
              {product.seller?.reddit && (
                <span style={{ fontSize: '0.65rem', padding: '2px 8px', border: '1px solid var(--border)', fontWeight: 700 }}>🔗 RD</span>
              )}
            </div>
            {product.seller?.meeting_note && (
              <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                📍 {product.seller.meeting_note}
              </p>
            )}
          </div>

          {/* Interest count */}
          {product.interest_count > 0 && (
            <p className="label-caps" style={{ color: 'var(--foreground)', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
              🔥 {product.interest_count} {product.interest_count === 1 ? 'PERSON' : 'PEOPLE'} INTERESTED IN THIS ITEM
            </p>
          )}

          {/* Responsibility warning */}
          <div style={{
            border: '2px solid #D97706',
            padding: '12px 16px',
            marginBottom: '2rem',
            fontSize: '0.75rem',
            color: '#F59E0B',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}>
            ⚠️ TRANSACTION SAFETY WARNING: ALWAYS MEET IN A PUBLIC PLACE ON CAMPUS. VERIFY THE ITEM'S CONDITION BEFORE SENDING PAYMENTS.
          </div>

          {/* CTA button */}
          {!isOwnProduct && product.status === 'live' && (
            <button
              onClick={handleInterest}
              className="brutalist-btn brutalist-btn-primary"
              style={{
                width: '100%',
                height: '56px',
                fontSize: '1rem',
              }}
            >
              I'M INTERESTED — INITIATE DEAL
            </button>
          )}

          {isOwnProduct && (
            <div className="brutalist-card" style={{
              padding: '1.25rem',
              borderColor: '#059669',
              background: 'rgba(5, 150, 105, 0.05)',
              fontSize: '0.9rem',
              color: '#34D399',
              textAlign: 'center',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}>
              THIS IS YOUR LISTING. MANAGE STATUS VIA <a href="/dashboard" style={{ textDecoration: 'underline', color: 'var(--foreground)' }}>MY LISTINGS</a>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
