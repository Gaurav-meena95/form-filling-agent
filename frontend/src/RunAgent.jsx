import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Loader2, CheckCircle, ExternalLink, Activity, AlertCircle, Monitor, Wifi, WifiOff, Terminal, Copy, Check } from 'lucide-react';

const RunAgent = () => {
  const [url, setUrl] = useState('');
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState(null); // 'completed', 'error'
  const [browserStatus, setBrowserStatus] = useState({ mode: 'checking...', is_connected: false });
  const [copied, setCopied] = useState(false);

  const fetchBrowserStatus = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/browser-status`);
      setBrowserStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch browser status:', error);
    }
  };

  useEffect(() => {
    fetchBrowserStatus();
    const interval = setInterval(fetchBrowserStatus, 5000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-card p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Activity size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Step 2: Run Agent</h2>
              <p className="text-slate-400 text-sm">Enter the form URL and let the agent do the work.</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${
            browserStatus.mode === 'live' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}>
            {browserStatus.mode === 'live' ? <Wifi size={14} /> : <WifiOff size={14} />}
            {browserStatus.mode} Session
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-200">Form URL</label>
          <input
            type="text"
            className="input-field"
            placeholder="https://docs.google.com/forms/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <button
          className="btn-primary w-full"
          onClick={startAgent}
          disabled={!url || running}
        >
          {running ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
          {running ? "Agent is working..." : "Start Form Filling"}
        </button>

        {running && (
          <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="animate-pulse w-2 h-2 rounded-full bg-indigo-500"></div>
              <span className="text-sm text-slate-200 font-medium">Analyzing & filling form fields...</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">Agent is identifying input types and matching with your profile data.</p>
          </div>
        )}

        {status === 'completed' && (
          <div className="flex items-center gap-3 text-emerald-400 font-semibold bg-emerald-400/10 p-4 rounded-xl">
            <CheckCircle size={20} /> Form filled successfully!
            <a href={url} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs no-underline">
              Check Form <ExternalLink size={14} />
            </a>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-3 text-rose-400 font-semibold bg-rose-400/10 p-4 rounded-xl">
            <AlertCircle size={20} /> Something went wrong.
          </div>
        )}
      </div>

      {browserStatus.mode !== 'live' && (
        <div className="glass-card p-6 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 mt-1">
              <Terminal size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold mb-1">Enable "Live Session" Mode</h4>
              <p className="text-slate-400 text-xs mb-4 leading-relaxed">
                To run the agent directly in your current browser tab (reusing your logins), 
                run the following command in your terminal and restart Chrome:
              </p>
              <div className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/5 group">
                <code className="text-indigo-300 text-[10px] sm:text-xs flex-1 break-all">
                  open -a "Google Chrome" --args --remote-debugging-port=9222
                </code>
                <button 
                  onClick={copyCommand}
                  className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
                >
                  {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RunAgent;
