import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Play, Loader2, CheckCircle, ExternalLink, Activity,
  AlertCircle, Wifi, WifiOff, Terminal, Copy, Check,
  Zap, Link2, RefreshCw
} from 'lucide-react';

const RunAgent = () => {
  const [url, setUrl] = useState('');
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState(null);
  const [browserStatus, setBrowserStatus] = useState({ mode: 'checking...', is_connected: false });
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/browser-status`);
        if (isMounted) setBrowserStatus(response.data);
      } catch (error) {
        console.error('Failed to fetch browser status:', error);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  // Simulate progress while agent is running
  useEffect(() => {
    if (!running) {
      const t = setTimeout(() => setProgress(0), 400);
      return () => clearTimeout(t);
    }
    const initial = setTimeout(() => setProgress(5), 0);
    const steps = [15, 30, 50, 68, 82, 91, 95];
    const timers = steps.map((p, i) =>
      setTimeout(() => setProgress(p), (i + 1) * 1800)
    );
    return () => {
      clearTimeout(initial);
      timers.forEach(clearTimeout);
    };
  }, [running]);

  const startAgent = async () => {
    if (!url) return;
    setRunning(true);
    setStatus(null);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/run-agent`, { url });
      setStatus(response.data.status);
    } catch (error) {
      console.error('Agent failed:', error);
      setStatus('error');
    } finally {
      setRunning(false);
    }
  };

  const copyCommand = () => {
    navigator.clipboard.writeText('open -a "Google Chrome" --args --remote-debugging-port=9222');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLive = browserStatus.mode === 'live';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ── MAIN CARD ── */}
      <div style={{
        background: 'rgba(11,16,30,0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Top shimmer line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${isLive ? 'rgba(16,185,129,0.5)' : 'rgba(245,158,11,0.5)'}, transparent)`,
          pointerEvents: 'none'
        }} />

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.1))',
              border: '1px solid rgba(139,92,246,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4b5fd', flexShrink: 0
            }}>
              <Activity size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                  Run Agent
                </h2>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 50,
                  background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
                  color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.06em'
                }}>Step 2</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(100,116,139,1)', lineHeight: 1.5 }}>
                Paste any form URL — AI will detect & fill all fields automatically.
              </p>
            </div>
          </div>

          {/* Browser status pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 12px', borderRadius: 50,
            background: isLive ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
            border: `1px solid ${isLive ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
            fontSize: '0.72rem', fontWeight: 800,
            color: isLive ? '#34d399' : '#fbbf24',
            textTransform: 'uppercase', letterSpacing: '0.07em'
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: isLive ? '#10b981' : '#f59e0b',
              boxShadow: `0 0 6px ${isLive ? '#10b981' : '#f59e0b'}`
            }} />
            {isLive ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isLive ? 'Live Session' : browserStatus.mode === 'checking...' ? 'Checking...' : 'Headless Mode'}
          </div>
        </div>

        {/* URL Input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(100,116,139,1)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>
            Form URL
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'rgba(71,85,105,1)', pointerEvents: 'none'
            }}>
              <Link2 size={16} />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && url && !running) startAgent(); }}
              placeholder="https://docs.google.com/forms/..."
              style={{
                width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: '0.75rem', paddingBottom: '0.75rem',
                background: 'rgba(6,11,24,0.7)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, outline: 'none', fontFamily: 'inherit', fontSize: '0.875rem',
                color: '#f1f5f9', transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                caretColor: '#a78bfa'
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <p style={{ fontSize: '0.7rem', color: 'rgba(71,85,105,1)', marginTop: '0.375rem' }}>
            Google Forms, Typeform, Greenhouse, Lever, Ashby — all supported
          </p>
        </div>

        {/* Progress Bar (visible when running) */}
        {running && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a78bfa' }}>Agent working...</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(100,116,139,1)' }}>{progress}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: 'linear-gradient(90deg, #7c3aed, #6366f1, #06b6d4)',
                width: `${progress}%`,
                transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 12px rgba(124,58,237,0.6)'
              }} />
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0.75rem 1rem', borderRadius: 10, marginTop: '0.75rem',
              background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)'
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: '0.78rem', color: 'rgba(148,163,184,1)', fontWeight: 500 }}>
                Analyzing form fields and matching with your profile...
              </span>
            </div>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={startAgent}
          disabled={!url || running}
          style={{
            width: '100%', padding: '0.875rem', borderRadius: 12, border: 'none',
            cursor: (!url || running) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', fontWeight: 700, fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.25s ease',
            background: (!url || running)
              ? 'rgba(255,255,255,0.06)'
              : 'linear-gradient(135deg, #7c3aed, #6366f1, #2563eb)',
            color: (!url || running) ? 'rgba(100,116,139,1)' : '#fff',
            boxShadow: (url && !running) ? '0 4px 24px rgba(124,58,237,0.4)' : 'none',
          }}
        >
          {running
            ? <><Loader2 size={18} className="animate-spin" /> Agent is filling the form...</>
            : <><Zap size={17} /> Start Form Filling</>
          }
        </button>

        {/* Success state */}
        {status === 'completed' && (
          <div style={{
            padding: '1rem 1.25rem', borderRadius: 14,
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <CheckCircle size={18} style={{ color: '#34d399', flexShrink: 0 }} />
              <span style={{ fontWeight: 800, color: '#34d399', fontSize: '0.875rem' }}>Form filled successfully!</span>
            </div>
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              <a
                href={url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 8,
                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                  color: '#34d399', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none',
                  transition: 'background 0.2s ease'
                }}
              >
                <ExternalLink size={13} /> Review Form
              </a>
              <button
                onClick={() => { setUrl(''); setStatus(null); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(148,163,184,1)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'background 0.2s ease'
                }}
              >
                <RefreshCw size={13} /> Fill Another
              </button>
            </div>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '0.875rem 1rem', borderRadius: 12,
            background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)',
            color: '#fb7185', fontWeight: 700, fontSize: '0.82rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            Agent encountered an error. Check that your profile is synced and try again.
          </div>
        )}
      </div>

      {/* ── LIVE SESSION SETUP CARD ── */}
      {!isLive && (
        <div style={{
          background: 'rgba(11,16,30,0.8)',
          border: '1px solid rgba(245,158,11,0.18)',
          borderRadius: 18,
          padding: '1.25rem 1.5rem',
          backdropFilter: 'blur(20px)',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Amber top shimmer */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24'
            }}>
              <Terminal size={18} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.875rem', marginBottom: '0.3rem' }}>
                Enable Live Session Mode
              </p>
              <p style={{ fontSize: '0.78rem', color: 'rgba(100,116,139,1)', lineHeight: 1.6, marginBottom: '0.875rem' }}>
                Run the agent directly in your open Chrome window — reusing your logged-in sessions and cookies. Run this command in your terminal, then restart Chrome:
              </p>

              {/* Command box */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.625rem 0.875rem', borderRadius: 10,
                background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <code style={{
                  flex: 1, fontSize: '0.72rem', fontFamily: 'ui-monospace,Menlo,monospace',
                  color: '#818cf8', wordBreak: 'break-all', lineHeight: 1.5
                }}>
                  open -a &quot;Google Chrome&quot; --args --remote-debugging-port=9222
                </code>
                <button
                  onClick={copyCommand}
                  style={{
                    width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                    flexShrink: 0, fontFamily: 'inherit',
                    background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: copied ? '#34d399' : 'rgba(100,116,139,1)',
                    transition: 'all 0.2s ease'
                  }}
                  title="Copy command"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>

              <p style={{ fontSize: '0.7rem', color: 'rgba(71,85,105,1)', marginTop: '0.6rem' }}>
                💡 For Windows: use <code style={{ fontFamily: 'monospace', color: '#818cf8' }}>start chrome --remote-debugging-port=9222</code>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RunAgent;
