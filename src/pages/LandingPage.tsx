import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <>
      <nav className="site-nav card" aria-label="Primary">
        <div className="brand">
          <span className="brand-dot" />
          <strong>Bitcoin Gift Links</strong>
        </div>
        <div className="row wrap">
          <Link className="nav-link" to="/app">
            App
          </Link>
          <Link className="nav-link" to="/claim">
            Claim
          </Link>
          <Link className="nav-link cta-primary" to="/app">
            Get Started
          </Link>
        </div>
      </nav>

      <header className="hero landing-hero hero-split">
        <div className="hero-content">
          <p className="eyebrow">Bitcoin Gift Links on Rootstock</p>
          <h1>Gift Bitcoin with the quality of a modern product</h1>
          <p className="hero-subtitle">
            Send tRBTC through beautiful shareable links. Recipients can claim directly to
            their wallet in one smooth flow, even if they start with zero crypto context.
          </p>
          <div className="row wrap nav-row">
            <Link className="nav-link cta-primary" to="/app">
              Launch App
            </Link>
            <Link className="nav-link" to="/claim">
              Claim Gift
            </Link>
          </div>
        </div>

        <aside className="hero-panel">
          <p className="eyebrow">Why teams use this</p>
          <div className="metric-grid">
            <div>
              <h3>1-click</h3>
              <p className="muted-text">claim experience</p>
            </div>
            <div>
              <h3>31</h3>
              <p className="muted-text">Rootstock testnet chain</p>
            </div>
            <div>
              <h3>0 setup</h3>
              <p className="muted-text">needed for recipients</p>
            </div>
            <div>
              <h3>Web3 native</h3>
              <p className="muted-text">wallet integrations</p>
            </div>
          </div>
        </aside>
      </header>

      <section className="logo-strip card">
        <p className="muted-text">
          Perfect for hackathons, demos, onboarding campaigns, and community rewards.
        </p>
      </section>

      <section className="feature-grid">
        <article className="card feature-card">
          <p className="feature-icon">01</p>
          <h3>Disposable Wallets</h3>
          <p className="muted-text">
            Every gift generates a fresh wallet, so funds can be sent even if the recipient
            has not connected a wallet yet.
          </p>
        </article>
        <article className="card feature-card">
          <p className="feature-icon">02</p>
          <h3>Instant Claim Links</h3>
          <p className="muted-text">
            Share one URL and let recipients claim funds into MetaMask or any supported wallet
            on Rootstock testnet.
          </p>
        </article>
        <article className="card feature-card">
          <p className="feature-icon">03</p>
          <h3>Built for Onboarding</h3>
          <p className="muted-text">
            Perfect for demos, campaigns, and community growth where a smooth first-time user
            experience matters most.
          </p>
        </article>
      </section>

      <section className="card">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <span className="pill muted">1</span>
            <p>Create a gift and fund a temporary wallet.</p>
          </div>
          <div className="step">
            <span className="pill muted">2</span>
            <p>Share the generated claim link with the recipient.</p>
          </div>
          <div className="step">
            <span className="pill muted">3</span>
            <p>Recipient opens the link and claims tRBTC to their wallet.</p>
          </div>
        </div>
      </section>

      <section className="card cta-band">
        <h2>Start gifting on Rootstock in under a minute</h2>
        <p className="muted-text">
          Launch the app, fund a gift wallet, and share the claim link instantly.
        </p>
        <div className="row wrap">
          <Link className="nav-link cta-primary" to="/app">
            Launch App
          </Link>
          <Link className="nav-link" to="/claim">
            Open Claim Page
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <p className="muted-text">Built on Rootstock Testnet • Wallet-ready • Demo friendly</p>
      </footer>
    </>
  )
}
