import { useState, useMemo, useEffect } from 'react';
import useFetch from '../hooks/useFetch';
import ProductCard from '../components/ProductCard';
import { SkeletonGrid } from '../components/Skeleton';

const CATEGORIES = ['All', 'Books', 'Electronics', 'Clothing', 'Stationery', 'Sports', 'Other'];

const Browse = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.append('q', debouncedSearch);
    if (category !== 'All') params.append('category', category);
    if (sort) params.append('sort', sort);
    params.append('limit', '50');
    return params.toString();
  }, [debouncedSearch, category, sort]);

  const { data, error, isLoading } = useFetch(`/api/products?${queryParams}`, {
    keepPreviousData: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const products = data?.items || [];

  return (
    <>
      {/* Full-width marquee */}
      <div className="marquee-wrapper">
        <div className="marquee-row-1">
          <div className="marquee-content" style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.82rem', letterSpacing: '0.12em' }}>
            <span>★ SENIORS HELPING JUNIORS</span><span>◆</span>
            <span>PASS IT FORWARD // NOT TRASH IT</span><span>◆</span>
            <span>YOUR BATCH'S BEST DEALS</span><span>◆</span>
            <span>LEARN FROM THOSE WHO'VE BEEN THERE</span><span>◆</span>
            <span>CAMPUSKART // BRIDGE THE GAP</span><span>◆</span>
            <span>SELL SMART. BUY LOCAL. CONNECT.</span><span>◆</span>
            <span>★ SENIORS HELPING JUNIORS</span><span>◆</span>
            <span>PASS IT FORWARD // NOT TRASH IT</span><span>◆</span>
            <span>YOUR BATCH'S BEST DEALS</span><span>◆</span>
            <span>LEARN FROM THOSE WHO'VE BEEN THERE</span><span>◆</span>
            <span>CAMPUSKART // BRIDGE THE GAP</span><span>◆</span>
            <span>SELL SMART. BUY LOCAL. CONNECT.</span><span>◆</span>
          </div>
        </div>

      </div>

      {/* Full-width hero/banner */}
      <div style={{
        width: '100vw',
        position: 'relative',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        background: 'var(--background)',
        borderTop: '2px solid var(--border)',
        borderBottom: '2px solid var(--border)',
        padding: '4rem 1.5rem',
        marginBottom: '3rem',
        textAlign: 'left',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="massive-number" style={{
            position: 'absolute', right: '30px', bottom: '15px',
            opacity: 0.1, userSelect: 'none', pointerEvents: 'none',
          }}>01</div>
          <h1 className="display-title" style={{ marginBottom: '1rem' }}>CAMPUS MARKET</h1>
          <p className="label-caps" style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', marginBottom: '2.5rem', display: 'block', maxWidth: '600px', lineHeight: 1.5 }}>
            THE KINETIC BROWSE BOARD. TRADE USED TEXTBOOKS, GADGETS, CLOTHES AND ACCESSORIES DIRECTLY WITHIN YOUR COMMUNITY.
          </p>
          <div style={{ maxWidth: '600px', position: 'relative' }}>
            <input
              placeholder="SEARCH PRODUCTS..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="brutalist-input"
              style={{ paddingLeft: '0', fontSize: '1.25rem' }}
            />
          </div>
        </div>
      </div>

      {/* Constrained content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Filters row */}
        <div style={{
          display: 'flex', gap: '12px', marginBottom: '2.5rem',
          flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={category === cat ? 'brutalist-btn brutalist-btn-primary' : 'brutalist-btn'}
                style={{ padding: '0.4rem 1rem', minHeight: '36px', height: '36px', fontSize: '0.8rem' }}
              >
                {cat}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="brutalist-select"
            style={{
              width: 'auto', padding: '0.4rem 1.5rem 0.4rem 0.5rem',
              fontSize: '0.8rem', height: '36px', textTransform: 'uppercase',
              fontWeight: 700, border: '2px solid var(--border)', cursor: 'pointer',
            }}
          >
            <option value="">NEWEST FIRST</option>
            <option value="price_asc">PRICE: LOW TO HIGH</option>
            <option value="price_desc">PRICE: HIGH TO LOW</option>
          </select>
        </div>

        {/* Results count */}
        {!isLoading && (
          <p className="label-caps" style={{ marginBottom: '1.5rem', fontSize: '0.8rem' }}>
            {products.length === 0
              ? 'NO PRODUCTS FOUND'
              : `${data?.total || products.length} ITEM${(data?.total || products.length) !== 1 ? 'S' : ''} LISTED`}
          </p>
        )}

        {/* Loading state — skeleton */}
        {isLoading && <SkeletonGrid count={8} />}

        {/* Error state */}
        {error && (
          <div className="brutalist-card" style={{
            textAlign: 'center', padding: '2rem', color: '#ef4444',
            borderColor: '#ef4444', marginBottom: '2rem',
          }}>
            <span className="label-caps" style={{ color: '#ef4444' }}>FAILED TO LOAD PRODUCTS. RETRYING...</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && products.length === 0 && (
          <div className="brutalist-card" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📭</div>
            <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>NO ITEMS FOUND</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 500 }}>
              {search || category !== 'All'
                ? 'TRY ADJUSTING YOUR FILTER PARAMS'
                : 'BE THE FIRST TO POST AN OFFER ON THE FEED.'}
            </p>
          </div>
        )}

        {/* Product grid */}
        {!isLoading && products.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '24px',
          }}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Browse;
