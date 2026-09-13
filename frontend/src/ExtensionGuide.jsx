import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  CheckCircle2,
  FolderOpen,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Compass,
  ArrowRight,
  Zap,
  Globe
} from 'lucide-react';

/* ─── Small reusable helpers ─── */
const StepIcon = ({ name }) => {
  const icons = {
    Compass:      <Compass className="w-7 h-7 text-white" />,
    Settings:     <Settings className="w-7 h-7 text-white" />,
    FolderOpen:   <FolderOpen className="w-7 h-7 text-white" />,
    CheckCircle2: <CheckCircle2 className="w-7 h-7 text-white" />,
  };
  return icons[name] ?? <Compass className="w-7 h-7 text-white" />;
};

/* ─── STEP DATA ─── */
const BROWSERS = {
  chrome: {
    accentColor: '#4285f4',
    accentBg: 'rgba(66,133,244,0.1)',
    accentBorder: 'rgba(66,133,244,0.35)',
    tabActiveClass: 'active-chrome',
    label: 'Google Chrome',
    logo: '/images/browsers/chrome.svg',
    urlPlaceholder: 'chrome://extensions/',
  },
  edge: {
    accentColor: '#0078d4',
    accentBg: 'rgba(0,120,212,0.1)',
    accentBorder: 'rgba(0,120,212,0.35)',
    tabActiveClass: 'active-edge',
    label: 'Microsoft Edge',
    logo: '/images/browsers/edge.svg',
    urlPlaceholder: 'edge://extensions/',
  },
};

const STEPS = {
  chrome: [
    {
      num: 1, icon: 'Compass',
      title: 'Open Extensions Page',
      desc: 'Type <code>chrome://extensions/</code> in Chrome\'s address bar and press Enter, or go to Menu (⋮) → More Tools → Extensions.',
      url: 'chrome://extensions/',
      img: '/images/guide/chrome/step1.png',
      color: '#4285f4',
      gradient: 'linear-gradient(135deg, #4285f4, #06b6d4)',
    },
    {
      num: 2, icon: 'Settings',
      title: 'Enable Developer Mode',
      desc: 'Toggle the "<strong>Developer mode</strong>" switch in the <strong>top-right corner</strong> of the extensions page. This reveals the unpacked loading buttons.',
      img: '/images/guide/chrome/step2.png',
      color: '#ea4335',
      gradient: 'linear-gradient(135deg, #ea4335, #f97316)',
    },
    {
      num: 3, icon: 'FolderOpen',
      title: 'Load Unpacked Extension',
      desc: 'Click "<strong>Load unpacked</strong>" and select the unzipped <code>extension/</code> folder that contains your <code>manifest.json</code> file.',
      img: '/images/guide/chrome/step3.png',
      color: '#fbbc04',
      gradient: 'linear-gradient(135deg, #fbbc04, #f97316)',
    },
    {
      num: 4, icon: 'CheckCircle2',
      title: 'Installation Complete!',
      desc: '<strong>AutoFill AI</strong> will appear in your extensions list. Pin it from the puzzle icon (🧩) in the toolbar for one-click access.',
      img: '/images/guide/chrome/step4.png',
      color: '#34a853',
      gradient: 'linear-gradient(135deg, #34a853, #06b6d4)',
    },
  ],
  edge: [
    {
      num: 1, icon: 'Compass',
      title: 'Open Extensions Page',
      desc: 'Type <code>edge://extensions/</code> in Edge\'s address bar and press Enter.',
      url: 'edge://extensions/',
      img: '/images/guide/edge/step1.png',
      color: '#0078d4',
      gradient: 'linear-gradient(135deg, #0078d4, #06b6d4)',
    },
    {
      num: 2, icon: 'Settings',
      title: 'Enable Developer Mode',
      desc: 'Toggle the "Developer mode" switch in the <strong>bottom-left corner</strong> of the left sidebar.',
      img: '/images/guide/edge/step2.png',
      color: '#00bcf2',
      gradient: 'linear-gradient(135deg, #00bcf2, #0078d4)',
    },
    {
      num: 3, icon: 'FolderOpen',
      title: 'Load Unpacked Extension',
      desc: 'Click "<strong>Load unpacked</strong>" and select your unzipped extension folder.',
      img: '/images/guide/edge/step3.png',
      color: '#50e6ff',
      gradient: 'linear-gradient(135deg, #50e6ff, #0078d4)',
    },
    {
      num: 4, icon: 'CheckCircle2',
      title: 'Installation Complete!',
      desc: 'Extension is now active in Edge. Pin it to your toolbar for quick access.',
      img: '/images/guide/edge/step4.png',
      color: '#00b7c3',
      gradient: 'linear-gradient(135deg, #00b7c3, #0078d4)',
    },
  ],
};

