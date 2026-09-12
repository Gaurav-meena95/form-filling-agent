import React, { useState } from 'react';
import './index.css';
import ExtensionGuide from './ExtensionGuide';
import UploadResume from './UploadResume';
import ManualProfile from './ManualProfile';
import RunAgent from './RunAgent';
import { 
  Download, 
  Sparkles, 
  BookOpen, 
  Cpu, 
  Layers,
  Code2, 
  ArrowRight,
  Zap,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('guide');

  return (
    <div className="min-h-screen flex flex-col" style={{ position: 'relative', zIndex: 1 }}>

      {/* ── NAVIGATION ── */}
      <header className="sticky top-0 z-50" style={{
        background: 'rgba(6,11,24,0.8)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        borderBottom: '1px solid rgba(255,255,255,0.07)'
      }}>
        <div className="container nav">
          {/* Logo */}
          <button onClick={() => setActiveTab('guide')} className="flex items-center gap-2.5 group" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div className="logo-icon group-hover:scale-105 transition-transform">🤖</div>
            <div className="flex items-center gap-2">
              <span className="logo text-white" style={{ fontSize: '1.15rem' }}>AutoFill AI</span>
              <span className="pill-badge" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
                Live
              </span>
            </div>
          </button>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              { id: 'guide', icon: <BookOpen size={13} />, label: 'Setup Guide' },
              { id: 'dashboard', icon: <Cpu size={13} />, label: 'Agent' },
              { id: 'overview', icon: <Layers size={13} />, label: 'Features', hideOnMobile: true },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={tab.hideOnMobile ? 'hidden md:flex' : ''}
                style={{
                  display: tab.hideOnMobile ? undefined : 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 10,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: activeTab === tab.id ? 'linear-gradient(135deg, #7c3aed, #6366f1, #2563eb)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'rgba(139,152,180,1)',
                  boxShadow: activeTab === tab.id ? '0 4px 14px rgba(124,58,237,0.35)' : 'none',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a
              href="/autofill-extension.zip"
              download="autofill-extension.zip"
              className="btn-primary"
              style={{ padding: '0.5rem 1.1rem', fontSize: '0.75rem', display: 'none', gap: 6 }}
              onMouseEnter={e => e.currentTarget.style.display = 'flex'}
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download</span>
            </a>
            <a
              href="/autofill-extension.zip"
              download="autofill-extension.zip"
              className="btn-primary"
              style={{ padding: '0.5rem 1.1rem', fontSize: '0.75rem', gap: 6 }}
            >
              <Download size={13} />
              <span>Download</span>
            </a>
            <a
              href="https://github.com/Gaurav-meena95/form-filling-agent"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: 34, height: 34, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(139,152,180,1)',
                transition: 'all 0.2s ease',
                textDecoration: 'none'
              }}
              title="GitHub"
            >
              <Code2 size={15} />
            </a>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={{ flex: 1 }}>

        {/* ── HERO ── */}
        <section className="container" style={{ paddingTop: '5rem', paddingBottom: '4rem', textAlign: 'center' }}>
          {/* Animated badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px',
            borderRadius: 50,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(99,102,241,0.10))',
            border: '1px solid rgba(124,58,237,0.25)',
            color: '#a78bfa',
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: '1.75rem',
            animation: 'fadeUp 0.6s ease forwards'
          }}>
            <Sparkles size={13} style={{ color: '#c4b5fd' }} />
            Chrome Extension · AI Form Agent · Manifest V3
          </div>

          {/* H1 */}
          <h1 style={{
            fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
            fontWeight: 900,
            letterSpacing: '-0.035em',
            lineHeight: 1.08,
            marginBottom: '1.25rem',
            animation: 'fadeUp 0.6s 0.1s ease both'
          }}>
            <span style={{ color: '#f1f5f9' }}>Fill Any Form.</span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 40%, #60a5fa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              In Seconds, With AI.
            </span>
          </h1>

          {/* Subtext */}
          <p style={{
            color: 'rgba(139,152,180,1)', fontSize: '1.05rem', maxWidth: 580, margin: '0 auto 2.5rem',
            lineHeight: 1.7, animation: 'fadeUp 0.6s 0.2s ease both'
          }}>
            Download our Chrome Extension, set up your resume & profile, and watch AI auto-fill job applications instantly. 4 steps, under 1 minute.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', animation: 'fadeUp 0.6s 0.3s ease both' }}>
            <a
              href="/autofill-extension.zip"
              download="autofill-extension.zip"
              className="btn-primary"
              style={{ padding: '0.9rem 2.25rem', fontSize: '0.95rem', gap: 8, textDecoration: 'none' }}
            >
              <Download size={18} />
              Download Extension (.ZIP)
            </a>
            <button
              onClick={() => setActiveTab(activeTab === 'guide' ? 'dashboard' : 'guide')}
              className="btn-secondary"
              style={{ padding: '0.9rem 2rem', fontSize: '0.95rem', gap: 8 }}
            >
              {activeTab === 'guide' ? (
                <><Cpu size={16} />Open Agent Dashboard</>
              ) : (
                <><BookOpen size={16} />View Setup Guide</>
              )}
            </button>
          </div>

          {/* Trust stats strip */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center',
            marginTop: '3rem',
            animation: 'fadeUp 0.6s 0.4s ease both'
          }}>
            {[
              { label: '4 Steps', desc: 'Easy install' },
              { label: '< 1 min', desc: 'Setup time' },
              { label: 'Chrome + Edge', desc: 'Supported' },
              { label: 'Manifest V3', desc: 'Latest standard' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '0.75rem 1.5rem',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)'
              }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#f1f5f9' }}>{item.label}</span>
                <span style={{ fontSize: '0.7rem', color: 'rgba(139,152,180,1)', letterSpacing: '0.04em' }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── TAB 1: GUIDE ── */}
        {activeTab === 'guide' && (
          <section className="animate-fadeIn">
            <ExtensionGuide onOpenAgent={() => setActiveTab('dashboard')} />
          </section>
        )}

        {/* ── TAB 2: DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <section className="container animate-fadeIn" style={{ maxWidth: 1100, paddingTop: '1rem', paddingBottom: '3rem' }}>
            {/* Dashboard header */}
            <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(99,102,241,0.12))',
                  border: '1px solid rgba(124,58,237,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>🧠</div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 2 }}>Agent & Profile Dashboard</h2>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(139,152,180,1)' }}>Upload resume or set profile data, then run agent on any form URL</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('guide')}
                className="btn-secondary"
                style={{ padding: '0.5rem 1.2rem', fontSize: '0.75rem', gap: 6 }}
              >
                <BookOpen size={13} /> Need Setup Help?
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <UploadResume />
                <ManualProfile />
              </div>
              <div>
                <RunAgent />
              </div>
            </div>
          </section>
        )}

        {/* ── TAB 3: FEATURES ── */}
        {activeTab === 'overview' && (
          <section className="container animate-fadeIn" style={{ maxWidth: 1000, paddingTop: '1rem', paddingBottom: '4rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', marginBottom: '0.75rem', color: '#f1f5f9' }}>
                How <span style={{ background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>AutoFill AI</span> Works
              </h2>
              <p style={{ color: 'rgba(139,152,180,1)', maxWidth: 520, margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Built with FastAPI, LangChain, Playwright & Chrome Extension Manifest V3.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              {[
                { emoji: '📦', title: 'Chrome Extension', desc: 'Manifest V3 background worker + content script inspects forms, labels, radio inputs & dropdowns.', color: '#a78bfa' },
                { emoji: '🧠', title: 'Context & Vector DB', desc: 'Extracts structured entities from your resume via LangChain and semantically matches every field.', color: '#60a5fa' },
                { emoji: '⚡', title: 'Instant Automation', desc: 'Automates clicks, keypresses, and dropdowns inside your browser session without captchas.', color: '#34d399' },
              ].map(feat => (
                <div key={feat.title} className="glass-card" style={{ padding: '1.75rem' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, fontSize: '1.6rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `rgba(${feat.color === '#a78bfa' ? '167,139,250' : feat.color === '#60a5fa' ? '96,165,250' : '52,211,153'},0.1)`,
                    border: `1px solid rgba(${feat.color === '#a78bfa' ? '167,139,250' : feat.color === '#60a5fa' ? '96,165,250' : '52,211,153'},0.2)`,
                    marginBottom: '1.25rem'
                  }}>
                    {feat.emoji}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.6rem' }}>{feat.title}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(139,152,180,1)', lineHeight: 1.65 }}>{feat.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(37,99,235,0.06))', border: '1px solid rgba(124,58,237,0.2)' }}>
              <Zap size={36} style={{ color: '#a78bfa', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.75rem', color: '#f1f5f9', marginBottom: '0.75rem' }}>Ready to Start?</h3>
              <p style={{ color: 'rgba(139,152,180,1)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
                Follow the 4-step visual guide to install the extension in under a minute.
              </p>
              <button onClick={() => setActiveTab('guide')} className="btn-primary" style={{ gap: 8 }}>
                Open Setup Guide <ArrowRight size={16} />
              </button>
            </div>
          </section>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: '2rem 0',
        marginTop: '4rem',
        background: 'rgba(4,8,20,0.8)',
        backdropFilter: 'blur(16px)',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="logo-icon" style={{ width: 28, height: 28, fontSize: '0.9rem' }}>🤖</div>
            <span style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.9rem' }}>AutoFill AI</span>
            <span style={{ color: 'rgba(75,85,99,1)', fontSize: '0.75rem' }}>· Extension Setup Guide</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(75,85,99,1)' }}>
            Built for seamless job applications & form automation.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {[
              { label: 'Setup Guide', tab: 'guide' },
              { label: 'Agent', tab: 'dashboard' },
              { label: 'Features', tab: 'overview' },
            ].map(link => (
              <button
                key={link.tab}
                onClick={() => setActiveTab(link.tab)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(100,116,139,1)', fontSize: '0.75rem', transition: 'color 0.2s ease', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.color = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(100,116,139,1)'}
              >
                {link.label}
              </button>
            ))}
            <a
              href="https://github.com/Gaurav-meena95/form-filling-agent"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'rgba(100,116,139,1)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', transition: 'color 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(100,116,139,1)'}
            >
              GitHub <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
