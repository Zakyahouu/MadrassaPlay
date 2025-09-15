import React, { useState } from 'react';
import axios from 'axios';

const TemplateMetaEditor = ({ template, onClose, onSaved }) => {
  const [form, setForm] = useState({
    displayName: template.displayName || '',
    description: template.description || '',
    tags: (template.tags || []).join(', '),
    category: template.category || '',
    iconUrl: template.iconUrl || '',
    isFeatured: !!template.isFeatured,
    deprecated: !!template.deprecated,
    attemptPolicy: template.manifest?.attemptPolicy || 'first_only',
    xpAssignmentEnabled: template.manifest?.xp?.assignment?.enabled ?? true,
    xpAssignmentAmount: template.manifest?.xp?.assignment?.amount ?? 0,
    xpAssignmentFirstOnly: template.manifest?.xp?.assignment?.firstAttemptOnly ?? true,
    xpOnlineEnabled: template.manifest?.xp?.online?.enabled ?? false,
    xpOnlineAmount: template.manifest?.xp?.online?.amount ?? 0,
    assetsMaxImagesPerCreation: template.manifest?.assets?.maxImagesPerCreation ?? 0,
    limitsMaxCreationsPerTeacher: template.manifest?.limits?.maxCreationsPerTeacher ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const payload = {
        displayName: form.displayName || undefined,
        description: form.description,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        category: form.category || undefined,
        iconUrl: form.iconUrl || undefined,
        isFeatured: form.isFeatured,
        deprecated: form.deprecated,
        attemptPolicy: form.attemptPolicy,
        xp: {
          assignment: {
            enabled: !!form.xpAssignmentEnabled,
            amount: Number(form.xpAssignmentAmount || 0),
            firstAttemptOnly: !!form.xpAssignmentFirstOnly,
          },
          online: {
            enabled: !!form.xpOnlineEnabled,
            amount: Number(form.xpOnlineAmount || 0),
          }
        }
      };
      // Include limits/assets edits (flat -> manifest)
      payload.limitsMaxCreationsPerTeacher = Number(form.limitsMaxCreationsPerTeacher || 0);
      payload.assetsMaxImagesPerCreation = Number(form.assetsMaxImagesPerCreation || 0);

      await axios.patch(`/api/templates/${template._id}/meta`, payload, { headers: { Authorization: `Bearer ${token}` }});
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-[min(92vw,900px)] max-w-3xl rounded-xl shadow-lg relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b sticky top-0 bg-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Edit Template Meta</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
        </div>
        {/* Body (scrollable) */}
        <div className="px-6 py-4 overflow-y-auto">
          {error && <div className="bg-red-50 text-red-700 text-sm p-2 rounded mb-3">{error}</div>}
          <form id="template-meta-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <input className="w-full border rounded px-3 py-2" value={form.displayName} onChange={e=>updateField('displayName', e.target.value)} placeholder="Optional nicer name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea className="w-full border rounded px-3 py-2" rows={3} value={form.description} onChange={e=>updateField('description', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma)</label>
                <input className="w-full border rounded px-3 py-2" value={form.tags} onChange={e=>updateField('tags', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input className="w-full border rounded px-3 py-2" value={form.category} onChange={e=>updateField('category', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Icon URL</label>
              <input className="w-full border rounded px-3 py-2" value={form.iconUrl} onChange={e=>updateField('iconUrl', e.target.value)} />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isFeatured} onChange={e=>updateField('isFeatured', e.target.checked)} /> Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.deprecated} onChange={e=>updateField('deprecated', e.target.checked)} /> Deprecated
              </label>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-semibold">Attempt Policy</h4>
              <select className="w-full border rounded px-3 py-2" value={form.attemptPolicy} onChange={e=>updateField('attemptPolicy', e.target.value)}>
                <option value="first_only">First attempt only</option>
                <option value="all">All attempts counted</option>
              </select>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-semibold">XP (Assignment)</h4>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.xpAssignmentEnabled} onChange={e=>updateField('xpAssignmentEnabled', e.target.checked)} /> Enabled
                </label>
                <input type="number" min="0" className="w-32 border rounded px-3 py-2" value={form.xpAssignmentAmount} onChange={e=>updateField('xpAssignmentAmount', e.target.value)} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.xpAssignmentFirstOnly} onChange={e=>updateField('xpAssignmentFirstOnly', e.target.checked)} /> First attempt only
                </label>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-semibold">XP (Online)</h4>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.xpOnlineEnabled} onChange={e=>updateField('xpOnlineEnabled', e.target.checked)} /> Enabled
                </label>
                <input type="number" min="0" className="w-32 border rounded px-3 py-2" value={form.xpOnlineAmount} onChange={e=>updateField('xpOnlineAmount', e.target.value)} />
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-semibold">Limits</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Max creations per teacher (0 = unlimited)</label>
                  <input type="number" min="0" className="w-full border rounded px-3 py-2" value={form.limitsMaxCreationsPerTeacher} onChange={e=>updateField('limitsMaxCreationsPerTeacher', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Max images per creation (0 = no limit)</label>
                  <input type="number" min="0" className="w-full border rounded px-3 py-2" value={form.assetsMaxImagesPerCreation} onChange={e=>updateField('assetsMaxImagesPerCreation', e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-gray-500">Per-image size is fixed at 10MB.</p>
            </div>

            {/* defaultConfigOverrides removed per request */}
          </form>
        </div>
        {/* Footer */}
        <div className="px-6 py-3 border-t sticky bottom-0 bg-white rounded-b-xl flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded border">Cancel</button>
          <button type="submit" form="template-meta-form" disabled={saving} className="px-5 py-2 text-sm rounded bg-emerald-600 text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
};

export default TemplateMetaEditor;
