import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import api from '../api';
import ProductCard from '../components/ProductCard';
import CircularNav from '../components/CircularNav';
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
  <div className="gallery-skeleton">
    <Skeleton className="gallery-skeleton-image" />
    <div className="gallery-skeleton-copy">
      <Skeleton style={{ height: '12px', width: '58%' }} />
      <Skeleton style={{ height: '10px', width: '28%' }} />
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

  useEffect(() => {
    document.body.classList.add('browse-gallery-page');
    return () => document.body.classList.remove('browse-gallery-page');
  }, []);

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
        body.browse-gallery-page { background: #050505; color: #f4f4f4; }
        body.browse-gallery-page .minimal-nav-spacer { background: #050505; }
        .browse-shell { min-height: calc(100vh - 72px); color: #f4f4f4; background-color: #050505; background-image: radial-gradient(circle, rgba(255,255,255,.2) 1px, transparent 1.35px); background-size: 144px 144px; background-position: 31px 32px; }
        .gallery-page { width: min(1180px, calc(100% - 48px)); margin: 0 auto; padding: 31px 0 150px; }
        .gallery-heading { text-align: center; }
        .gallery-heading h1 { margin: 0; font-family: 'Courier New', monospace; font-size: clamp(31px, 3.2vw, 43px); font-weight: 700; line-height: 1; letter-spacing: -.075em; text-transform: uppercase; }
        .gallery-search-note { margin-top: 9px; color: #888; font-size: 12px; }
        .gallery-search-note button { margin-left: 4px; padding: 0; border: 0; background: none; color: #ddd; font: inherit; text-decoration: underline; cursor: pointer; }
        .gallery-toolbar { min-height: 62px; margin-top: 22px; display: flex; align-items: center; justify-content: flex-end; gap: 18px; color: #aaa; }
        .gallery-toolbar-count { margin-right: auto; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
        .gallery-toolbar select, .gallery-toolbar button, .gallery-toolbar a { padding: 0 0 3px; border: 0; border-bottom: 1px solid transparent; border-radius: 0; background: #050505; color: #aaa; font: inherit; font-size: 10px; letter-spacing: .07em; text-decoration: none; text-transform: uppercase; cursor: pointer; }
        .gallery-toolbar select:hover, .gallery-toolbar button:hover, .gallery-toolbar a:hover { color: #fff; border-bottom-color: #888; }
        .gallery-toolbar button:disabled { opacity: .45; cursor: wait; }
        .gallery-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: clamp(62px, 8vw, 138px); row-gap: 102px; padding-top: 24px; }
        .gallery-product { min-width: 0; display: flex; flex-direction: column; align-items: center; color: #f4f4f4; text-decoration: none; }
        .gallery-product-visual { width: 100%; height: clamp(235px, 24vw, 316px); display: grid; place-items: center; }
        .gallery-product-visual img { width: 100%; height: 100%; object-fit: contain; transition: transform .32s cubic-bezier(.2,.7,.2,1); }
        .gallery-product:hover .gallery-product-visual img { transform: scale(1.035); }
        .gallery-product-placeholder { width: 62%; height: 72%; display: grid; place-items: center; border: 1px solid rgba(255,255,255,.12); color: #666; }
        .gallery-product-copy { max-width: 100%; margin-top: 15px; text-align: center; }
        .gallery-product-copy h3 { max-width: 100%; margin: 0; overflow: hidden; color: #ededed; font-family: Georgia, 'Times New Roman', serif; font-size: 15px; font-weight: 400; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
        .gallery-product-copy p { margin: 5px 0 0; color: #777; font-size: 11px; font-variant-numeric: tabular-nums; }
        .gallery-skeleton { display: flex; flex-direction: column; align-items: center; }
        .gallery-skeleton-image { width: 72%; height: clamp(235px, 24vw, 316px); border-radius: 2px; background: #151515; }
        .gallery-skeleton-copy { width: 60%; margin-top: 16px; display: grid; justify-items: center; gap: 7px; }
        .gallery-skeleton-copy > * { background: #1c1c1c; }
        .gallery-message { max-width: 560px; margin: 70px auto 0; padding: 36px 28px; text-align: center; color: #777; }
        .gallery-message svg { margin: 0 auto; display: block; }
        .gallery-message-title { margin: 15px 0 6px; color: #eee; font-family: Georgia, 'Times New Roman', serif; font-size: 18px; }
        .gallery-message p { margin: 0 0 20px; font-size: 13px; }
        .gallery-message button, .gallery-load-more { padding: 8px 0 4px; border: 0; border-bottom: 1px solid #ddd; background: transparent; color: #ddd; font: inherit; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; }
        .gallery-error { max-width: 520px; margin: 35px auto; padding: 16px; border: 1px solid #693a3f; color: #e0a0a7; text-align: center; font-size: 13px; }
        .gallery-error button { margin-left: 15px; border: 0; border-bottom: 1px solid currentColor; background: none; color: inherit; cursor: pointer; }
        .gallery-load-wrap { display: flex; justify-content: center; margin-top: 70px; }
        @media (max-width: 800px) {
          .gallery-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 38px; row-gap: 72px; }
          .gallery-product-visual, .gallery-skeleton-image { height: min(43vw, 310px); }
        }
        @media (max-width: 560px) {
          .browse-shell { background-size: 96px 96px; background-position: 20px 20px; }
          .gallery-page { width: calc(100% - 28px); padding-top: 24px; }
          .gallery-toolbar { min-height: 76px; gap: 10px 14px; flex-wrap: wrap; justify-content: center; }
          .gallery-toolbar-count { width: 100%; margin-right: 0; text-align: center; }
          .gallery-grid { column-gap: 18px; row-gap: 52px; padding-top: 14px; }
          .gallery-product-visual, .gallery-skeleton-image { height: 47vw; }
          .gallery-product-copy { margin-top: 10px; }
          .gallery-product-copy h3 { font-size: 13px; }
        }
        @media (max-width: 360px) {
          .gallery-grid { grid-template-columns: 1fr; }
          .gallery-product-visual, .gallery-skeleton-image { height: 270px; }
        }
      `}</style>

      <main className="browse-shell">
        <div className="gallery-page">
          <header className="gallery-heading">
            <h1>{category === 'All' ? 'Products' : category}</h1>
            {appliedSearch && <p className="gallery-search-note">Results for “{appliedSearch}” <button type="button" onClick={clearSearch}>Clear</button></p>}
          </header>

          <div className="gallery-toolbar" aria-label="Product controls">
            {!loading && <span className="gallery-toolbar-count">{products.length === 0 ? 'No listings' : `${products.length} item${products.length === 1 ? '' : 's'}`}</span>}
            <select className="srt" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="">Newest</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
            </select>
            <button
              type="button"
              onClick={() => fetchProducts({ force: true })}
              disabled={refreshing}
              title={lastUpdated ? `Last updated ${new Date(lastUpdated).toLocaleTimeString()}` : 'Fetch the latest listings'}
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <Link to="/closed-deals">Closed deals</Link>
            <Link to="/sell">List item +</Link>
          </div>

        {error && (
          <div className="gallery-error">
            {error}
            <button type="button" onClick={() => fetchProducts({ force: true })}>Retry</button>
          </div>
        )}

        {loading && (
          <div className="gallery-grid">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="gallery-message">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <div className="gallery-message-title">Nothing here yet</div>
            <p>{appliedSearch || category !== 'All' ? 'Try different terms or clear filters.' : 'Be the first to list something.'}</p>
            {(appliedSearch || category !== 'All') && <button type="button" onClick={clearFilters}>Clear filters</button>}
          </div>
        )}

        {!loading && products.length > 0 && (
          <>
            <div className="gallery-grid">
              {products.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
            {nextCursor && (
              <div className="gallery-load-wrap">
                <button
                  type="button"
                  className="gallery-load-more"
                  disabled={loadingMore}
                  onClick={loadMoreProducts}
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
        </div>
      </main>
      <CircularNav />
    </>
  );
};

export default Browse;
