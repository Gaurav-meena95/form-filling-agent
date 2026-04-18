import React, { useState } from 'react';
import axios from 'axios';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const UploadResume = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null); // 'success', 'error'

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus(null);
  };

  const uploadResume = async () => {
    if (!file) return;
    setUploading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/upload-resume`, formData);
      setStatus('success');
    } catch (error) {
      console.error('Upload failed:', error);
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-card p-8 flex flex-col items-center gap-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2">
        <Upload size={32} />
      </div>
      <h2 className="text-2xl font-bold text-white">Step 1: Upload Resume</h2>
      <p className="text-slate-400 text-center text-sm leading-relaxed">
        Upload your PDF resume. We'll extract your details and store them securely for form filling.
      </p>

      <label className="w-full cursor-pointer group">
        <div className="border-2 border-dashed border-white/10 group-hover:border-indigo-500/50 group-hover:bg-sky-500/5 transition-all rounded-2xl p-10 flex flex-col items-center gap-3">
          <Upload size={24} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
          <span className="text-sm text-slate-400 group-hover:text-slate-200 font-medium text-center">
            {file ? file.name : "Click to select PDF"}
          </span>
          <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
        </div>
      </label>

      <button
        className="btn-primary w-full"
        onClick={uploadResume}
        disabled={!file || uploading}
      >
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
        {uploading ? "Processing..." : "Finish Ingestion"}
      </button>

      {status === 'success' && (
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm bg-emerald-400/10 px-4 py-2 rounded-xl">
          <CheckCircle size={18} /> Resume processed successfully!
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm bg-rose-400/10 px-4 py-2 rounded-xl">
          <AlertCircle size={18} /> Failed to process resume.
        </div>
      )}
    </div>
  );
};

export default UploadResume;
