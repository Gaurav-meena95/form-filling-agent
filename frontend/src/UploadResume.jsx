import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, CheckCircle, AlertCircle, Loader2, FileText, X } from 'lucide-react';

const UploadResume = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f || f.type !== 'application/pdf') return;
    setFile(f);
    setStatus(null);
  };

  const handleFileChange = (e) => handleFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
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

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
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
      {/* Card top shimmer */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 13,
          background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(99,102,241,0.12))',
          border: '1px solid rgba(124,58,237,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa',
          flexShrink: 0
        }}>
          <Upload size={20} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              Upload Resume
            </h2>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 50,
              background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
              color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>Step 1</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(100,116,139,1)', lineHeight: 1.5 }}>
            PDF resume upload — we&apos;ll extract & index your data for instant form filling.
          </p>
        </div>
      </div>

      {/* Drop Zone */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          display: 'block', cursor: 'pointer',
          border: `2px dashed ${dragOver ? 'rgba(124,58,237,0.7)' : file ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 14,
          padding: file ? '1rem 1.25rem' : '2rem 1.25rem',
          background: dragOver
            ? 'rgba(124,58,237,0.06)'
            : file
            ? 'rgba(16,185,129,0.04)'
            : 'rgba(255,255,255,0.02)',
          transition: 'all 0.25s ease',
        }}
      >
        {file ? (
          /* File selected state */
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399'
            }}>
              <FileText size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.83rem', fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'rgba(100,116,139,1)' }}>
                {formatSize(file.size)} · PDF
              </p>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); setFile(null); setStatus(null); }}
              style={{
                width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'rgba(244,63,94,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb7185',
                flexShrink: 0, transition: 'background 0.2s ease'
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          /* Empty drop zone */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', textAlign: 'center' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: dragOver ? '#a78bfa' : 'rgba(100,116,139,1)',
              transition: 'all 0.2s ease'
            }}>
              <Upload size={20} />
            </div>
            <div>
              <p style={{ fontSize: '0.83rem', fontWeight: 600, color: 'rgba(148,163,184,1)', marginBottom: 2 }}>
                {dragOver ? 'Drop PDF here' : 'Drag & drop PDF or click to browse'}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'rgba(71,85,105,1)' }}>PDF files only · Max 10 MB</p>
            </div>
          </div>
        )}
        <input ref={inputRef} type="file" style={{ display: 'none' }} accept=".pdf" onChange={handleFileChange} />
      </label>

      {/* Upload Button */}
      <button
        onClick={uploadResume}
        disabled={!file || uploading}
        style={{
          width: '100%', padding: '0.8rem', borderRadius: 12, border: 'none', cursor: file && !uploading ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit', fontWeight: 700, fontSize: '0.875rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.25s ease',
          background: (!file || uploading)
            ? 'rgba(255,255,255,0.06)'
            : 'linear-gradient(135deg, #7c3aed, #6366f1, #2563eb)',
          color: (!file || uploading) ? 'rgba(100,116,139,1)' : '#fff',
          boxShadow: (file && !uploading) ? '0 4px 20px rgba(124,58,237,0.35)' : 'none',
        }}
      >
        {uploading ? <Loader2 size={17} className="animate-spin" /> : <Upload size={17} />}
        {uploading ? 'Processing resume...' : 'Upload & Ingest Resume'}
      </button>

      {/* Status feedback */}
      {status === 'success' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0.75rem 1rem', borderRadius: 12,
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
          color: '#34d399', fontWeight: 700, fontSize: '0.82rem'
        }}>
          <CheckCircle size={16} />
          Resume ingested successfully! Your data is ready.
        </div>
      )}
      {status === 'error' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0.75rem 1rem', borderRadius: 12,
          background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)',
          color: '#fb7185', fontWeight: 700, fontSize: '0.82rem'
        }}>
          <AlertCircle size={16} />
          Upload failed. Check backend connection and try again.
        </div>
      )}
    </div>
  );
};

export default UploadResume;
