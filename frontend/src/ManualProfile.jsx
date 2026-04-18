import React, { useState } from 'react';
import axios from 'axios';
import { Type, Plus, Trash2, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const ManualProfile = () => {
  const [fields, setFields] = useState([
    { key: 'Full Name', value: '' }, 
    { key: 'Email', value: '' },
    { key: 'LinkedIn URL', value: '' }
  ]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

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
    
    // Convert array to object
    const profileData = {};
    fields.forEach(f => {
      if (f.key.trim()) profileData[f.key] = f.value;
    });

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

  return (
    <div className="glass-card p-8 flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
          <Type size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Step 1: Set Your Details</h2>
          <p className="text-slate-400 text-sm">Fill in your information manually or via Resume upload.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {fields.map((field, index) => (
          <div key={index} className="flex gap-3 items-end group">
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 block">Field Name</label>
              <input 
                type="text" 
                className="input-field !py-2 !text-sm" 
                placeholder="e.g. Portfolio"
                value={field.key}
                onChange={(e) => updateField(index, 'key', e.target.value)}
              />
            </div>
            <div className="flex-[1.5]">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 block">Value</label>
              <input 
                type="text" 
                className="input-field !py-2 !text-sm" 
                placeholder="Your info..."
                value={field.value}
                onChange={(e) => updateField(index, 'value', e.target.value)}
              />
            </div>
            <button 
              onClick={() => removeField(index)}
              className="p-2 text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button 
        onClick={addField}
        className="flex items-center justify-center gap-2 border border-dashed border-white/10 p-2 rounded-xl text-slate-400 hover:text-white hover:border-indigo-500/50 transition-all font-medium text-xs"
      >
        <Plus size={14} /> Add Another Field
      </button>

      <button 
        className="btn-primary w-full" 
        onClick={saveProfile}
        disabled={saving}
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {saving ? "Saving..." : "Save & Sync details"}
      </button>

      {status === 'success' && (
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm bg-emerald-400/10 px-4 py-2 rounded-xl">
          <CheckCircle size={18} /> Details saved to ChromaDB!
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ManualProfile;
