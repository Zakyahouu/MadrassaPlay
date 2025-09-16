import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

// Admin Template Badge Manager
// Features:
// - Select a template (list fetched from /api/templates)
// - If a badge exists for the template, load & edit; otherwise create new
// - Manage variants (label, thresholdPercent, iconUrl)
// - Choose evaluationMode (highestAttempt | firstAttempt)
// - Persist via POST (create/replace) or PUT (update existing)

const emptyVariant = () => ({ label: '', thresholdPercent: 0, iconUrl: '' });

// helper to add auth header
const authHeaders = () => {
  try {
    const token = JSON.parse(localStorage.getItem('user'))?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

export default function BadgeManager() {
  // Data collections
  const [templates, setTemplates] = useState([]);
  const [allBadges, setAllBadges] = useState([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Editing / creation fields
  const [editingBadgeId, setEditingBadgeId] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [evaluationMode, setEvaluationMode] = useState('highestAttempt');
  const [variants, setVariants] = useState([emptyVariant()]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [deletingBadge, setDeletingBadge] = useState(false);
  const [message, setMessage] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch templates once
  useEffect(() => {
    (async () => {
      try {
  const res = await axios.get('/api/templates', { headers: authHeaders() });
        setTemplates(res.data || []);
      } catch (_) { /* ignore */ }
    })();
  }, []);

  // Fetch all badges for summary list
  const loadAllBadges = async () => {
    try {
  const res = await axios.get('/api/template-badges', { headers: authHeaders() });
      setAllBadges(res.data || []);
    } catch (_) { /* ignore */ }
  };

  useEffect(() => { loadAllBadges(); }, []);

  // Load an individual badge by template id when editing
  const loadBadgeForTemplate = async (templateId) => {
    if (!templateId) return;
    setLoading(true);
    setMessage(null);
    try {
  const res = await axios.get('/api/template-badges', { params: { template: templateId }, headers: authHeaders() });
      const list = res.data || [];
      if (list.length) {
        const b = list[0];
        setEditingBadgeId(b._id);
        setIsEditing(true);
        setSelectedTemplateId(templateId);
        setName(b.name || '');
        setDescription(b.description || '');
        setEvaluationMode(b.evaluationMode || 'highestAttempt');
        setVariants(b.variants?.map(v => ({ label: v.label, thresholdPercent: v.thresholdPercent, iconUrl: v.iconUrl || '' })) || [emptyVariant()]);
        setIsModalOpen(true);
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to load badge info' });
    } finally {
      setLoading(false);
    }
  };

  const updateVariant = (idx, field, value) => {
    setVariants(vs => vs.map((v, i) => i === idx ? { ...v, [field]: field === 'thresholdPercent' ? Number(value) : value } : v));
  };
  const addVariant = () => setVariants(vs => [...vs, emptyVariant()]);
  const removeVariant = (idx) => setVariants(vs => vs.filter((_, i) => i !== idx));

  const uploadIcon = async (file, idx) => {
    if (!file) return;
    const form = new FormData();
    form.append('icon', file);
    try {
  const res = await axios.post('/api/template-badges/icon/upload', form, { headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' } });
      updateVariant(idx, 'iconUrl', res.data.url);
    } catch (e) {
      setMessage({ type: 'error', text: 'Icon upload failed' });
    }
  };

  const sortedVariants = [...variants].sort((a, b) => b.thresholdPercent - a.thresholdPercent);

  const validate = () => {
    if (!selectedTemplateId) return 'Select a template';
    if (!name.trim()) return 'Name required';
    if (!variants.length) return 'At least one variant required';
    const labels = new Set();
    const thresholds = new Set();
    for (const v of variants) {
      if (!v.label.trim()) return 'Variant label required';
      if (v.thresholdPercent < 0 || v.thresholdPercent > 100) return 'Threshold must be 0-100';
      if (labels.has(v.label.trim())) return 'Duplicate variant label';
      if (thresholds.has(v.thresholdPercent)) return 'Duplicate variant threshold';
      labels.add(v.label.trim());
      thresholds.add(v.thresholdPercent);
    }
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) { setMessage({ type: 'error', text: err }); return; }
    setSaving(true);
    setMessage(null);
    try {
      const payload = { template: selectedTemplateId, name, description, evaluationMode, variants: sortedVariants };
      if (isEditing && editingBadgeId) {
        await axios.put(`/api/template-badges/${editingBadgeId}`, payload, { headers: authHeaders() });
        setMessage({ type: 'success', text: 'Badge updated.' });
      } else {
        const res = await axios.post('/api/template-badges', payload, { headers: authHeaders() });
        setEditingBadgeId(res.data._id);
        setIsEditing(true);
        setMessage({ type: 'success', text: 'Badge created.' });
      }
      await loadAllBadges();
      // Close modal after short delay so user sees success
      setTimeout(()=>{ setIsModalOpen(false); }, 600);
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const recalc = async () => {
    if (!editingBadgeId) return;
    setRecalculating(true);
    setMessage(null);
    try {
  const res = await axios.post(`/api/template-badges/${editingBadgeId}/recalculate`, null, { headers: authHeaders() });
      setMessage({ type: 'success', text: `Recalculated: ${res.data.updated} users updated.` });
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.message || 'Recalc failed.' });
    } finally {
      setRecalculating(false);
    }
  };

  const deleteBadgeSystem = async () => {
    if (!isEditing || !selectedTemplateId) return;
    if (!confirm('Delete the entire badge system for this template? This removes the definition and all earned records.')) return;
    setDeletingBadge(true);
    setMessage(null);
    try {
  await axios.delete(`/api/template-badges/template/${selectedTemplateId}`, { headers: authHeaders() });
      setMessage({ type: 'success', text: 'Badge system deleted.' });
      await loadAllBadges();
      // Close modal after a short delay
      setTimeout(()=>{ setIsModalOpen(false); }, 600);
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.message || 'Delete failed.' });
    } finally {
      setDeletingBadge(false);
    }
  };

  // Preset & smart assistance logic
  const presets = {
    '3 Tier Classic': [
      { label: 'Gold', thresholdPercent: 90 },
      { label: 'Silver', thresholdPercent: 70 },
      { label: 'Bronze', thresholdPercent: 50 }
    ],
    '4 Tier Extended': [
      { label: 'Diamond', thresholdPercent: 95 },
      { label: 'Gold', thresholdPercent: 85 },
      { label: 'Silver', thresholdPercent: 70 },
      { label: 'Bronze', thresholdPercent: 55 }
    ],
    '5 Tier Grades': [
      { label: 'S', thresholdPercent: 95 },
      { label: 'A', thresholdPercent: 85 },
      { label: 'B', thresholdPercent: 75 },
      { label: 'C', thresholdPercent: 65 },
      { label: 'D', thresholdPercent: 50 }
    ]
  };

  const applyPreset = (key) => {
    const preset = presets[key];
    if (!preset) return;
    setVariants(preset.map(v => ({ ...v, iconUrl: '' })));
  };

  const autoDistribute = () => {
    if (!variants.length) return;
    const n = variants.length;
    const top = 90; // top threshold target
    const bottom = 50; // bottom threshold target
    const step = n > 1 ? (top - bottom) / (n - 1) : 0;
    const newVariants = [...variants]
      .sort((a,b)=> (b.thresholdPercent||0)-(a.thresholdPercent||0))
      .map((v,i) => ({ ...v, thresholdPercent: Math.round(top - step * i) }));
    setVariants(newVariants);
  };

  // Warnings for UX guidance
  const variantWarnings = useMemo(() => {
    const warns = [];
    const sorted = [...variants].sort((a,b)=>b.thresholdPercent-a.thresholdPercent);
    for (let i=0;i<sorted.length-1;i++) {
      const gap = sorted[i].thresholdPercent - sorted[i+1].thresholdPercent;
      if (gap < 5) warns.push(`Gap between ${sorted[i].label||'Tier '+(i+1)} and ${sorted[i+1].label||'Tier '+(i+2)} is only ${gap}%. Consider larger separation.`);
    }
    if (sorted[0] && sorted[0].thresholdPercent < 80) warns.push('Top tier below 80% might be too easy.');
    if (sorted[sorted.length-1] && sorted[sorted.length-1].thresholdPercent > 60) warns.push('Lowest tier >60% might exclude many learners.');
    return warns;
  }, [variants]);

  return (
    <div className="p-6 bg-white rounded-xl border space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Template Badges</h2>
          <p className="text-gray-600 text-sm">Create and manage per-template tiered badges.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => {
            // prepare create modal
            setIsEditing(false);
            setEditingBadgeId(null);
            setSelectedTemplateId('');
            setName('');
            setDescription('');
            setEvaluationMode('highestAttempt');
            setVariants([emptyVariant()]);
            setMessage(null);
            setIsModalOpen(true);
          }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow hover:bg-indigo-700">Add Badge</button>
          <button type="button" onClick={loadAllBadges} className="px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">Refresh</button>
        </div>
      </div>

      {/* Badges Grid */}
      <div>
        {allBadges.length === 0 && (
          <div className="p-6 border border-dashed rounded-lg text-center text-sm text-gray-500">No badges yet. Click "Add Badge" to create one.</div>
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {allBadges.map(b => {
            const template = templates.find(t => t._id === (b.template?._id || b.template));
            return (
              <div key={b._id} onClick={()=>loadBadgeForTemplate(b.template?._id || b.template)} className="group p-4 rounded-xl border bg-gradient-to-br from-white to-gray-50 hover:shadow-sm hover:border-indigo-400 transition cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm truncate">{b.name}</h4>
                    <p className="text-[11px] text-gray-500 truncate">{template?.name || 'Unknown Template'}</p>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded bg-indigo-100 text-indigo-700 font-medium uppercase tracking-wide">{b.evaluationMode}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  {b.variants?.map(v => (
                    <span key={v.label} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-600/10 text-indigo-700 border border-indigo-300">
                      {v.iconUrl ? <img src={v.iconUrl} alt={v.label} className="h-3.5 w-3.5 object-contain" /> : null}
                      <span>{v.label}</span>
                      <span>{v.thresholdPercent}%</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{message.text}</div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl relative animate-fadeIn border">
            <div className="flex items-start justify-between p-5 border-b">
              <div>
                <h3 className="text-lg font-semibold">{isEditing ? 'Edit Badge' : 'Create Badge'}</h3>
                <p className="text-xs text-gray-500 mt-1">{isEditing ? 'Modify tiers, icon & settings.' : 'Define tiers for a template that has no badge yet.'}</p>
              </div>
              <button onClick={()=>setIsModalOpen(false)} className="p-2 text-gray-500 hover:text-gray-700" aria-label="Close">✕</button>
            </div>
            <div className="p-5 space-y-6">
              {message && (
                <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{message.text}</div>
              )}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Template</label>
                  {isEditing ? (
                    <div className="px-3 py-2 border rounded bg-gray-50 text-sm">
                      {templates.find(t => t._id === selectedTemplateId)?.name || '—'}
                    </div>
                  ) : (
                    <select value={selectedTemplateId} onChange={(e)=>setSelectedTemplateId(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
                      <option value="">Select Template…</option>
                      {templates.filter(t => !allBadges.some(b => (b.template?._id || b.template) === t._id)).map(t => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Badge Name</label>
                  <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="e.g. Math Master" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Evaluation Mode</label>
                  <select value={evaluationMode} onChange={(e)=>setEvaluationMode(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="highestAttempt">Highest Attempt</option>
                    <option value="firstAttempt">First Attempt</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={2} className="w-full border rounded px-3 py-2 text-sm" placeholder="Short description..." />
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-700">Variants</span>
                  <div className="flex items-center gap-2 text-xs">
                    {Object.keys(presets).map(p => (
                      <button key={p} type="button" onClick={()=>applyPreset(p)} className="px-2 py-1 border rounded bg-white hover:bg-gray-50">{p}</button>
                    ))}
                    <button type="button" onClick={autoDistribute} className="px-2 py-1 border rounded bg-white hover:bg-gray-50">Auto Distribute</button>
                    <button type="button" onClick={addVariant} className="px-2 py-1 border rounded bg-white hover:bg-gray-50">Add Variant</button>
                    <button type="button" onClick={()=>setShowAdvanced(s=>!s)} className="px-2 py-1 border rounded bg-white hover:bg-gray-50">{showAdvanced ? 'Hide' : 'Show'} Tips</button>
                  </div>
                </div>
                {showAdvanced && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-[11px] leading-relaxed space-y-1">
                    <p><strong>Tips:</strong> 3–5 tiers recommended. Gaps ≥5%. Top tier ~90–95%. Lowest tier 50–60% for accessibility.</p>
                    {variantWarnings.length > 0 && (
                      <ul className="list-disc ml-5 space-y-0.5">
                        {variantWarnings.map((w,i)=>(<li key={i} className="text-red-600">{w}</li>))}
                      </ul>
                    )}
                  </div>
                )}
                <div className="space-y-3">
                  {variants.map((v, idx) => (
                    <div key={idx} className="grid md:grid-cols-12 gap-3 p-3 border rounded-lg bg-gray-50">
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-medium text-gray-600 mb-1">Label</label>
                        <input value={v.label} onChange={(e)=>updateVariant(idx,'label', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Gold" />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-medium text-gray-600 mb-1">Threshold %</label>
                        <input type="number" min={0} max={100} value={v.thresholdPercent} onChange={(e)=>updateVariant(idx,'thresholdPercent', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
                      </div>
                      <div className="md:col-span-5 space-y-1">
                        <label className="block text-[10px] font-medium text-gray-600">Icon</label>
                        <div className="flex items-center gap-2">
                          <input value={v.iconUrl} onChange={(e)=>updateVariant(idx,'iconUrl', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="https://..." />
                          <label className="text-xs px-2 py-1 border rounded cursor-pointer bg-white hover:bg-gray-100">
                            Upload
                            <input type="file" accept="image/*" className="hidden" onChange={(e)=>uploadIcon(e.target.files?.[0], idx)} />
                          </label>
                        </div>
                        {v.iconUrl ? (
                          <img src={v.iconUrl} alt="icon" className="h-8 w-8 object-contain" />
                        ) : (
                          <div className="h-8 w-8 border rounded bg-white text-[10px] text-gray-400 flex items-center justify-center">No Icon</div>
                        )}
                      </div>
                      <div className="md:col-span-1 flex items-end">
                        <button type="button" onClick={()=>removeVariant(idx)} disabled={variants.length===1} className="text-xs px-2 py-1 border rounded w-full disabled:opacity-40">X</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-gray-500">Variants are auto-sorted by threshold descending when saving.</div>
              </div>
            </div>
            <div className="px-5 py-4 border-t flex flex-wrap items-center gap-3 justify-between bg-gray-50 rounded-b-xl">
              <div className="flex items-center gap-2">
                {isEditing && (
                  <>
                    <button type="button" disabled={recalculating} onClick={recalc} className="px-3 py-2 bg-amber-500 text-white rounded-md text-sm disabled:opacity-50">{recalculating ? 'Recalculating…' : 'Recalculate Awards'}</button>
                    <button type="button" disabled={deletingBadge} onClick={deleteBadgeSystem} className="px-3 py-2 bg-red-600 text-white rounded-md text-sm disabled:opacity-50">{deletingBadge ? 'Deleting…' : 'Delete Badge System'}</button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button type="button" onClick={()=>setIsModalOpen(false)} className="px-4 py-2 border rounded-md text-sm bg-white hover:bg-gray-100">Cancel</button>
                <button disabled={saving || (!selectedTemplateId && !isEditing)} onClick={save} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold disabled:opacity-50">{saving ? 'Saving…' : (isEditing ? 'Save Changes' : 'Create Badge')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
