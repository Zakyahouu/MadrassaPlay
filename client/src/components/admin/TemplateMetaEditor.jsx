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
    defaultConfigOverrides: template.defaultConfigOverrides ? JSON.stringify(template.defaultConfigOverrides, null, 2) : ''
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
      };
      if (form.defaultConfigOverrides.trim()) {
        try {
          payload.defaultConfigOverrides = JSON.parse(form.defaultConfigOverrides);
        } catch (err) {
          setError('Invalid JSON in defaultConfigOverrides');
          setSaving(false);
          return;
        }
      }
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
      <div className="bg-white w-full max-w-xl rounded-xl shadow-lg p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">✕</button>
        <h3 className="text-xl font-semibold mb-4">Edit Template Meta</h3>
        {error && <div className="bg-red-50 text-red-700 text-sm p-2 rounded mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input className="w-full border rounded px-3 py-2" value={form.displayName} onChange={e=>updateField('displayName', e.target.value)} placeholder="Optional nicer name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="w-full border rounded px-3 py-2" rows={3} value={form.description} onChange={e=>updateField('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isFeatured} onChange={e=>updateField('isFeatured', e.target.checked)} /> Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.deprecated} onChange={e=>updateField('deprecated', e.target.checked)} /> Deprecated
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default Config Overrides (JSON)</label>
            <textarea
              className="w-full border rounded px-3 py-2 font-mono text-xs"
              rows={5}
              value={form.defaultConfigOverrides}
              onChange={e=>updateField('defaultConfigOverrides', e.target.value)}
              placeholder={'{\n  "timeLimit": 60\n}'}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded border">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm rounded bg-emerald-600 text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateMetaEditor;
