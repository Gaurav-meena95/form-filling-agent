import React from 'react';
import './index.css';

function App() {
  return (
    <div className="landing-page">
      <nav className="container nav">
        <div className="logo">
          <div className="logo-icon">🤖</div>
          <span>AutoFill AI</span>
        </div>
        <div className="nav-links">
          <a href="#features" style={{ color: 'var(--text-dim)', textDecoration: 'none', marginRight: '2rem' }}>Features</a>
          <a href="#how-it-works" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Guide</a>
        </div>
      </nav>

      <header className="container hero" style={{ padding: '8rem 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AI-Powered Form Filling <br />
          <span style={{ color: 'var(--primary)', WebkitTextFillColor: 'initial' }}>Save Time, Boost Accuracy</span>
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-dim)', maxWidth: '700px', margin: '0 auto 3rem' }}>
          Stop wasting hours on job applications. Our AI agent learns from your resume and profile to fill any form instantly with high precision.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={() => window.open('https://github.com/Gaurav-meena95/form-filling-agent', '_blank')}>
            Download Extension
          </button>
          <a href="#how-it-works" className="btn-secondary" style={{ padding: '1rem 2.5rem', borderRadius: '50px', border: '1px solid var(--glass-border)', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            Watch Guide
          </a>
        </div>
      </header>

      <section id="how-it-works" className="container" style={{ padding: '6rem 0' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '4rem' }}>How AutoFill AI Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div className="glass-card">
            <div style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>📦</div>
            <h3>1. Install Extension</h3>
            <p style={{ color: 'var(--text-dim)', marginTop: '1rem' }}>
              Download the extension folder, go to <code>chrome://extensions</code>, enable Developer Mode, and click 'Load Unpacked'.
            </p>
          </div>
          <div className="glass-card">
            <div style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>📄</div>
            <h3>2. Set Up Profile</h3>
            <p style={{ color: 'var(--text-dim)', marginTop: '1rem' }}>
              Upload your resume and fill in your basic details. Our AI uses this context to understand your background.
            </p>
          </div>
          <div className="glass-card">
            <div style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>⚡</div>
            <h3>3. Fill Any Form</h3>
            <p style={{ color: 'var(--text-dim)', marginTop: '1rem' }}>
              Navigate to any application form, open the extension, and hit 'Fill Form'. Watch the magic happen in seconds.
            </p>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '4rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Ready to speed up your search?</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem' }}>Join hundreds of developers using AutoFill AI to land their dream jobs.</p>
          <button className="btn-primary">Add to Chrome — It's Free</button>
        </div>
      </section>

      <footer className="container" style={{ padding: '4rem 0', borderTop: '1px solid var(--glass-border)', textAlign: 'center', color: 'var(--text-dim)' }}>
        <p>© 2026 AutoFill AI. Built with ❤️ for the developer community.</p>
      </footer>
    </div>
  );
}

export default App;
