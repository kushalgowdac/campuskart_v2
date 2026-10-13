import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../context/AuthContext';
import { BUYER_STEPS, SELLER_STEPS } from '../content/marketplaceGuide';
import SplitText from '../components/SplitText';

const SignalGraphic = () => {
  const curves = [46, 72, 98, 124, 150, 176, 202];

  return (
    <svg className="welcome-signal" viewBox="0 0 700 430" role="img" aria-label="Flowing lines connecting the campus marketplace">
      <defs>
        <linearGradient id="signal-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#303030" stopOpacity="0.28" />
          <stop offset="0.48" stopColor="#b8b8b8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f2f2f2" />
        </linearGradient>
        <radialGradient id="signal-glow">
          <stop offset="0" stopColor="#d0d0d0" stopOpacity="0.18" />
          <stop offset="1" stopColor="#d0d0d0" stopOpacity="0" />
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
      <path d="M0 215 H700" stroke="#e8e8e8" strokeWidth="1.8" opacity="0.9" />
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
  const [introStage, setIntroStage] = useState('welcome');
  const stageTimerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(stageTimerRef.current), []);

  const queueStage = (stage, wait) => {
    window.clearTimeout(stageTimerRef.current);
    stageTimerRef.current = window.setTimeout(() => setIntroStage(stage), wait);
  };

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

  if (introStage !== 'content') {
    const isWelcome = introStage === 'welcome';
    return (
      <main className="intro-sequence" aria-live="polite">
        <style>{`
          .intro-sequence { min-height: 100svh; display: grid; place-items: center; overflow: hidden; background: #000; color: #f5f5f5; }
          .intro-sequence::before { content: ''; position: fixed; inset: 0; pointer-events: none; background-image: radial-gradient(circle, rgba(255,255,255,.13) 1px, transparent 1.2px); background-size: 96px 96px; opacity: .2; }
          .intro-stage { position: relative; width: min(1100px, calc(100% - 40px)); display: grid; justify-items: center; text-align: center; animation: introStageIn .4s ease-out; }
          .intro-eyebrow { margin-bottom: 25px; color: #666; font-size: 10px; font-weight: 650; letter-spacing: .2em; text-transform: uppercase; }
          .intro-title { color: #f5f5f5; font-family: 'Courier New', monospace; font-size: clamp(42px, 8vw, 108px); font-weight: 900; line-height: .95; letter-spacing: -.075em; text-transform: uppercase; }
          .intro-dot-title { font-size: clamp(39px, 7.2vw, 94px); }
          .intro-dot-title .split-text-piece { color: #f5f5f5; -webkit-mask-image: radial-gradient(circle, #000 2.25px, transparent 2.8px); mask-image: radial-gradient(circle, #000 2.25px, transparent 2.8px); -webkit-mask-size: 7px 7px; mask-size: 7px 7px; }
          .intro-loading-copy { margin-top: 38px; color: #8a8a8a; font-family: 'Courier New', monospace; font-size: clamp(12px, 1.4vw, 17px); letter-spacing: -.03em; }
          .intro-progress { width: min(330px, 65vw); height: 3px; margin-top: 17px; overflow: hidden; background: #222; }
          .intro-progress::after { content: ''; display: block; width: 100%; height: 100%; background: #f5f5f5; transform-origin: left; animation: introProgress 2.25s cubic-bezier(.22,1,.36,1) forwards; }
          .intro-skip { position: fixed; top: 24px; right: 28px; z-index: 2; padding: 7px 0; border: 0; border-bottom: 1px solid transparent; background: none; color: #666; font: inherit; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; cursor: pointer; }
          .intro-skip:hover { color: #eee; border-bottom-color: #555; }
          @keyframes introStageIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes introProgress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
          @media (max-width: 620px) {
            .intro-title { font-size: clamp(30px, 10vw, 48px); }
            .intro-dot-title { font-size: clamp(31px, 10vw, 52px); }
            .intro-dot-title .split-text-piece { -webkit-mask-size: 5px 5px; mask-size: 5px 5px; -webkit-mask-image: radial-gradient(circle, #000 1.55px, transparent 2px); mask-image: radial-gradient(circle, #000 1.55px, transparent 2px); }
            .intro-skip { top: 18px; right: 18px; }
          }
          @media (prefers-reduced-motion: reduce) {
            .intro-stage { animation: none; }
            .intro-progress::after { animation-duration: .01ms; }
          }
        `}</style>

        <button className="intro-skip" type="button" onClick={() => setIntroStage('content')}>Skip intro</button>
        <section className="intro-stage" key={introStage}>
          <span className="intro-eyebrow">{isWelcome ? 'RVCE student marketplace' : 'Loading campus marketplace'}</span>
          <SplitText
            text={isWelcome ? 'WELCOME, RVIAN.' : 'CAMPUSKART RVCE'}
            className={`intro-title${isWelcome ? '' : ' intro-dot-title'}`}
            delay={isWelcome ? 55 : 45}
            duration={isWelcome ? 1.05 : 0.9}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
            onLetterAnimationComplete={() => queueStage(isWelcome ? 'brand' : 'content', isWelcome ? 420 : 900)}
            showCallback
          />
          {!isWelcome && (
            <>
              <p className="intro-loading-copy">Connecting students, circulating essentials...</p>
              <div className="intro-progress" aria-hidden="true" />
            </>
          )}
        </section>
      </main>
    );
  }

  return (
    <div className="landing-shell">
      <style>{`
        .landing-shell {
          --landing-bg: #050505;
          --landing-panel: #0a0a0a;
          --landing-line: #242424;
          --landing-blue: #f4f4f4;
          min-height: 100vh;
          overflow: hidden;
          background: var(--landing-bg);
          color: #f4f4f4;
        }
        .landing-nav { width: min(1320px, calc(100% - 48px)); height: 72px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #202020; }
        .landing-brand { display: flex; align-items: center; gap: 10px; color: #f4f4f4; text-decoration: none; font-size: 19px; font-weight: 700; letter-spacing: -0.03em; }
        .landing-brand-mark { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 6px; background: #f4f4f4; color: #090909; font-size: 15px; font-weight: 800; }
        .landing-nav-links { display: flex; align-items: center; gap: 30px; }
        .landing-nav-links a { color: #909090; text-decoration: none; font-size: 13px; transition: color 0.15s; }
        .landing-nav-links a:hover { color: white; }
        .landing-button { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; padding: 0 19px; border: 1px solid #333; border-radius: 7px; font-family: var(--font-sans); font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer; transition: transform 0.15s, background 0.15s, border-color 0.15s; }
        .landing-button:hover { transform: translateY(-1px); }
        .landing-button-primary { border-color: #f4f4f4; background: #f4f4f4; color: #090909; }
        .landing-button-primary:hover { background: white; border-color: white; }
        .landing-button-primary:disabled { opacity: 0.65; cursor: wait; transform: none; }
        .landing-button-secondary { background: transparent; color: #d0d0d0; }
        .landing-button-secondary:hover { border-color: #777; background: rgba(255,255,255,0.05); }
        .landing-hero { width: min(1320px, calc(100% - 48px)); min-height: 540px; margin: 0 auto; display: grid; grid-template-columns: minmax(420px, 0.9fr) minmax(520px, 1.2fr); align-items: center; gap: 10px; }
        .landing-copy { position: relative; z-index: 2; padding: 72px 0; }
        .landing-kicker { display: inline-flex; align-items: center; gap: 9px; margin-bottom: 24px; color: var(--landing-blue); font-size: 12px; font-weight: 650; letter-spacing: 0.09em; text-transform: uppercase; }
        .landing-kicker::before { content: ''; width: 28px; height: 1px; background: currentColor; }
        .landing-copy h1 { max-width: 650px; margin: 0; color: var(--landing-blue); font-size: clamp(52px, 6.4vw, 92px); font-weight: 450; line-height: 0.98; letter-spacing: -0.065em; }
        .landing-copy > p { max-width: 580px; margin: 30px 0 0; color: #a0a0a0; font-size: 17px; line-height: 1.65; }
        .landing-hero-actions { display: flex; flex-wrap: wrap; gap: 12px; }
        .landing-access { margin-top: 15px; color: #676767; font-size: 12px; line-height: 1.5; }
        .landing-access strong { color: #a5a5a5; }
        .landing-error { max-width: 550px; margin-top: 14px; padding: 10px 12px; border: 1px solid #7f3540; border-radius: 6px; background: rgba(127,53,64,0.16); color: #ffb7c0; font-size: 13px; }
        .landing-art { position: relative; width: 110%; margin-left: -8%; }
        .welcome-signal { display: block; width: 100%; height: auto; filter: drop-shadow(0 0 22px rgba(255,255,255,0.04)); }
        .landing-guide { border-top: 1px solid #202020; background: linear-gradient(180deg, rgba(10,10,10,0.35), rgba(10,10,10,0.82)); }
        .landing-guide-inner { width: min(1180px, calc(100% - 48px)); margin: 0 auto; padding: 90px 0 96px; }
        .landing-section-heading { max-width: 650px; margin-bottom: 38px; }
        .landing-section-heading span { color: var(--landing-blue); font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
        .landing-section-heading h2 { margin: 12px 0 10px; color: #f4f4f4; font-size: clamp(30px, 4vw, 46px); font-weight: 500; letter-spacing: -0.045em; }
        .landing-section-heading p { margin: 0; color: #8c8c8c; font-size: 15px; line-height: 1.6; }
        .landing-guide-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
        .landing-guide-card { padding: 28px; border: 1px solid var(--landing-line); border-radius: 10px; background: rgba(8,8,8,0.72); }
        .landing-guide-title { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .landing-guide-title > span { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 7px; background: var(--landing-blue); color: #090909; font-size: 13px; font-weight: 800; }
        .landing-guide-title h3 { margin: 0; color: #f4f4f4; font-size: 18px; }
        .landing-guide-card ol { display: grid; gap: 18px; margin: 0; padding: 0; list-style: none; }
        .landing-guide-card li { display: grid; grid-template-columns: 28px 1fr; gap: 12px; align-items: start; }
        .landing-guide-card li > span { padding-top: 2px; color: #747474; font-size: 11px; font-weight: 700; }
        .landing-guide-card li p { margin: 0; color: #989898; font-size: 13px; line-height: 1.6; }
        .landing-safety { margin-top: 18px; padding: 15px 18px; border: 1px solid var(--landing-line); border-radius: 8px; color: #888; font-size: 13px; line-height: 1.55; }
        .landing-safety strong { color: #d7d7d7; }
        .landing-final-cta { margin-top: 48px; padding: 30px; display: flex; align-items: center; justify-content: space-between; gap: 32px; border: 1px solid #333; border-radius: 10px; background: rgba(255,255,255,0.035); }
        .landing-final-cta-copy { max-width: 510px; }
        .landing-final-cta-copy h3 { margin: 0 0 8px; color: #f4f4f4; font-size: 24px; font-weight: 550; letter-spacing: -0.03em; }
        .landing-final-cta-copy p { margin: 0; color: #919191; font-size: 13px; line-height: 1.6; }
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
            <h1>Buy and sell,<br />within RVCE.</h1>
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
