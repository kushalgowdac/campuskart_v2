import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BUYER_STEPS, SELLER_STEPS, GUIDE_FAQS } from '../content/marketplaceGuide';

const StepList = ({ label, title, steps }) => (
  <article className="guide-card">
    <div className="guide-card-heading">
      <span className="guide-card-label" aria-hidden="true">{label}</span>
      <h2>{title}</h2>
    </div>
    <ol>
      {steps.map((step, index) => (
        <li key={step}>
          <span aria-hidden="true">{index + 1}</span>
          <p>{step}</p>
        </li>
      ))}
    </ol>
  </article>
);

const Guide = () => {
  const { isLoggedIn } = useAuth();

  return (
    <main className="guide-page">
      <style>{`
        .guide-page { max-width: 920px; margin: 0 auto; padding: 64px 24px 80px; }
        .guide-hero { max-width: 660px; margin-bottom: 44px; }
        .guide-eyebrow { display: inline-block; margin-bottom: 12px; color: var(--color-text-secondary); font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
        .guide-hero h1 { margin: 0 0 14px; font-size: clamp(32px, 5vw, 48px); line-height: 1.08; letter-spacing: -0.045em; }
        .guide-hero p { margin: 0; color: var(--color-text-secondary); font-size: 17px; line-height: 1.7; }
        .guide-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
        .guide-card { padding: 26px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-bg-subtle); }
        .guide-card-heading { display: flex; align-items: center; gap: 11px; margin-bottom: 22px; }
        .guide-card-heading h2 { margin: 0; font-size: 19px; letter-spacing: -0.02em; }
        .guide-card-label { width: 30px; height: 30px; display: grid; place-items: center; flex: 0 0 30px; border-radius: 50%; background: var(--color-accent); color: #04101c; font-size: 13px; font-weight: 700; }
        .guide-card ol { display: grid; gap: 18px; margin: 0; padding: 0; list-style: none; }
        .guide-card li { display: grid; grid-template-columns: 25px 1fr; gap: 11px; align-items: start; }
        .guide-card li > span { width: 25px; height: 25px; display: grid; place-items: center; border: 1px solid var(--color-border-strong); border-radius: 50%; background: var(--color-bg-primary); color: var(--color-text-secondary); font-size: 11px; font-weight: 700; }
        .guide-card li p { margin: 1px 0 0; color: var(--color-text-secondary); font-size: 14px; line-height: 1.6; }
        .guide-safety { margin: 18px 0 56px; padding: 16px 18px; display: flex; gap: 12px; align-items: flex-start; border: 1px solid var(--color-border); border-radius: var(--radius-md); }
        .guide-safety svg { flex: 0 0 auto; margin-top: 2px; }
        .guide-safety p { margin: 0; color: var(--color-text-secondary); font-size: 13px; line-height: 1.6; }
        .guide-safety strong { color: var(--color-text-primary); }
        .guide-faq-header { margin-bottom: 22px; }
        .guide-faq-header h2 { margin: 0 0 7px; font-size: 26px; letter-spacing: -0.03em; }
        .guide-faq-header p { margin: 0; color: var(--color-text-secondary); }
        .guide-faq-list { border-top: 1px solid var(--color-border); }
        .guide-faq-list details { border-bottom: 1px solid var(--color-border); }
        .guide-faq-list summary { padding: 19px 2px; display: flex; align-items: center; justify-content: space-between; gap: 16px; cursor: pointer; font-size: 15px; font-weight: 600; list-style: none; }
        .guide-faq-list summary::-webkit-details-marker { display: none; }
        .guide-faq-list summary::after { content: '+'; color: var(--color-text-muted); font-size: 20px; font-weight: 400; }
        .guide-faq-list details[open] summary::after { content: '−'; }
        .guide-faq-list details p { max-width: 720px; margin: -5px 0 20px; color: var(--color-text-secondary); font-size: 14px; line-height: 1.65; }
        .guide-cta { margin-top: 54px; padding: 28px; display: flex; align-items: center; justify-content: space-between; gap: 24px; border: 1px solid var(--color-border-strong); border-radius: var(--radius-lg); background: var(--color-bg-subtle); color: var(--color-text-primary); }
        .guide-cta h2 { margin: 0 0 5px; font-size: 20px; }
        .guide-cta p { margin: 0; color: var(--color-text-secondary); font-size: 13px; }
        .guide-cta-actions { display: flex; gap: 10px; flex-shrink: 0; }
        .guide-cta .guide-light-button { background: var(--color-accent); color: #04101c; }
        .guide-cta .guide-outline-button { border-color: var(--color-border-strong); background: transparent; color: var(--color-text-primary); }
        @media (max-width: 680px) {
          .guide-page { padding: 40px 16px 56px; }
          .guide-grid { grid-template-columns: 1fr; }
          .guide-safety { margin-bottom: 44px; }
          .guide-cta { align-items: stretch; flex-direction: column; }
          .guide-cta-actions { flex-direction: column; }
        }
      `}</style>

      <header className="guide-hero">
        <span className="guide-eyebrow">CampusKart guide</span>
        <h1>Buy and sell on campus, simply.</h1>
        <p>CampusKart helps RVCE students discover useful items, connect directly, and give pre-owned products a second life.</p>
      </header>

      <section className="guide-grid" aria-label="How CampusKart works">
        <StepList label="B" title="For buyers" steps={BUYER_STEPS} />
        <StepList label="S" title="For sellers" steps={SELLER_STEPS} />
      </section>

      <aside className="guide-safety">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <p><strong>Stay safe:</strong> keep conversations respectful, inspect items before paying, and meet in a public place on campus.</p>
      </aside>

      <section aria-labelledby="guide-faq-title">
        <div className="guide-faq-header">
          <h2 id="guide-faq-title">Frequently asked questions</h2>
          <p>Everything you need to know before your first transaction.</p>
        </div>
        <div className="guide-faq-list">
          {GUIDE_FAQS.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="guide-cta">
        <div>
          <h2>Ready to explore CampusKart?</h2>
          <p>Browse what other RVCE students have listed.</p>
        </div>
        <div className="guide-cta-actions">
          <Link to="/browse" className="btn-primary guide-light-button">Browse listings</Link>
          <Link to={isLoggedIn ? '/sell' : '/login'} className="btn-secondary guide-outline-button">
            {isLoggedIn ? 'List an item' : 'Sign in'}
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Guide;
