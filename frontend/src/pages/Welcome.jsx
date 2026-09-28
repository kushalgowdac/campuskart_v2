import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../context/AuthContext';
import { BUYER_STEPS, SELLER_STEPS } from '../content/marketplaceGuide';

const SignalGraphic = () => {
  const curves = [46, 72, 98, 124, 150, 176, 202];

  return (
    <svg className="welcome-signal" viewBox="0 0 700 430" role="img" aria-label="Flowing lines connecting the campus marketplace">
      <defs>
        <linearGradient id="signal-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#133252" stopOpacity="0.28" />
          <stop offset="0.48" stopColor="#61b8ff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#8fd0ff" />
        </linearGradient>
        <radialGradient id="signal-glow">
          <stop offset="0" stopColor="#55b5ff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#55b5ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="354" cy="215" r="130" fill="url(#signal-glow)" />
      {curves.map((spread, index) => (
        <path
          key={spread}
          d={`M 0 ${215 - spread / 2} C 150 ${215 - spread}, 205 ${215 + spread}, 350 215 C 470 ${215 - spread}, 560 ${215 - spread / 1.4}, 700 ${215 - spread / 2}`}
          fill="none"
          stroke="url(#signal-line)"
          strokeWidth={index === curves.length - 1 ? 2.1 : 1.6}
        />
      ))}
      {curves.map((spread, index) => (
        <path
          key={`lower-${spread}`}
          d={`M 0 ${215 + spread / 2} C 150 ${215 + spread}, 205 ${215 - spread}, 350 215 C 470 ${215 + spread}, 560 ${215 + spread / 1.4}, 700 ${215 + spread / 2}`}
          fill="none"
          stroke="url(#signal-line)"
          strokeWidth={index === curves.length - 1 ? 2.1 : 1.6}
        />
      ))}
      <path d="M0 215 H700" stroke="#73c3ff" strokeWidth="1.8" opacity="0.9" />
    </svg>
  );
};

const GuidanceCard = ({ label, title, steps }) => (
  <article className="landing-guide-card">
    <div className="landing-guide-title">
      <span aria-hidden="true">{label}</span>
      <h3>{title}</h3>
    </div>
    <ol>
      {steps.map((step, index) => (
        <li key={step}>
          <span aria-hidden="true">0{index + 1}</span>
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
    <div className="landing-shell">
      <style>{`
        .landing-shell {
          --landing-bg: #030914;
          --landing-panel: #081321;
          --landing-line: #1c3852;
          --landing-blue: #78c6ff;
          min-height: 100vh;
          overflow: hidden;
          background: var(--landing-bg);
          color: #eff8ff;
        }
        .landing-nav { width: min(1320px, calc(100% - 48px)); height: 72px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(120,198,255,0.18); }
        .landing-brand { display: flex; align-items: center; gap: 10px; color: #eff8ff; text-decoration: none; font-size: 19px; font-weight: 700; letter-spacing: -0.03em; }
        .landing-brand-mark { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 8px; background: var(--landing-blue); color: #03101d; font-size: 15px; font-weight: 800; }
        .landing-nav-links { display: flex; align-items: center; gap: 30px; }
        .landing-nav-links a { color: #b9d0e3; text-decoration: none; font-size: 13px; transition: color 0.15s; }
        .landing-nav-links a:hover { color: white; }
        .landing-button { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; padding: 0 19px; border: 1px solid #294863; border-radius: 7px; font-family: var(--font-sans); font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer; transition: transform 0.15s, background 0.15s, border-color 0.15s; }
        .landing-button:hover { transform: translateY(-1px); }
        .landing-button-primary { border-color: #d9efff; background: #d9efff; color: #06111d; }
        .landing-button-primary:hover { background: white; border-color: white; }
        .landing-button-primary:disabled { opacity: 0.65; cursor: wait; transform: none; }
        .landing-button-secondary { background: transparent; color: #d7eafa; }
        .landing-button-secondary:hover { border-color: #78c6ff; background: rgba(120,198,255,0.07); }
        .landing-hero { width: min(1320px, calc(100% - 48px)); min-height: 540px; margin: 0 auto; display: grid; grid-template-columns: minmax(420px, 0.9fr) minmax(520px, 1.2fr); align-items: center; gap: 10px; }
        .landing-copy { position: relative; z-index: 2; padding: 72px 0; }
        .landing-kicker { display: inline-flex; align-items: center; gap: 9px; margin-bottom: 24px; color: var(--landing-blue); font-size: 12px; font-weight: 650; letter-spacing: 0.09em; text-transform: uppercase; }
        .landing-kicker::before { content: ''; width: 28px; height: 1px; background: currentColor; }
        .landing-copy h1 { max-width: 650px; margin: 0; color: var(--landing-blue); font-size: clamp(52px, 6.4vw, 92px); font-weight: 450; line-height: 0.98; letter-spacing: -0.065em; }
        .landing-copy > p { max-width: 580px; margin: 30px 0 0; color: #bdd2e3; font-size: 17px; line-height: 1.65; }
        .landing-hero-actions { display: flex; flex-wrap: wrap; gap: 12px; }
        .landing-access { margin-top: 15px; color: #7892a8; font-size: 12px; line-height: 1.5; }
        .landing-access strong { color: #abc4d7; }
        .landing-error { max-width: 550px; margin-top: 14px; padding: 10px 12px; border: 1px solid #7f3540; border-radius: 6px; background: rgba(127,53,64,0.16); color: #ffb7c0; font-size: 13px; }
        .landing-art { position: relative; width: 110%; margin-left: -8%; }
        .welcome-signal { display: block; width: 100%; height: auto; filter: drop-shadow(0 0 22px rgba(72,169,240,0.08)); }
        .landing-guide { border-top: 1px solid rgba(120,198,255,0.15); background: linear-gradient(180deg, rgba(8,19,33,0.35), rgba(8,19,33,0.75)); }
        .landing-guide-inner { width: min(1180px, calc(100% - 48px)); margin: 0 auto; padding: 90px 0 96px; }
        .landing-section-heading { max-width: 650px; margin-bottom: 38px; }
        .landing-section-heading span { color: var(--landing-blue); font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
        .landing-section-heading h2 { margin: 12px 0 10px; color: #eff8ff; font-size: clamp(30px, 4vw, 46px); font-weight: 500; letter-spacing: -0.045em; }
        .landing-section-heading p { margin: 0; color: #8fa9bd; font-size: 15px; line-height: 1.6; }
        .landing-guide-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
        .landing-guide-card { padding: 28px; border: 1px solid var(--landing-line); border-radius: 10px; background: rgba(3,9,20,0.55); }
        .landing-guide-title { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .landing-guide-title > span { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 7px; background: var(--landing-blue); color: #06111d; font-size: 13px; font-weight: 800; }
        .landing-guide-title h3 { margin: 0; color: #eff8ff; font-size: 18px; }
        .landing-guide-card ol { display: grid; gap: 18px; margin: 0; padding: 0; list-style: none; }
        .landing-guide-card li { display: grid; grid-template-columns: 28px 1fr; gap: 12px; align-items: start; }
        .landing-guide-card li > span { padding-top: 2px; color: #5596c7; font-size: 11px; font-weight: 700; }
        .landing-guide-card li p { margin: 0; color: #9ab1c3; font-size: 13px; line-height: 1.6; }
        .landing-safety { margin-top: 18px; padding: 15px 18px; border: 1px solid var(--landing-line); border-radius: 8px; color: #8fa9bd; font-size: 13px; line-height: 1.55; }
        .landing-safety strong { color: #d6e8f5; }
        .landing-final-cta { margin-top: 48px; padding: 30px; display: flex; align-items: center; justify-content: space-between; gap: 32px; border: 1px solid #2b5778; border-radius: 10px; background: rgba(120,198,255,0.07); }
        .landing-final-cta-copy { max-width: 510px; }
        .landing-final-cta-copy h3 { margin: 0 0 8px; color: #eff8ff; font-size: 24px; font-weight: 550; letter-spacing: -0.03em; }
        .landing-final-cta-copy p { margin: 0; color: #94adbf; font-size: 13px; line-height: 1.6; }
        .landing-final-cta-actions { flex-shrink: 0; }
        .landing-final-cta-actions .landing-access { text-align: right; }
        @media (max-width: 900px) {
          .landing-nav-links { display: none; }
          .landing-hero { min-height: auto; grid-template-columns: 1fr; padding-bottom: 50px; }
          .landing-copy { padding: 76px 0 20px; }
          .landing-copy h1 { max-width: 760px; }
          .landing-art { width: 105%; max-width: 760px; margin: -15px auto 0; }
          .landing-final-cta { align-items: flex-start; flex-direction: column; }
          .landing-final-cta-actions { width: 100%; }
          .landing-final-cta-actions .landing-access { text-align: left; }
        }
        @media (max-width: 620px) {
          .landing-nav { width: calc(100% - 32px); height: 64px; }
          .landing-hero { width: calc(100% - 32px); }
          .landing-copy { padding-top: 58px; }
          .landing-copy h1 { font-size: clamp(44px, 15vw, 65px); }
          .landing-copy > p { margin-top: 22px; font-size: 15px; }
          .landing-hero-actions { flex-direction: column; }
          .landing-hero-actions .landing-button { width: 100%; }
          .landing-art { width: 125%; margin-left: -12%; }
          .landing-guide-inner { width: calc(100% - 32px); padding: 68px 0 72px; }
          .landing-guide-grid { grid-template-columns: 1fr; }
          .landing-final-cta { padding: 22px; }
        }
      `}</style>

      <header className="landing-nav">
        <a className="landing-brand" href="#top" aria-label="CampusKart home">
          <span className="landing-brand-mark">CK</span>
          CampusKart
        </a>
        <nav className="landing-nav-links" aria-label="Welcome page navigation">
          <a href="#how-it-works">How it works</a>
          <Link to="/guide">Guide</Link>
        </nav>
      </header>

      <main id="top">
        <section className="landing-hero">
          <div className="landing-copy">
            <span className="landing-kicker">Built for the RVCE community</span>
            <h1>Welcome,<br />RVians.</h1>
            <p>Before you begin, here is everything you need to know about discovering, buying, and selling pre-owned items within your campus community.</p>
          </div>
          <div className="landing-art" aria-hidden="true">
            <SignalGraphic />
          </div>
        </section>

        <section className="landing-guide" id="how-it-works">
          <div className="landing-guide-inner">
            <div className="landing-section-heading">
              <span>Simple by design</span>
              <h2>From listing to handover.</h2>
              <p>CampusKart helps buyers and sellers connect directly. Payments and handovers stay between students.</p>
            </div>
            <div className="landing-guide-grid">
              <GuidanceCard label="B" title="For buyers" steps={BUYER_STEPS} />
              <GuidanceCard label="S" title="For sellers" steps={SELLER_STEPS} />
            </div>
            <div className="landing-safety">
              <strong>Meet safely:</strong> inspect items before paying and choose a public place on campus for every handover.
            </div>
            <div className="landing-final-cta">
              <div className="landing-final-cta-copy">
                <h3>Ready to enter CampusKart?</h3>
                <p>Sign in to contact sellers and create listings, or explore everything currently available without an account.</p>
              </div>
              <div className="landing-final-cta-actions">
                <div className="landing-hero-actions">
                  <button className="landing-button landing-button-primary" type="button" onClick={signInWithGoogle} disabled={loading}>
                    {loading ? 'Redirecting to Google…' : 'Sign in / Sign up with Google'}
                  </button>
                  <Link className="landing-button landing-button-secondary" to="/browse">Browse items</Link>
                </div>
                <div className="landing-access">
                  <strong>Sign-in requires an @rvce.edu.in Google account.</strong><br />
                  Anyone can browse public listings.
                </div>
                {error && <div className="landing-error" role="alert">{error}</div>}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Welcome;
