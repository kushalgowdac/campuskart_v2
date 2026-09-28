import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';

const ClosedDeals = () => {
  const [products, setProducts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const fetchPage = async (cursor = null) => {
    const params = new URLSearchParams({ page: 'cursor' });
    if (cursor) params.set('cursor', cursor);
    const response = await api.get(`/api/products/closed?${params.toString()}`);
    return response.data;
  };

  useEffect(() => {
    let active = true;
    fetchPage()
      .then(data => {
        if (!active) return;
        setProducts(data?.items || []);
        setNextCursor(data?.nextCursor || null);
      })
      .catch(() => active && setError('Failed to load closed deals.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError('');
    try {
      const data = await fetchPage(nextCursor);
      setProducts(previous => {
        const existingIds = new Set(previous.map(product => product.id));
        return [...previous, ...(data?.items || []).filter(product => !existingIds.has(product.id))];
      });
      setNextCursor(data?.nextCursor || null);
    } catch {
      setError('Failed to load more closed deals.');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <main className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>Closed deals</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Items marked as sold stay here until 90 days after their original listing date.
          </p>
        </div>
        <Link to="/browse" className="btn-secondary">Back to listings</Link>
      </div>

      {error && <div style={{ padding: '14px', marginBottom: '20px', borderRadius: 'var(--radius-md)', background: 'var(--color-danger-subtle)', color: 'var(--color-danger)' }}>{error}</div>}

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="skeleton" style={{ aspectRatio: '4/3', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '72px 20px', color: 'var(--color-text-muted)' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '8px' }}>No closed deals yet</p>
          <p>Sold products will appear here.</p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {products.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
          {nextCursor && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
              <button type="button" className="btn-secondary" disabled={loadingMore} onClick={loadMore}>
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default ClosedDeals;
