// ============================================================
// pages/Browse.jsx — Home page / marketplace
// ============================================================

import { useState, useEffect } from 'react';
import api from '../api';
import ProductCard from '../components/ProductCard';

const CATEGORIES = ['All', 'Books', 'Electronics', 'Clothing', 'Stationery', 'Sports', 'Other'];


const Browse = () => {
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [searchInput, setSearchInput]     = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [category, setCategory]           = useState('All');
  const [sort, setSort]                   = useState('');
  
  // Fetch products whenever search/category/sort changes
  // useEffect runs the function whenever the dependency array values change
  // Empty array [] = run once on mount. [search, category] = run when those change.
  
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (appliedSearch)      params.append('q',        appliedSearch);
        if (category !== 'All') params.append('category', category);
        if (sort)               params.append('sort',     sort);
        const res = await api.get(`/api/products?${params}`);
        setProducts(res.data);
      } catch {
        setError('Failed to load products.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [appliedSearch, category, sort]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') setAppliedSearch(searchInput.trim());
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', borderRadius: '16px', padding: '2rem', color: 'white', marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem', fontWeight: 700 }}>Campus Marketplace</h1>
        <p style={{ margin: '0 0 1.2rem', opacity: 0.9, fontSize: '15px' }}>Buy and sell used items within your college community</p>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <input
            placeholder="Search products... (press Enter)"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: 'none', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid', borderColor: category === cat ? '#1d4ed8' : '#e5e7eb', background: category === cat ? '#eff6ff' : 'white', color: category === cat ? '#1d4ed8' : '#6b7280', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>{cat}</button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', cursor: 'pointer', marginLeft: 'auto' }}>
          <option value="">Newest first</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {!loading && <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '1rem' }}>{products.length === 0 ? 'No products found' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}</p>}
      {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading products...</div>}
      {error && <div style={{ textAlign: 'center', padding: '2rem', color: '#dc2626', background: '#fef2f2', borderRadius: '12px' }}>{error}</div>}
      {!loading && !error && products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6b7280' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ margin: '0 0 8px', color: '#374151' }}>No products yet</h3>
          <p style={{ margin: 0, fontSize: '14px' }}>{appliedSearch || category !== 'All' ? 'Try different search terms or categories' : 'Be the first to list something!'}</p>
        </div>
      )}
      {!loading && products.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {products.map(product => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </div>
  );
};

export default Browse;