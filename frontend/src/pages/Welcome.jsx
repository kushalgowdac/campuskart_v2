import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../context/AuthContext';
import { BUYER_STEPS, SELLER_STEPS } from '../content/marketplaceGuide';

const GuidanceCard = ({ label, title, steps }) => (
  <article className="welcome-guide-card">
    <div className="welcome-guide-title">
      <span aria-hidden="true">{label}</span>
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

const Welcome = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const signInWithGoogle = async () => {
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin, scopes: 'email profile' },
      });
      if (authError) throw authError;
    } catch (authError) {
      setError(authError.message || 'Failed to start Google login.');
      setLoading(false);
    }
  };

  return (
    <main className="welcome-page">
      <style>{`
        .welcome-page { max-width: 1000px; margin: 0 auto; padding: 72px 24px 88px; }
        .welcome-hero { max-width: 720px; margin-bottom: 52px; }
        .welcome-eyebrow { display: inline-block; margin-bottom: 14px; color: var(--color-text-secondary); font-size: 12px; font-weight: 700; letter-spacing: 0.11em; text-transform: uppercase; }
        .welcome-hero h1 { max-width: 680px; margin: 0 0 18px; font-size: clamp(38px, 7vw, 64px); line-height: 1.02; letter-spacing: -0.055em; }
        .welcome-hero > p { max-width: 620px; margin: 0; color: var(--color-text-secondary); font-size: 17px; line-height: 1.7; }
        .welcome-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
        .welcome-actions a { text-decoration: none; }
        .welcome-access-note { margin-top: 14px; color: var(--color-text-muted); font-size: 12px; line-height: 1.5; }
        .welcome-access-note strong { color: var(--color-text-secondary); }
        .welcome-error { max-width: 520px; margin-top: 14px; padding: 10px 12px; border: 1px solid #fecaca; border-radius: var(--radius-sm); background: var(--color-danger-subtle); color: var(--color-danger); font-size: 13px; }
        .welcome-guide-heading { margin-bottom: 18px; }
        .welcome-guide-heading h2 { margin: 0 0 6px; font-size: 25px; letter-spacing: -0.03em; }
        .welcome-guide-heading p { margin: 0; color: var(--color-text-secondary); font-size: 14px; }
        .welcome-guide-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .welcome-guide-card { padding: 24px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-bg-subtle); }
        .welcome-guide-title { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .welcome-guide-title > span { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 50%; background: var(--color-text-primary); color: white; font-size: 12px; font-weight: 700; }
        .welcome-guide-title h2 { margin: 0; font-size: 18px; }
        .welcome-guide-card ol { display: grid; gap: 15px; margin: 0; padding: 0; list-style: none; }
        .welcome-guide-card li { display: grid; grid-template-columns: 24px 1fr; gap: 10px; align-items: start; }
        .welcome-guide-card li > span { width: 24px; height: 24px; display: grid; place-items: center; border: 1px solid var(--color-border-strong); border-radius: 50%; background: white; color: var(--color-text-secondary); font-size: 11px; font-weight: 700; }
        .welcome-guide-card li p { margin: 1px 0 0; color: var(--color-text-secondary); font-size: 13px; line-height: 1.6; }
        .welcome-safety { margin-top: 16px; padding: 14px 16px; border: 1px solid var(--color-border); border-radius: var(--radius-md); color: var(--color-text-secondary); font-size: 13px; line-height: 1.55; }
        .welcome-safety strong { color: var(--color-text-primary); }
        @media (max-width: 680px) {
          .welcome-page { padding: 48px 16px 64px; }
          .welcome-hero { margin-bottom: 42px; }
          .welcome-guide-grid { grid-template-columns: 1fr; }
          .welcome-actions { flex-direction: column; }
          .welcome-actions .btn-primary, .welcome-actions .btn-secondary { width: 100%; justify-content: center; }
        }
      `}</style>

      <header className="welcome-hero">
        <span className="welcome-eyebrow">RVCE student marketplace</span>
        <h1>Welcome to CampusKart.</h1>
        <p>Discover useful items from the campus community or give something you no longer need a second life.</p>
        <div className="welcome-actions">
          <Link to="/browse" className="btn-secondary">Browse listings without signing in</Link>
          <button type="button" className="btn-primary" onClick={signInWithGoogle} disabled={loading}>
            {loading ? 'Redirecting to Google…' : 'Sign in with RVCE Google'}
          </button>
        </div>
        <p className="welcome-access-note">
          <strong>Anyone can browse listings.</strong> Signing in is only for RVCE students with an @rvce.edu.in Google account.
        </p>
        {error && <div className="welcome-error" role="alert">{error}</div>}
      </header>

      <section aria-labelledby="welcome-guide-title">
        <div className="welcome-guide-heading">
          <h2 id="welcome-guide-title">How CampusKart works</h2>
          <p>A quick guide before you start buying or selling.</p>
        </div>
        <div className="welcome-guide-grid">
          <GuidanceCard label="B" title="For buyers" steps={BUYER_STEPS} />
          <GuidanceCard label="S" title="For sellers" steps={SELLER_STEPS} />
        </div>
        <div className="welcome-safety">
          <strong>Stay safe:</strong> inspect items before paying and meet in a public place on campus.
        </div>
      </section>
    </main>
  );
};

export default Welcome;
