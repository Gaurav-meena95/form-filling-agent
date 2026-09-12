import React, { useState } from 'react';
import axios from 'axios';
import { Type, Plus, Trash2, Save, CheckCircle, AlertCircle, Loader2, User, Mail, Link, Briefcase, Phone } from 'lucide-react';

const FIELD_ICONS = {
  'Full Name': <User size={14} />,
  'Email': <Mail size={14} />,
  'LinkedIn URL': <Link size={14} />,
  'Phone': <Phone size={14} />,
  'Experience': <Briefcase size={14} />,
};

const FIELD_SUGGESTIONS = ['Full Name', 'Email', 'Phone', 'LinkedIn URL', 'Portfolio URL', 'Location', 'Years of Experience', 'GitHub URL', 'Skills', 'Current Role'];

const ManualProfile = () => {
  const [fields, setFields] = useState([
    { key: 'Full Name', value: '' },
    { key: 'Email', value: '' },
    { key: 'LinkedIn URL', value: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [focusedIdx, setFocusedIdx] = useState(null);

  const addField = () => {
    setFields([...fields, { key: '', value: '' }]);
  };

  const removeField = (index) => {
    if (fields.length <= 1) return;
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index, part, newVal) => {
    const updated = [...fields];
    updated[index][part] = newVal;
    setFields(updated);
  };

  const saveProfile = async () => {
    setSaving(true);
    setStatus(null);
    const profileData = {};
    fields.forEach(f => { if (f.key.trim()) profileData[f.key] = f.value; });
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/manual-profile`, profileData);
      setStatus('success');
    } catch (error) {
      console.error('Failed to save manual profile:', error);
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const filledCount = fields.filter(f => f.key.trim() && f.value.trim()).length;

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
      {/* Top shimmer */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(124,58,237,0.12))',
            border: '1px solid rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', flexShrink: 0
          }}>
            <Type size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                Manual Profile
              </h2>
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 50,
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em'
              }}>Step 1b</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'rgba(100,116,139,1)', lineHeight: 1.5 }}>
              Add profile data manually — or supplement your uploaded resume.
            </p>
          </div>
        </div>

        {/* Completion badge */}
        <div style={{
          padding: '4px 12px', borderRadius: 50,
          background: filledCount > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${filledCount > 0 ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
          fontSize: '0.72rem', fontWeight: 700,
          color: filledCount > 0 ? '#34d399' : 'rgba(71,85,105,1)'
        }}>
          {filledCount}/{fields.length} filled
        </div>
      </div>

      {/* Field List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: 280, overflowY: 'auto', paddingRight: 2 }}>
        {fields.map((field, index) => {
          const isFocused = focusedIdx === index;
          const icon = FIELD_ICONS[field.key];

          return (
            <div
              key={index}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1.6fr auto',
                gap: '0.5rem', alignItems: 'center',
                padding: '0.625rem 0.75rem',
                borderRadius: 12,
                background: isFocused ? 'rgba(124,58,237,0.06)' : 'rgba(255,255,255,0.025)',
                border: `1px solid ${isFocused ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)'}`,
                transition: 'all 0.2s ease'
              }}
            >
              {/* Field Name */}
              <div style={{ position: 'relative' }}>
                {icon && (
                  <div style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    color: 'rgba(100,116,139,1)', pointerEvents: 'none', zIndex: 1
                  }}>
                    {icon}
                  </div>
                )}
                <input
                  list={`field-suggestions-${index}`}
                  type="text"
                  value={field.key}
                  onChange={(e) => updateField(index, 'key', e.target.value)}
                  onFocus={() => setFocusedIdx(index)}
                  onBlur={() => setFocusedIdx(null)}
                  placeholder="Field name..."
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none', outline: 'none',
                    fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 700,
                    color: '#e2e8f0', paddingLeft: icon ? 28 : 6, paddingRight: 4,
                    caretColor: '#a78bfa'
                  }}
                />
                <datalist id={`field-suggestions-${index}`}>
                  {FIELD_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>

              {/* Value */}
              <input
                type="text"
                value={field.value}
                onChange={(e) => updateField(index, 'value', e.target.value)}
                onFocus={() => setFocusedIdx(index)}
                onBlur={() => setFocusedIdx(null)}
                placeholder="Enter value..."
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none', outline: 'none',
                  fontFamily: 'inherit', fontSize: '0.78rem',
                  color: 'rgba(148,163,184,1)', caretColor: '#a78bfa'
                }}
              />

              {/* Remove */}
              <button
                onClick={() => removeField(index)}
                disabled={fields.length <= 1}
                style={{
                  width: 26, height: 26, borderRadius: 7, border: 'none', cursor: fields.length > 1 ? 'pointer' : 'not-allowed',
                  background: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(71,85,105,1)',
                  transition: 'all 0.15s ease',
                  opacity: fields.length <= 1 ? 0.3 : 1,
                  flexShrink: 0
                }}
                onMouseEnter={e => { if (fields.length > 1) e.currentTarget.style.background = 'rgba(244,63,94,0.12)'; e.currentTarget.style.color = '#fb7185'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(71,85,105,1)'; }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Field */}
      <button
        onClick={addField}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '0.6rem', borderRadius: 11,
          border: '1.5px dashed rgba(255,255,255,0.1)',
          background: 'transparent', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 700,
          color: 'rgba(100,116,139,1)', transition: 'all 0.2s ease'
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.45)'; e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.background = 'rgba(124,58,237,0.05)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(100,116,139,1)'; e.currentTarget.style.background = 'transparent'; }}
      >
        <Plus size={14} />
        Add Another Field
      </button>

      {/* Save Button */}
      <button
        onClick={saveProfile}
        disabled={saving}
        style={{
          width: '100%', padding: '0.8rem', borderRadius: 12, border: 'none',
          cursor: saving ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', fontWeight: 700, fontSize: '0.875rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.25s ease',
          background: saving ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #6366f1, #7c3aed)',
          color: saving ? 'rgba(100,116,139,1)' : '#fff',
          boxShadow: saving ? 'none' : '0 4px 20px rgba(99,102,241,0.35)',
        }}
      >
        {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
        {saving ? 'Saving to database...' : 'Save & Sync Profile'}
      </button>

      {/* Status */}
      {status === 'success' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0.75rem 1rem', borderRadius: 12,
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
          color: '#34d399', fontWeight: 700, fontSize: '0.82rem'
        }}>
          <CheckCircle size={16} />
          Profile synced to ChromaDB successfully!
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
          Failed to save profile. Check backend connection.
        </div>
      )}
    </div>
  );
};

export default ManualProfile;
