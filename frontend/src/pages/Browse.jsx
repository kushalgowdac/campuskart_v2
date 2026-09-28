import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import api from '../api';
import ProductCard from '../components/ProductCard';
import {
  PRODUCT_LIST_CACHE_TTL,
  productListCacheKey,
  readMarketplaceCache,
  writeMarketplaceCache,
} from '../utils/marketplaceCache';

const CATEGORIES = ['All', 'Books', 'Electronics', 'Clothing', 'Stationery', 'Sports', 'Other'];

const normalizeProductsPage = (data) => Array.isArray(data)
  ? { items: data, nextCursor: null }
  : { items: data?.items || [], nextCursor: data?.nextCursor || null };

// Skeleton card shows the SHAPE of a product card while data loads.
// Better UX than "Loading..." text — user sees layout immediately.
const SkeletonCard = () => (
  <div className="card" style={{ overflow: 'hidden' }}>
    <Skeleton style={{ aspectRatio: '4/3', width: '100%' }} />
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Skeleton style={{ height: '14px', width: '75%' }} />
      <Skeleton style={{ height: '18px', width: '40%' }} />
      <Skeleton style={{ height: '12px', width: '60%', marginTop: '4px' }} />
    </div>
  </div>
);

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [nextCursor, setNextCursor]       = useState(null);
  const [error, setError]                 = useState('');
  const [lastUpdated, setLastUpdated]     = useState(null);
  const [searchInput, setSearchInput]     = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [category, setCategory]           = useState('All');
  const [sort, setSort]                   = useState('');
  const requestIdRef = useRef(0);

  useEffect(() => {
    const query = searchParams.get('q') || '';
    const requestedCategory = searchParams.get('category') || 'All';
    Promise.resolve().then(() => {
      setSearchInput(query);
      setAppliedSearch(query);
      setCategory(CATEGORIES.includes(requestedCategory) ? requestedCategory : 'All');
    });
  }, [searchParams]);

  // useCallback: memoize this function so it has a stable reference
  // across renders, unless appliedSearch/category/sort actually change.
  const fetchProducts = useCallback(async ({ force = false } = {}) => {
    const requestId = ++requestIdRef.current;
    // Keep state updates asynchronous when this function is started by an effect.
    await Promise.resolve();
    if (requestId !== requestIdRef.current) return;
    setError('');
    const params = new URLSearchParams();
    params.append('page', 'cursor');
    if (appliedSearch)      params.append('q',        appliedSearch);
    if (category !== 'All') params.append('category', category);
    if (sort)               params.append('sort',     sort);

    const queryString = params.toString();
    const cacheKey = productListCacheKey(queryString);
    const cached = force
      ? null
      : readMarketplaceCache(cacheKey, PRODUCT_LIST_CACHE_TTL);

    if (cached) {
      if (requestId !== requestIdRef.current) return;
      const pageData = normalizeProductsPage(cached.data);
      setProducts(pageData.items);
      setNextCursor(pageData.nextCursor);
      setLastUpdated(cached.savedAt);
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      return;
    }

    setLoadingMore(false);
    if (force) setRefreshing(true);
    else {
      setLoading(true);
      setRefreshing(false);
    }

    try {
      const res = await api.get(`/api/products${queryString ? `?${queryString}` : ''}`);
      const pageData = normalizeProductsPage(res.data);
      writeMarketplaceCache(cacheKey, pageData);
      if (requestId !== requestIdRef.current) return;
      setProducts(pageData.items);
      setNextCursor(pageData.nextCursor);
      setLastUpdated(Date.now());
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError('Failed to load products.');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [appliedSearch, category, sort]);

  const loadMoreProducts = async () => {
    if (!nextCursor || loadingMore) return;

    const requestId = ++requestIdRef.current;
    setLoadingMore(true);
    setError('');

    const params = new URLSearchParams();
    params.append('page', 'cursor');
    if (appliedSearch)      params.append('q',        appliedSearch);
    if (category !== 'All') params.append('category', category);
    if (sort)               params.append('sort',     sort);
    const baseQueryString = params.toString();
    params.append('cursor', nextCursor);

    try {
      const res = await api.get(`/api/products?${params.toString()}`);
      if (requestId !== requestIdRef.current) return;
      const pageData = normalizeProductsPage(res.data);

      setProducts(previous => {
        const existingIds = new Set(previous.map(product => product.id));
        const newItems = pageData.items.filter(product => !existingIds.has(product.id));
        const combined = [...previous, ...newItems];
        writeMarketplaceCache(productListCacheKey(baseQueryString), {
          items: combined,
          nextCursor: pageData.nextCursor,
        });
        return combined;
      });
      setNextCursor(pageData.nextCursor);
      setLastUpdated(Date.now());
    } catch {
      if (requestId === requestIdRef.current) setError('Failed to load more products.');
    } finally {
      if (requestId === requestIdRef.current) setLoadingMore(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchProducts());
  }, [fetchProducts]);

  // Mobile keyboards do not consistently submit forms from their arrow/Go key.
  // Apply the query after a short pause as a reliable fallback on every device.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setAppliedSearch(searchInput.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const clearSearch = () => {
    setSearchInput('');
    setAppliedSearch('');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('q');
    setSearchParams(nextParams, { replace: true });
  };

  const clearFilters = () => {
    setSearchInput('');
    setAppliedSearch('');
    setCategory('All');
    setSearchParams({}, { replace: true });
  };

  return (
    <>
      <style>{`
        .filter-bar { position: sticky; top: 110px; z-index: 90; background: rgba(3,9,20,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid var(--color-border); }
        .filter-controls { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .srt { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 13px; font-family: var(--font-sans); background: var(--color-bg-subtle); color: var(--color-text-secondary); cursor: pointer; outline: none; }
        @media (max-width: 600px) {
          .filter-bar { top: 154px; }
          .filter-controls { align-items: stretch; }
          .filter-label { flex-basis: 100%; }
        }
      `}</style>

      <div className="filter-bar">
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '12px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="filter-controls">
            <span className="filter-label" style={{ marginRight: 'auto', color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: 650 }}>Browse products</span>
            <select className="srt" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="">Newest</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
            </select>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => fetchProducts({ force: true })}
              disabled={refreshing}
              style={{ padding: '9px 12px', fontSize: '13px' }}
              title={lastUpdated ? `Last updated ${new Date(lastUpdated).toLocaleTimeString()}` : 'Fetch the latest listings'}
            >
              {refreshing ? 'Refreshing…' : '↻ Refresh listings'}
            </button>
            <Link to="/closed-deals" className="btn-secondary" style={{ padding: '9px 12px', fontSize: '13px' }}>
              Closed deals
            </Link>
            <Link to="/sell" className="btn-primary" style={{ padding: '9px 16px', fontSize: '13px' }}>+ List item</Link>
          </div>
        </div>
      </div>

      <div className="page">
        {!loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', letterSpacing: '-0.03em' }}>{category === 'All' ? 'Latest listings' : category}</h2>
              {appliedSearch && <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Results for "<strong>{appliedSearch}</strong>" <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>×</button></span>}
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>{products.length === 0 ? 'No listings found' : `${products.length} listing${products.length !== 1 ? 's' : ''}`}</p>
          </div>
        )}

        {error && (
          <div style={{ padding: '16px', background: 'var(--color-danger-subtle)', border: '1px solid #70313c', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {error}
            <button onClick={() => fetchProducts({ force: true })} className="btn-secondary" style={{ fontSize: '12px', padding: '5px 10px' }}>Retry</button>
          </div>
        )}

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--color-text-muted)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto', display: 'block' }}>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-secondary)', margin: '16px 0 8px' }}>Nothing here yet</p>
            <p style={{ fontSize: '14px', margin: '0 0 24px' }}>{appliedSearch || category !== 'All' ? 'Try different terms or clear filters' : 'Be the first to list something'}</p>
            {(appliedSearch || category !== 'All') && <button onClick={clearFilters} className="btn-secondary">Clear filters</button>}
          </div>
        )}

        {!loading && products.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {products.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
            {nextCursor && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={loadingMore}
                  onClick={loadMoreProducts}
                  style={{ minWidth: '140px' }}
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Browse;
