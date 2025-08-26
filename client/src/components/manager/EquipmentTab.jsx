import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X } from 'lucide-react';

const getUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
const authConfig = () => ({ headers: { Authorization: `Bearer ${getUser()?.token}` } });

const EquipmentTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ majorType: '' });
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.majorType) params.append('majorType', filters.majorType);
  // state filter removed
      const { data } = await axios.get(`/api/equipment?${params.toString()}`, authConfig());
      setItems(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch equipment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [filters.majorType]);

  const filtered = useMemo(() => {
    return items.filter(x => `${x.majorType} ${x.itemName}`.toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  const onSave = async (form) => {
    try {
      if (modal.mode === 'edit') {
        const { data } = await axios.put(`/api/equipment/${modal.data._id}`, form, authConfig());
        setItems(prev => prev.map(i => i._id === data._id ? data : i));
      } else {
        const { data } = await axios.post('/api/equipment', form, authConfig());
        setItems(prev => [...prev, data]);
      }
      setModal({ open: false, mode: 'create', data: null });
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    }
  };

  const onDelete = async (item) => {
    if (!confirm(`Delete equipment "${item.itemName}"?`)) return;
    try {
      await axios.delete(`/api/equipment/${item._id}`, authConfig());
      setItems(prev => prev.filter(i => i._id !== item._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Preset suggestions for major types */}
      <datalist id="equipmentMajorTypePresets">
        <option value="Electronics" />
        <option value="Furniture" />
        <option value="Laboratory" />
        <option value="Audio/Visual" />
        <option value="Sports & Fitness" />
        <option value="IT/Networking" />
      </datalist>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Equipment</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setModal({ open: true, mode: 'create', data: null })}
          className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Add Equipment
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search equipment..."
          className="w-full md:w-64 p-2 border border-gray-300 rounded-md" />
        <input list="equipmentMajorTypePresets" value={filters.majorType} onChange={(e)=>setFilters(prev=>({...prev, majorType:e.target.value}))} placeholder="Filter by major type"
          className="w-full md:w-48 p-2 border border-gray-300 rounded-md" />
  {/* State filter removed */}
      </div>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">No equipment found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2 pr-4">Major Type</th>
                <th className="py-2 pr-4">Item Name</th>
                <th className="py-2 pr-4">Quantity</th>
                <th className="py-2 pr-4">Units</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i._id} className="border-b">
                  <td className="py-2 pr-4">{i.majorType}</td>
                  <td className="py-2 pr-4">{i.itemName}</td>
                  <td className="py-2 pr-4">{i.quantity}</td>
                  <td className="py-2 pr-4">
                    <div className="flex flex-wrap gap-2">
                      {(i.units||[]).map(u => (
                        <UnitBadge key={u.serial} itemId={i._id} unit={u} onUpdated={(updated)=>{
                          setItems(prev => prev.map(p => p._id === updated._id ? updated : p));
                        }} />
                      ))}
                    </div>
                  </td>
                  <td className="py-2 pr-4">
                    <UnitAdjuster item={i} onUpdated={(updated)=>{
                      setItems(prev => prev.map(p => p._id === updated._id ? updated : p));
                    }} />
                    <button className="text-indigo-600 hover:underline mx-3" onClick={()=>setModal({ open:true, mode:'edit', data:i })}>
                      <Edit className="inline w-4 h-4" /> Edit
                    </button>
                    <button className="text-red-600 hover:underline" onClick={()=>onDelete(i)}>
                      <Trash2 className="inline w-4 h-4" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <EquipmentModal
          mode={modal.mode}
          data={modal.data}
          onClose={()=>setModal({ open:false, mode:'create', data:null })}
          onSave={onSave}
        />
      )}
    </div>
  );
};

const EquipmentModal = ({ mode, data, onClose, onSave }) => {
  const [form, setForm] = useState({
    majorType: data?.majorType || '',
    itemName: data?.itemName || '',
    quantity: data?.quantity ?? 0,
  });

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg relative" onClick={e=>e.stopPropagation()}>
        <button className="absolute top-3 right-3 text-gray-500" onClick={onClose}><X/></button>
        <h4 className="text-lg font-semibold mb-4">{mode==='edit'?'Edit Equipment':'Add Equipment'}</h4>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Major Type</label>
            <input list="equipmentMajorTypePresets" className="w-full p-2 border rounded" value={form.majorType} onChange={(e)=>setForm({...form, majorType:e.target.value})} required />
            <p className="text-xs text-gray-500 mt-1">Suggestions: Electronics, Furniture, Laboratory, Audio/Visual, Sports & Fitness, IT/Networking</p>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Item Name</label>
            <input className="w-full p-2 border rounded" value={form.itemName} onChange={(e)=>setForm({...form, itemName:e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Quantity</label>
            <input type="number" min={0} className="w-full p-2 border rounded disabled:bg-gray-100" value={form.quantity} onChange={(e)=>setForm({...form, quantity: Number(e.target.value)})} required disabled={mode==='edit'} />
            {mode==='edit' && (
              <p className="text-xs text-gray-500 mt-1">Use the +/- adjuster in the table to change quantity.</p>
            )}
          </div>
          {/* No global state on creation; state is per-unit */}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 border rounded">Cancel</button>
            <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EquipmentTab;

// Inline components
const stateColors = {
  'Working Fine': 'bg-green-100 text-green-700 border-green-200',
  'Broken': 'bg-red-100 text-red-700 border-red-200',
  'Under Maintenance': 'bg-yellow-100 text-yellow-700 border-yellow-200'
};

const UnitBadge = ({ itemId, unit, onUpdated }) => {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState(unit.state);
  const save = async () => {
    try {
      const { data } = await axios.patch(`/api/equipment/${itemId}/units/${unit.serial}/state`, { state }, authConfig());
      onUpdated(data);
      setOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update unit state');
    }
  };
  return (
    <div className={`relative inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${stateColors[state] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      <span>#{unit.serial}</span>
      <button className="underline" onClick={()=>setOpen(o=>!o)}>{state}</button>
      {open && (
        <div className="absolute mt-6 bg-white border rounded shadow p-2 z-10">
          <select value={state} onChange={(e)=>setState(e.target.value)} className="border rounded p-1 text-sm">
            <option>Working Fine</option>
            <option>Broken</option>
            <option>Under Maintenance</option>
          </select>
          <div className="flex gap-2 mt-2">
            <button onClick={()=>setOpen(false)} className="px-2 py-1 border rounded text-xs">Cancel</button>
            <button onClick={save} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs">Save</button>
          </div>
        </div>
      )}
    </div>
  );
};

const UnitAdjuster = ({ item, onUpdated }) => {
  const [delta, setDelta] = useState(1);
  const adjust = async (d) => {
    try {
      const { data } = await axios.post(`/api/equipment/${item._id}/units`, { delta: d }, authConfig());
      onUpdated(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to adjust units');
    }
  };
  return (
    <span className="inline-flex items-center gap-2">
      <button className="px-2 py-1 border rounded text-xs" onClick={()=>adjust(-Math.abs(delta))}>- {delta}</button>
      <input type="number" min={1} value={delta} onChange={(e)=>setDelta(Math.max(1, Number(e.target.value)))} className="w-16 p-1 border rounded text-xs" />
      <button className="px-2 py-1 border rounded text-xs" onClick={()=>adjust(Math.abs(delta))}>+ {delta}</button>
    </span>
  );
};
