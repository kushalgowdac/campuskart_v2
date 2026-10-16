import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase, useAuth } from '../context/AuthContext';
import { BUYER_STEPS, SELLER_STEPS } from '../content/marketplaceGuide';
import { openGuide } from '../components/GuideModal';
import SplitText from '../components/SplitText';

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
  const { isLoggedIn } = useAuth();
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

  // Returning students skip the intro entirely and land on the listings.
  if (isLoggedIn) return <Navigate to="/browse" replace />;

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
        .landing-brand { display: inline-flex; align-items: center; color: #f4f4f4; text-decoration: none; font-size: 16px; font-weight: 610; letter-spacing: 0.16em; text-transform: uppercase; }
        .landing-nav-links { display: flex; align-items: center; gap: 30px; }
        .landing-nav-links a, .landing-nav-links button { color: #909090; text-decoration: none; font: inherit; font-size: 13px; background: none; border: 0; cursor: pointer; transition: color 0.15s; }
        .landing-nav-links a:hover, .landing-nav-links button:hover { color: white; }
        .landing-button { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; padding: 0 19px; border: 1px solid #333; border-radius: 7px; font-family: var(--font-sans); font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer; transition: transform 0.15s, background 0.15s, border-color 0.15s; }
        .landing-button:hover { transform: translateY(-1px); }
        .landing-button-primary { border-color: #f4f4f4; background: #f4f4f4; color: #090909; }
        .landing-button-primary:hover { background: white; border-color: white; }
        .landing-button-primary:disabled { opacity: 0.65; cursor: wait; transform: none; }
        .landing-button-secondary { background: transparent; color: #d0d0d0; }
        .landing-button-secondary:hover { border-color: #777; background: rgba(255,255,255,0.05); }
        .landing-hero { width: min(1320px, calc(100% - 48px)); min-height: 590px; margin: 0 auto; display: grid; grid-template-columns: minmax(280px, .68fr) minmax(560px, 1.32fr); align-items: center; gap: clamp(28px, 5vw, 90px); }
        .landing-copy { position: relative; z-index: 2; padding: 72px 0; }
        .landing-kicker { display: inline-flex; align-items: center; gap: 9px; margin-bottom: 24px; color: var(--landing-blue); font-size: 11px; font-weight: 650; letter-spacing: 0.09em; text-transform: uppercase; }
        .landing-kicker::before { content: ''; width: 28px; height: 1px; background: currentColor; }
        .landing-copy h1 { max-width: 420px; margin: 0; color: var(--landing-blue); font-family: Georgia, 'Times New Roman', serif; font-size: clamp(38px, 4.8vw, 66px); font-weight: 400; line-height: 1.04; letter-spacing: -0.045em; }
        .landing-copy > p { max-width: 410px; margin: 24px 0 0; color: #a0a0a0; font-family: Georgia, 'Times New Roman', serif; font-size: 15px; line-height: 1.35; }
        .landing-hero-actions { display: flex; flex-wrap: wrap; gap: 12px; }
        .landing-access { margin-top: 15px; color: #676767; font-size: 12px; line-height: 1.5; }
        .landing-access strong { color: #a5a5a5; }
        .landing-cta { min-height: 48px; padding: 0 22px; font-size: 14px; font-weight: 600; line-height: 1.2; border-radius: 7px; }
        .landing-cta-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 28px; }
        .landing-error { max-width: 550px; margin-top: 14px; padding: 10px 12px; border: 1px solid #7f3540; border-radius: 6px; background: rgba(127,53,64,0.16); color: #ffb7c0; font-size: 13px; }
        .landing-art { position: relative; width: 100%; }
        .landing-laptop { position: relative; width: 100%; padding: 0 4%; filter: drop-shadow(0 24px 42px rgba(0,0,0,.55)); transform: rotate(-2deg); }
        .landing-laptop-screen { position: relative; aspect-ratio: 1.62; overflow: hidden; border: 9px solid #171717; border-bottom-width: 13px; border-radius: 12px 12px 5px 5px; background: #050505; box-shadow: inset 0 0 0 1px #383838, 0 0 0 1px #000; }
        .landing-laptop-screen::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(125deg, rgba(255,255,255,.12), transparent 22%, transparent 78%, rgba(255,255,255,.03)); }
        .landing-screen-nav { height: 13%; display: flex; align-items: center; justify-content: space-between; padding: 0 4%; border-bottom: 1px solid #202020; color: #757575; font-family: var(--font-sans); font-size: clamp(5px, .6vw, 8px); letter-spacing: .08em; text-transform: uppercase; }
        .landing-screen-brand { color: #f2f2f2; font-size: clamp(7px, .9vw, 12px); letter-spacing: .12em; }
        .landing-screen-links { display: flex; gap: 16px; }
        .landing-screen-body { display: grid; grid-template-columns: 1fr 1.1fr; gap: 7%; height: 87%; padding: 8% 7%; background: radial-gradient(circle at 80% 30%, rgba(95,166,255,.2), transparent 38%), #070707; }
        .landing-screen-copy { align-self: center; }
        .landing-screen-copy small { color: #6da8e8; font-family: var(--font-sans); font-size: clamp(5px, .65vw, 9px); letter-spacing: .12em; text-transform: uppercase; }
        .landing-screen-copy h2 { max-width: 260px; margin: 8px 0 0; color: #f4f4f4; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(16px, 2.4vw, 35px); font-weight: 400; line-height: 1.03; letter-spacing: -.045em; }
        .landing-screen-copy p { max-width: 230px; margin-top: 10px; color: #858585; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(7px, .75vw, 11px); line-height: 1.35; }
        .landing-screen-button { display: inline-flex; align-items: center; min-height: 22px; margin-top: 13px; padding: 0 10px; border: 1px solid #d8d8d8; border-radius: 3px; color: #0a0a0a; background: #f4f4f4; font-family: var(--font-sans); font-size: clamp(6px, .65vw, 9px); font-weight: 600; text-decoration: none; }
        .landing-screen-products { align-self: end; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .landing-screen-product { aspect-ratio: 1.1; padding: 7px; border: 1px solid #242424; background: rgba(255,255,255,.035); }
        .landing-screen-product::before { content: ''; display: block; height: 66%; margin-bottom: 6px; background: linear-gradient(135deg, #282828, #111); }
        .landing-screen-product span { display: block; overflow: hidden; color: #d6d6d6; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(6px, .65vw, 9px); text-overflow: ellipsis; white-space: nowrap; }
        .landing-screen-product i { display: block; margin-top: 3px; color: #777; font-family: var(--font-sans); font-size: clamp(5px, .55vw, 8px); font-style: normal; }
        .landing-laptop-base { position: relative; width: 108%; height: 18px; margin-left: -4%; border-radius: 0 0 18px 18px; background: linear-gradient(#3a3a3a, #101010 55%); box-shadow: 0 3px 0 #050505; }
        .landing-laptop-base::after { content: ''; position: absolute; left: 40%; top: 3px; width: 20%; height: 3px; border-radius: 0 0 4px 4px; background: #070707; }
        .landing-guide { border-top: 1px solid #202020; background: linear-gradient(180deg, rgba(10,10,10,0.35), rgba(10,10,10,0.82)); }
        .landing-guide-inner { width: min(1180px, calc(100% - 48px)); margin: 0 auto; padding: 90px 0 96px; }
        .landing-section-heading { max-width: 650px; margin-bottom: 38px; }
        .landing-section-heading span { color: var(--landing-blue); font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
        .landing-section-heading h2 { margin: 12px 0 10px; color: #f4f4f4; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(30px, 4vw, 46px); font-weight: 400; line-height: 1.1; letter-spacing: -0.045em; }
        .landing-section-heading p { margin: 0; color: #8c8c8c; font-family: Georgia, 'Times New Roman', serif; font-size: 15px; line-height: 1.35; }
        .landing-guide-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
        .landing-guide-card { padding: 28px; border: 1px solid var(--landing-line); border-radius: 10px; background: rgba(8,8,8,0.72); }
        .landing-guide-title { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .landing-guide-title > span { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 7px; background: var(--landing-blue); color: #090909; font-size: 13px; font-weight: 800; }
        .landing-guide-title h3 { margin: 0; color: #f4f4f4; font-family: Georgia, 'Times New Roman', serif; font-size: 18px; font-weight: 400; }
        .landing-guide-card ol { display: grid; gap: 18px; margin: 0; padding: 0; list-style: none; }
        .landing-guide-card li { display: grid; grid-template-columns: 28px 1fr; gap: 12px; align-items: start; }
        .landing-guide-card li > span { padding-top: 2px; color: #747474; font-size: 11px; font-weight: 700; }
        .landing-guide-card li p { margin: 0; color: #989898; font-family: Georgia, 'Times New Roman', serif; font-size: 15px; line-height: 1.35; }
        .landing-safety { margin-top: 18px; padding: 15px 18px; border: 1px solid var(--landing-line); border-radius: 8px; color: #888; font-family: Georgia, 'Times New Roman', serif; font-size: 15px; line-height: 1.35; }
        .landing-safety strong { color: #d7d7d7; }
        .landing-final-cta { margin-top: 48px; padding: 30px; display: flex; align-items: center; justify-content: space-between; gap: 32px; border: 1px solid #333; border-radius: 10px; background: rgba(255,255,255,0.035); }
        .landing-final-cta-copy { max-width: 510px; }
        .landing-final-cta-copy h3 { margin: 0 0 8px; color: #f4f4f4; font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: 400; line-height: 1.15; letter-spacing: -0.03em; }
        .landing-final-cta-copy p { margin: 0; color: #919191; font-family: Georgia, 'Times New Roman', serif; font-size: 15px; line-height: 1.35; }
        .landing-final-cta-actions { flex-shrink: 0; }
        .landing-final-cta-actions .landing-access { text-align: right; }
        @media (max-width: 900px) {
          .landing-nav-links { display: none; }
          .landing-hero { min-height: auto; grid-template-columns: 1fr; padding-bottom: 50px; }
          .landing-copy { padding: 76px 0 20px; }
          .landing-copy h1 { max-width: 760px; }
          .landing-copy > p { max-width: 560px; }
          .landing-art { width: 105%; max-width: 760px; margin: -15px auto 0; }
          .landing-final-cta { align-items: flex-start; flex-direction: column; }
          .landing-final-cta-actions { width: 100%; }
          .landing-final-cta-actions .landing-access { text-align: left; }
        }
        @media (max-width: 620px) {
          .landing-nav { width: calc(100% - 32px); height: 64px; }
          .landing-hero { width: calc(100% - 32px); }
          .landing-copy { padding-top: 58px; }
          .landing-copy h1 { font-size: clamp(42px, 15vw, 65px); }
          .landing-copy > p { margin-top: 22px; font-size: 15px; }
          .landing-hero-actions { flex-direction: column; }
          .landing-hero-actions .landing-button { width: 100%; }
          .landing-cta { width: 100%; padding: 0 20px; }
          .landing-cta-row { margin-top: 24px; }
          .landing-art { width: 125%; margin-left: -12%; }
          .landing-guide-inner { width: calc(100% - 32px); padding: 68px 0 72px; }
          .landing-guide-grid { grid-template-columns: 1fr; }
          .landing-final-cta { padding: 22px; }
        }
      `}</style>

      <header className="landing-nav">
        <a className="landing-brand" href="#top" aria-label="CampusKart home">
          CampusKart
        </a>
        <nav className="landing-nav-links" aria-label="Welcome page navigation">
          <a href="#how-it-works">How it works</a>
          <button type="button" onClick={() => openGuide()}>Guide</button>
        </nav>
      </header>

      <main id="top">
        <section className="landing-hero">
          <div className="landing-copy">
            <span className="landing-kicker">RVCE student marketplace</span>
            <h1>Find it on campus. Pass it on.</h1>
            <p>RVCE CampusKart keeps useful things moving between students — browse what is available, then meet safely on campus.</p>
            <div className="landing-cta-row">
              <button className="landing-button landing-button-primary landing-cta" type="button" onClick={signInWithGoogle} disabled={loading}>
                {loading ? 'Redirecting…' : 'Sign in'}
              </button>
              <Link className="landing-button landing-button-secondary landing-cta" to="/browse">Browse products</Link>
            </div>
            <div className="landing-access">Sign-in requires an <strong>@rvce.edu.in</strong> Google account. Anyone can browse public listings.</div>
            {error && <div className="landing-error" role="alert">{error}</div>}
          </div>

          <div className="landing-art" aria-label="Preview of RVCE CampusKart on a laptop">
            <div className="landing-laptop">
              <div className="landing-laptop-screen">
                <div className="landing-screen-nav">
                  <span className="landing-screen-brand">RVCE CampusKart</span>
                  <div className="landing-screen-links"><span>Browse</span><span>Sell</span><span>Guide</span></div>
                </div>
                <div className="landing-screen-body">
                  <div className="landing-screen-copy">
                    <small>Simple exchange, close to home</small>
                    <h2>From listing to handover.</h2>
                    <p>Books, electronics, clothing and more — already on campus.</p>
                    <Link className="landing-screen-button" to="/browse">Browse products</Link>
                  </div>
                  <div className="landing-screen-products" aria-hidden="true">
                    <div className="landing-screen-product"><span>Wireless keyboard</span><i>₹1,099</i></div>
                    <div className="landing-screen-product"><span>Engineering books</span><i>₹650</i></div>
                    <div className="landing-screen-product"><span>Campus essentials</span><i>₹420</i></div>
                    <div className="landing-screen-product"><span>Pre-loved finds</span><i>₹800</i></div>
                  </div>
                </div>
              </div>
              <div className="landing-laptop-base" />
            </div>
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
