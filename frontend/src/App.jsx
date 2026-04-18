import React from 'react';
import UploadResume from './UploadResume';
import RunAgent from './RunAgent';
import { Bot, Zap, Shield, Sparkles } from 'lucide-react';

function App() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <nav className="flex justify-between items-center mb-16 py-6">
        <div className="flex items-center gap-4">
          <div className="btn-primary !p-2.5 !rounded-xl">
            <Bot size={28} />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">AutoFill AI</span>
        </div>
        <div className="flex items-center gap-10">
          <a href="#" className="hidden md:block text-slate-400 no-underline text-sm font-medium hover:text-white transition-colors">Docs</a>
          <a href="#" className="hidden md:block text-slate-400 no-underline text-sm font-medium hover:text-white transition-colors">Privacy</a>
          <button className="btn-primary !px-5 !py-2 text-sm">Get Started</button>
        </div>
      </nav>

      <header className="text-center mb-20">
        <div className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold mb-8 uppercase tracking-wider">
          <Sparkles size={16} /> Next-Gen Form Automation
        </div>
        <h1 className="text-6xl md:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight text-white">
          Fill forms in seconds, <br />not minutes.
        </h1>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
          Upload your resume once and let our intelligent agent handle the boring stuff. 
          Perfect for job applications, KYC, and surveys.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">
        <UploadResume />
        <RunAgent />
      </div>

      <div className="glass-card p-12 text-center bg-gradient-to-br from-slate-800/10 to-slate-900/30">
        <h3 className="text-3xl font-extrabold mb-12 text-white">Why use AutoFill AI?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="text-indigo-400 bg-indigo-400/10 p-4 rounded-2xl">
              <Zap size={32} />
            </div>
            <h4 className="font-bold text-xl text-white">Lightning Fast</h4>
            <p className="text-slate-400 text-sm leading-relaxed">Fill complex forms with 50+ fields in under 10 seconds.</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="text-violet-400 bg-violet-400/10 p-4 rounded-2xl">
              <Shield size={32} />
            </div>
            <h4 className="font-bold text-xl text-white">Secure & Private</h4>
            <p className="text-slate-400 text-sm leading-relaxed">Your resume data is encrypted and stored in your local ChromaDB.</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="text-rose-400 bg-rose-400/10 p-4 rounded-2xl">
              <Bot size={32} />
            </div>
            <h4 className="font-bold text-xl text-white">Human-like</h4>
            <p className="text-slate-400 text-sm leading-relaxed">Smart agent handles checkboxes, dropdowns, and dynamic fields.</p>
          </div>
        </div>
      </div>

      <footer className="mt-32 pb-16 border-t border-white/5 pt-16 text-center">
        <div className="text-slate-600 text-sm font-medium">
          © 2026 AutoFill AI Agent. Built for speed and productivity.
        </div>
      </footer>
    </div>
  );
}

export default App;
