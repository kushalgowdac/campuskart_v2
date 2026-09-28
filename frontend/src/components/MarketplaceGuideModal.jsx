import { useEffect, useRef } from 'react';
import { BUYER_STEPS, SELLER_STEPS } from '../content/marketplaceGuide';

const MarketplaceGuideModal = ({ onAcknowledge, onBrowse, actionLabel = 'Sign in' }) => {
  const acknowledgeButtonRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    acknowledgeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="marketplace-guide-backdrop" role="presentation">
      <section
        className="marketplace-guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="marketplace-guide-title"
        aria-describedby="marketplace-guide-description"
      >
        <div className="marketplace-guide-heading">
          <span className="marketplace-guide-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </span>
          <div>
            <h2 id="marketplace-guide-title">Welcome to CampusKart</h2>
            <p id="marketplace-guide-description">Buy and sell within the RVCE student community.</p>
          </div>
        </div>

        <div className="marketplace-guide-sections">
          <div className="marketplace-guide-section">
            <div className="marketplace-guide-section-title">
              <span className="marketplace-guide-number" aria-hidden="true">B</span>
              <h3>For buyers</h3>
            </div>
            <ul>
              {BUYER_STEPS.map(step => <li key={step}>{step}</li>)}
            </ul>
          </div>

          <div className="marketplace-guide-section">
            <div className="marketplace-guide-section-title">
              <span className="marketplace-guide-number" aria-hidden="true">S</span>
              <h3>For sellers</h3>
            </div>
            <ul>
              {SELLER_STEPS.map(step => <li key={step}>{step}</li>)}
            </ul>
            <div className="marketplace-guide-seller-note">
              You can edit your price and description later from My Listings, even after the item is placed for sale. Edits are sent for review again.
            </div>
          </div>
        </div>

        <div className="marketplace-guide-footer">
          <div className="marketplace-guide-access">
            <strong>Sign-in is only for RVCE students</strong>
            <span>Use your @rvce.edu.in Google account. Anyone can browse listings without signing in.</span>
          </div>
          <div className="marketplace-guide-actions">
            <button type="button" className="btn-secondary" onClick={onBrowse}>
              Browse without signing in
            </button>
            <button ref={acknowledgeButtonRef} type="button" className="btn-primary" onClick={onAcknowledge}>
              {actionLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MarketplaceGuideModal;