const FAQS = [
  {
    q: 'Why do I see "Manifest file is missing"?',
    a: 'You selected the wrong folder. Extract the ZIP first, then pick the folder that directly contains manifest.json — not the parent ZIP folder.',
  },
  {
    q: 'Does this work in Brave or Opera?',
    a: 'Yes! All Chromium-based browsers support this. Open brave://extensions/ in Brave and follow the exact same Chrome steps.',
  },
  {
    q: 'How do I fill a form after installing?',
    a: 'Click the puzzle icon (🧩) in the toolbar, pin AutoFill AI, navigate to any job application form, and click "Fill Form".',
  },
  {
    q: 'Why does Chrome show a warning after restart?',
    a: 'This is normal for developer-mode extensions. Click "Cancel" or "Keep it" and the extension stays active — no issues.',
  },
];

/* ─── MAIN COMPONENT ─── */
export default function ExtensionGuide({ onOpenAgent }) {
  const [browser, setBrowser] = useState('chrome');
  const [copied, setCopied] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [done, setDone] = useState({ 1: false, 2: false, 3: false, 4: false });

  const toggleDone = n => setDone(p => ({ ...p, [n]: !p[n] }));

  const copyUrl = txt => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const steps = STEPS[browser];
  const faqs = FAQS;
  const completedCount = Object.values(done).filter(Boolean).length;
  const allDone = completedCount === 4;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 1.25rem 4rem' }}>

      {/* ── SECTION HEADER ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        gap: '1rem', marginBottom: '2.5rem', paddingTop: '0.5rem'
      }}>
        {/* Left: title + progress */}
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '4px 14px', borderRadius: 50,
            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.22)',
            color: '#a78bfa', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase', marginBottom: '0.75rem'
          }}>
            <Globe size={12} />
            Browser Extension Setup
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: '0.35rem' }}>
            Visual Installation Guide
          </h2>
          <p style={{ color: 'rgba(139,152,180,1)', fontSize: '0.875rem' }}>
            Download ZIP → Extract → Load in browser. Done in under 1 minute.
          </p>
        </div>

        {/* Right: progress ring + download button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
          {/* Progress indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)'
          }}>
            {[1,2,3,4].map(n => (
              <div key={n}
                onClick={() => toggleDone(n)}
                style={{
                  width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
                  background: done[n] ? '#10b981' : 'rgba(255,255,255,0.15)',
                  boxShadow: done[n] ? '0 0 8px rgba(16,185,129,0.6)' : 'none',
                  transition: 'all 0.25s ease'
                }}
              />
            ))}
            <span style={{ fontSize: '0.7rem', color: 'rgba(139,152,180,1)', marginLeft: 4, fontWeight: 700 }}>
              {completedCount}/4
            </span>
          </div>

          {/* Download button */}
          <a
            href="/autofill-extension.zip"
            download="autofill-extension.zip"
            className="btn-primary"
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.78rem', gap: 7, textDecoration: 'none' }}
          >
            <Download size={14} />
            Download ZIP
          </a>
        </div>
      </div>

      {/* ── BROWSER TABS ── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem' }}>
        {Object.entries(BROWSERS).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setBrowser(key)}
            className={`browser-tab ${browser === key ? cfg.tabActiveClass : ''}`}
            style={{ flex: '1 1 auto', maxWidth: 280 }}
          >
            <img src={cfg.logo} alt={cfg.label} style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} />
            <span>{cfg.label}</span>
            {browser === key && (
              <span style={{
                marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
                background: cfg.accentColor,
                boxShadow: `0 0 8px ${cfg.accentColor}`,
                animation: 'pulse 2s infinite'
              }} />
            )}
          </button>
        ))}
      </div>

      {/* ── BEFORE NOTE ── */}
      <div style={{
        display: 'flex', gap: '1rem', alignItems: 'flex-start',
        padding: '1.1rem 1.4rem', borderRadius: 16, marginBottom: '2.5rem',
        background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.2)'
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa'
        }}>
          <AlertCircle size={18} />
        </div>
        <div>
          <p style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            💡 Before Installation:
          </p>
          <p style={{ color: 'rgba(139,152,180,1)', fontSize: '0.82rem', lineHeight: 1.65 }}>
            Download the ZIP file below and extract (unzip) it first. You need the unzipped folder containing manifest.json to load the extension.
          </p>
        </div>
      </div>

      {/* ── STEPS TIMELINE ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const isDone = done[step.num];

          return (
            <div key={step.num} style={{ position: 'relative' }}>
              {/* Vertical connector line */}
              {!isLast && (
                <div style={{
                  position: 'absolute',
                  left: 30, top: 72, width: 2,
                  height: 'calc(100% + 1.5rem)',
                  background: `linear-gradient(to bottom, ${step.color}50 0%, ${step.color}10 100%)`,
                  borderRadius: 4, zIndex: 0, pointerEvents: 'none'
                }} />
              )}

              {/* Step Card */}
              <div
                className={`step-card ${isDone ? 'step-card-done' : ''}`}
                style={{ position: 'relative', zIndex: 1 }}
              >
                <div style={{ padding: '1.75rem 2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>

                    {/* Step icon + number */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: 60, height: 60, borderRadius: 18,
                        background: step.gradient,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 6px 20px ${step.color}35`,
                        transition: 'transform 0.3s ease',
                      }}>
                        <StepIcon name={step.icon} />
                      </div>
                      <div className="step-num-badge" style={{ backgroundColor: step.color }}>
                        {isDone ? <Check size={11} strokeWidth={3} /> : step.num}
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.6rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                          {step.title}
                        </h3>
                        <button
                          onClick={() => toggleDone(step.num)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                            fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 700,
                            transition: 'all 0.2s ease',
                            background: isDone ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                            outline: isDone ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)',
                            color: isDone ? '#34d399' : 'rgba(100,116,139,1)',
                          }}
                        >
                          <CheckCircle2 size={13} />
                          {isDone ? 'Done ✓' : 'Mark Done'}
                        </button>
                      </div>

                      <p
                        style={{ color: 'rgba(139,152,180,1)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1rem' }}
                        dangerouslySetInnerHTML={{ __html: step.desc }}
                      />

                      {/* URL copy box */}
                      {step.url && (
                        <div style={{ marginBottom: '1.25rem' }}>
                          <div className="url-copy-box">
                            <code style={{ color: '#818cf8', fontSize: '0.8rem', fontFamily: 'ui-monospace,monospace', flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {step.url}
                            </code>
                            <button
                              onClick={() => copyUrl(step.url)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '4px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                                fontFamily: 'inherit', fontSize: '0.7rem', fontWeight: 700,
                                background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(124,58,237,0.2)',
                                color: copied ? '#34d399' : '#a78bfa',
                                transition: 'all 0.2s ease', flexShrink: 0
                              }}
                            >
                              {copied ? <Check size={11} /> : <Copy size={11} />}
                              {copied ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Screenshot */}
                      <div
                        className="screenshot-wrap"
                        style={{ cursor: 'default' }}
                      >
                        <img
                          src={step.img}
                          alt={`Step ${step.num} Screenshot`}
                          loading="lazy"
                        />

                        {/* Step label bottom ribbon */}
                        <div style={{
                          position: 'absolute', bottom: 10, left: 10,
                          padding: '4px 10px', borderRadius: 7,
                          background: 'rgba(6,11,24,0.82)', border: `1px solid ${step.color}40`,
                          fontSize: '0.68rem', fontWeight: 700, color: step.color,
                          backdropFilter: 'blur(8px)', letterSpacing: '0.05em'
                        }}>
                          Step {step.num} of 4
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── ALL DONE CELEBRATION ── */}
      {allDone && (
        <div
          className="animate-fadeIn"
          style={{
            marginTop: '2rem', padding: '1.75rem 2rem', borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.08))',
            border: '1px solid rgba(16,185,129,0.3)',
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, fontSize: '1.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)'
            }}>🎉</div>
            <div>
              <p style={{ fontWeight: 800, color: '#34d399', marginBottom: 2 }}>
                Setup Complete! 🚀
              </p>
              <p style={{ fontSize: '0.8rem', color: 'rgba(139,152,180,1)' }}>
                Extension is live. Open any form and use AutoFill AI.
              </p>
            </div>
          </div>
          {onOpenAgent && (
            <button onClick={onOpenAgent} className="btn-primary" style={{ gap: 8 }}>
              <Zap size={15} />
              Open Agent Dashboard
            </button>
          )}
        </div>
      )}

      {/* ── WARNING NOTE ── */}
      <div style={{
        display: 'flex', gap: '1rem', alignItems: 'flex-start',
        padding: '1.1rem 1.4rem', borderRadius: 16, marginTop: '2rem',
        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)'
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24'
        }}>
          <AlertCircle size={18} />
        </div>
        <div>
          <p style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            ⚠️ Important Note:
          </p>
          <p style={{ color: 'rgba(139,152,180,1)', fontSize: '0.82rem', lineHeight: 1.65 }}>
            Extensions installed in developer mode may show a warning after browser restart. This is completely normal — click "Cancel" or "Keep it" and your extension stays active.
          </p>
        </div>
      </div>

      {/* ── CTA TO AGENT ── */}
      {onOpenAgent && !allDone && (
        <div style={{
          marginTop: '2rem', padding: '1.5rem 2rem', borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(37,99,235,0.06))',
          border: '1px solid rgba(124,58,237,0.18)',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem'
        }}>
          <div>
            <p style={{ fontWeight: 800, color: '#f1f5f9', marginBottom: 3 }}>
              Extension Installed?
            </p>
            <p style={{ fontSize: '0.8rem', color: 'rgba(139,152,180,1)' }}>
              Open Agent Dashboard to sync your resume and start filling forms.
            </p>
          </div>
          <button onClick={onOpenAgent} className="btn-primary" style={{ gap: 8 }}>
            Agent Dashboard <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ── FAQs ── */}
      <div style={{ marginTop: '3.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa'
          }}>
            <HelpCircle size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              Troubleshooting & FAQs
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'rgba(100,116,139,1)' }}>
              Common issues and quick fixes
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className={`faq-item ${isOpen ? 'faq-open' : ''}`}>
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%', padding: '1rem 1.25rem', textAlign: 'left',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
                    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit'
                  }}
                >
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: isOpen ? '#a78bfa' : 'rgba(124,58,237,0.4)', flexShrink: 0, display: 'inline-block' }} />
                    {faq.q}
                  </span>
                  {isOpen
                    ? <ChevronUp size={16} style={{ color: '#a78bfa', flexShrink: 0 }} />
                    : <ChevronDown size={16} style={{ color: 'rgba(100,116,139,1)', flexShrink: 0 }} />
                  }
                </button>
                {isOpen && (
                  <div style={{
                    padding: '0 1.25rem 1.1rem 2.5rem', fontSize: '0.82rem',
                    color: 'rgba(139,152,180,1)', lineHeight: 1.7,
                    borderTop: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ paddingTop: '0.75rem' }}>{faq.a}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
