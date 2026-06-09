// ============================================================
// pages/ProductDetail.jsx — Single product view
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const ProductDetail = () => {
  const { id } = useParams(); // gets :id from URL /product/:id
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
    <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
      Loading...
    </div>
  );

  if (error || !product) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: '#dc2626' }}>
      {error || 'Product not found'}
    </div>
  );

  const isOwnProduct = user?.id === product.seller?.id;
  const images = product.image_urls || [];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', marginBottom: '1rem', fontSize: '14px' }}
      >
        ← Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

        {/* Left: images */}
        <div>
          <div style={{
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#f3f4f6',
            height: '300px',
            marginBottom: '8px',
          }}>
            {images.length > 0 ? (
              <img
                src={images[activeImage]}
                alt={product.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
                📦
              </div>
            )}
          </div>
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '6px' }}>
              {images.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  onClick={() => setActiveImage(i)}
                  style={{
                    width: '56px', height: '56px', objectFit: 'cover',
                    borderRadius: '6px', cursor: 'pointer',
                    border: i === activeImage ? '2px solid #1d4ed8' : '2px solid transparent',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: details */}
        <div>
          <span style={{
            fontSize: '12px', background: '#eff6ff', color: '#1d4ed8',
            padding: '3px 10px', borderRadius: '20px', fontWeight: 500,
          }}>
            {product.category}
          </span>

          <h1 style={{ margin: '10px 0 6px', fontSize: '1.4rem', fontWeight: 700, color: '#111827' }}>
            {product.title}
          </h1>

          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#059669', margin: '0 0 12px' }}>
            {formatPrice(product.price)}
          </p>

          {product.description && (
            <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>
              {product.description}
            </p>
          )}

          {/* Seller info */}
          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '16px',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#6b7280' }}>Seller</p>
            <p style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: '15px' }}>
              👤 {product.seller?.name}
            </p>
          </div>

          {/* Interest count */}
          {product.interest_count > 0 && (
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '12px' }}>
              🔥 {product.interest_count} {product.interest_count === 1 ? 'person' : 'people'} interested
            </p>
          )}

          {/* Responsibility warning */}
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fcd34d',
            borderRadius: '8px',
            padding: '10px 12px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#92400e',
          }}>
            ⚠️ Always meet in a safe, public place on campus. Verify the item before paying.
          </div>

          {/* CTA button */}
          {!isOwnProduct && product.status === 'live' && (
            <button
              onClick={handleInterest}
              style={{
                width: '100%',
                padding: '14px',
                background: '#1d4ed8',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              I'm Interested — Contact Seller
            </button>
          )}

          {isOwnProduct && (
            <div style={{
              padding: '12px',
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#166534',
              textAlign: 'center',
            }}>
              This is your listing. Manage it in <a href="/dashboard" style={{ color: '#166534' }}>My Listings</a>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
