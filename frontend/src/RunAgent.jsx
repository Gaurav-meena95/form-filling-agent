import React, { useState } from 'react';
import axios from 'axios';
import { Play, Loader2, CheckCircle, ExternalLink, Activity, AlertCircle } from 'lucide-react';

const RunAgent = () => {
  const [url, setUrl] = useState('');
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState(null); // 'completed', 'error'

  const startAgent = async () => {
    if (!url) return;
    setRunning(true);
    setStatus(null);

    try {
      const response = await axios.post('http://localhost:8000/run-agent', { url });
      setStatus(response.data.status);
    } catch (error) {
      console.error('Agent failed:', error);
      setStatus('error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="glass-card p-8 flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
          <Activity size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Step 2: Run Agent</h2>
          <p className="text-slate-400 text-sm">Enter the form URL and let the agent do the work.</p>
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
  );
};

export default RunAgent;
