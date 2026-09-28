import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="skeleton" style={{ aspectRatio: '4/3', width: '100%' }} />
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="skeleton" style={{ height: '14px', width: '75%', borderRadius: '4px' }} />
      <div className="skeleton" style={{ height: '18px', width: '40%', borderRadius: '4px' }} />
      <div className="skeleton" style={{ height: '12px', width: '60%', borderRadius: '4px', marginTop: '4px' }} />
    </div>
  </div>
);

const Browse = () => {
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(searchInput.trim());
    e.currentTarget.querySelector('input')?.blur();
  };

  const handleSearchKeyDown = (e) => {
    if (e.key !== 'Enter' && e.keyCode !== 13) return;

    e.preventDefault();
    setAppliedSearch(searchInput.trim());
    e.currentTarget.blur();
  };

  const clearSearch = () => {
    setSearchInput('');
    setAppliedSearch('');
  };

  return (
    <>
      <style>{`
        .filter-bar { position: sticky; top: 60px; z-index: 90; background: rgba(3,9,20,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid var(--color-border); }
        .filter-controls { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .search-form { display: flex; flex: 1 1 320px; max-width: 520px; gap: 8px; }
        .search-field { position: relative; flex: 1; min-width: 0; }
        .cat-chip { padding: 6px 14px; border-radius: 999px; border: 1px solid var(--color-border); background: var(--color-bg-subtle); color: var(--color-text-secondary); cursor: pointer; font-size: 13px; font-weight: 500; font-family: var(--font-sans); transition: all 0.15s; white-space: nowrap; }
        .cat-chip:hover { border-color: var(--color-text-primary); color: var(--color-text-primary); }
        .cat-chip.active { background: var(--color-accent); border-color: var(--color-accent); color: #04101c; }
        .srch { width: 100%; padding: 10px 38px 10px 40px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 14px; font-family: var(--font-sans); outline: none; background: var(--color-bg-subtle); color: var(--color-text-primary); transition: border-color 0.15s, background 0.15s; }
        .srch::-webkit-search-cancel-button { appearance: none; }
        .srch:focus { border-color: var(--color-accent); background: var(--color-bg-subtle); }
        .srch::placeholder { color: var(--color-text-muted); }
        .srt { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 13px; font-family: var(--font-sans); background: var(--color-bg-subtle); color: var(--color-text-secondary); cursor: pointer; outline: none; }
        @media (max-width: 600px) {
          .filter-controls { align-items: stretch; }
          .search-form { flex-basis: 100%; max-width: none; }
          .search-submit { min-width: 78px; }
        }
      `}</style>

      {/* No hero banner. Filter bar sticks below navbar, products visible immediately. */}
      <div className="filter-bar">
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '12px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="filter-controls">
            <form className="search-form" role="search" onSubmit={handleSearchSubmit}>
              <div className="search-field">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="search" enterKeyHint="search" className="srch" placeholder="Search products…" value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={handleSearchKeyDown} aria-label="Search products" />
                {searchInput && (
                  <button type="button" onClick={clearSearch} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: '4px' }} aria-label="Clear search">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>
              <button type="submit" className="btn-primary search-submit" style={{ padding: '9px 14px', fontSize: '13px' }}>Search</button>
            </form>
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
              style={{ padding: '9px 12px', fontSize: '13px', marginLeft: 'auto' }}
              title={lastUpdated ? `Last updated ${new Date(lastUpdated).toLocaleTimeString()}` : 'Fetch the latest listings'}
            >
              {refreshing ? 'Refreshing…' : '↻ Refresh listings'}
            </button>
            <Link to="/closed-deals" className="btn-secondary" style={{ padding: '9px 12px', fontSize: '13px' }}>
              Closed deals
            </Link>
            <Link to="/sell" className="btn-primary" style={{ padding: '9px 16px', fontSize: '13px' }}>+ List item</Link>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '2px' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} className={`cat-chip${category === cat ? ' active' : ''}`}>{cat}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="page">
        {!loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {products.length === 0 ? 'No listings found' : `${products.length} listing${products.length !== 1 ? 's' : ''} loaded`}
            </p>
            {appliedSearch && (
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                for "<strong>{appliedSearch}</strong>"
                <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', marginLeft: '4px' }}>×</button>
              </span>
            )}
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
            {(appliedSearch || category !== 'All') && <button onClick={() => { clearSearch(); setCategory('All'); }} className="btn-secondary">Clear filters</button>}
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
