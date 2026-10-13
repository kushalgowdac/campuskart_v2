import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { applyTheme, getStoredTheme, storeTheme } from '../lib/theme';

const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => getStoredTheme());

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    storeTheme(next);
    applyTheme(next);
  };

  const nextLabel = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      className="minimal-nav-icon"
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextLabel} theme`}
      title={`Switch to ${nextLabel} theme`}
    >
      {theme === 'light' ? <Moon size={17} strokeWidth={1.4} /> : <Sun size={18} strokeWidth={1.4} />}
    </button>
  );
};

export default ThemeToggle;
