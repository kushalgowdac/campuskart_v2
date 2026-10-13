export const THEME_KEY = 'ck-theme';

export function getStoredTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    return window.localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const isLight = theme === 'light';
  const root = document.documentElement;
  root.classList.toggle('light', isLight);
  root.style.colorScheme = isLight ? 'light' : 'dark';
}

export function storeTheme(theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Persisting the preference is optional; ignore storage failures.
  }
}
