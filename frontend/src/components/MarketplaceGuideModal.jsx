import { useEffect, useRef } from 'react';
import { BUYER_STEPS, SELLER_STEPS } from '../content/marketplaceGuide';

const MarketplaceGuideModal = ({ onAcknowledge, actionLabel = 'Got it, start browsing' }) => {
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
            <h2 id="marketplace-guide-title">How CampusKart works</h2>
            <p id="marketplace-guide-description">A quick guide before you start buying or selling.</p>
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
          <p>Keep conversations respectful and meet in a safe place on campus.</p>
          <button ref={acknowledgeButtonRef} type="button" className="btn-primary" onClick={onAcknowledge}>
            {actionLabel}
          </button>
        </div>
      </section>
    </div>
  );
};

export default MarketplaceGuideModal;
