const CACHE_PREFIX = 'campuskart:marketplace:v2:';

export const PRODUCT_LIST_CACHE_TTL = 15 * 60 * 1000;
export const PRODUCT_DETAIL_CACHE_TTL = 5 * 60 * 1000;

export const productListCacheKey = (queryString = '') =>
  `products:list:${queryString || 'all'}`;

export const productDetailCacheKey = (id) => `products:detail:${id}`;

export const readMarketplaceCache = (key, maxAge) => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (!cached || !Number.isFinite(cached.savedAt) || !('data' in cached)) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    if (Date.now() - cached.savedAt > maxAge) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return cached;
  } catch {
    // A full/disabled localStorage or malformed entry should never block browsing.
    return null;
  }
};

export const writeMarketplaceCache = (key, data) => {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify({ data, savedAt: Date.now() })
    );
  } catch {
    // The network result is still usable when persistent caching is unavailable.
  }
};

export const clearMarketplaceCache = () => {
  try {
    const keysToRemove = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(CACHE_PREFIX)) keysToRemove.push(key);
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch {
    // Cache invalidation is best-effort; API mutations must still succeed.
  }
};
