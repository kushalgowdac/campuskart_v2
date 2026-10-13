import { useEffect, useMemo, useRef, useState } from 'react';

const EASINGS = {
  'power3.out': 'cubic-bezier(.22,1,.36,1)',
  'power2.out': 'cubic-bezier(.16,1,.3,1)',
  'power1.out': 'ease-out',
};

const SplitText = ({
  text,
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  onLetterAnimationComplete,
  showCallback = false,
}) => {
  const rootRef = useRef(null);
  const completedRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pieces = useMemo(() => {
    if (splitType === 'words') return text.split(/(\s+)/);
    return Array.from(text);
  }, [splitType, text]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;

    if (!('IntersectionObserver' in window)) {
      const frame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold, rootMargin });

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  useEffect(() => {
    if (!isVisible || completedRef.current) return undefined;
    const animationTime = prefersReducedMotion
      ? 0
      : (duration * 1000) + Math.max(0, pieces.length - 1) * delay;
    const timer = window.setTimeout(() => {
      completedRef.current = true;
      onLetterAnimationComplete?.();
    }, animationTime);
    return () => window.clearTimeout(timer);
  }, [delay, duration, isVisible, onLetterAnimationComplete, pieces.length, prefersReducedMotion]);

  const startTransform = `translate(${from.x || 0}px, ${from.y || 0}px) scale(${from.scale ?? 1})`;
  const endTransform = `translate(${to.x || 0}px, ${to.y || 0}px) scale(${to.scale ?? 1})`;

  return (
    <span
      ref={rootRef}
      className={`split-text ${className}`.trim()}
      style={{ display: 'block', textAlign }}
      aria-label={text}
      data-callback-enabled={showCallback || undefined}
    >
      {pieces.map((piece, index) => (
        <span
          // Index is intentional: repeated letters are independent animation units.
          key={`${piece}-${index}`}
          className="split-text-piece"
          aria-hidden="true"
          style={{
            display: splitType === 'words' && /^\s+$/.test(piece) ? 'inline' : 'inline-block',
            whiteSpace: 'pre',
            opacity: isVisible ? (to.opacity ?? 1) : (from.opacity ?? 0),
            transform: isVisible ? endTransform : startTransform,
            transitionProperty: 'opacity, transform',
            transitionDuration: prefersReducedMotion ? '0ms' : `${duration}s`,
            transitionDelay: prefersReducedMotion ? '0ms' : `${index * delay}ms`,
            transitionTimingFunction: EASINGS[ease] || ease,
            willChange: 'opacity, transform',
          }}
        >
          {piece === ' ' ? '\u00A0' : piece}
        </span>
      ))}
    </span>
  );
};

export default SplitText;
