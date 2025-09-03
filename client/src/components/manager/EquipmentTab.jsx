import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { 
  Plus, Edit, Trash2, X, Search, Loader, AlertTriangle, 
  Package, Filter, Eye, Users, Wrench, CheckCircle, XCircle, Clock
} from 'lucide-react';

const getUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
const authConfig = () => ({ headers: { Authorization: `Bearer ${getUser()?.token}` } });

// Helper functions for unit states
const getUnitStateStyle = (state) => {
  const styles = {
    'Working Fine': 'bg-green-50 text-green-700 border-green-200',
    'Broken': 'bg-red-50 text-red-700 border-red-200',
    'Under Maintenance': 'bg-yellow-50 text-yellow-700 border-yellow-200'
  };
  return styles[state] || 'bg-gray-50 text-gray-700 border-gray-200';
};

const getStateIcon = (state) => {
  switch (state) {
    case 'Working Fine':
      return <CheckCircle className="w-3 h-3" />;
    case 'Broken':
      return <XCircle className="w-3 h-3" />;
    case 'Under Maintenance':
      return <Wrench className="w-3 h-3" />;
    default:
      return <Clock className="w-3 h-3" />;
  }
};

const EquipmentTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ majorType: '' });
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [equipmentPopup, setEquipmentPopup] = useState({ open: false, item: null });

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.majorType) params.append('majorType', filters.majorType);
      const { data } = await axios.get(`/api/equipment?${params.toString()}`, authConfig());
      const normalized = (data || []).map(it => ({
        ...it,
        units: (it.units || []).map(u => ({ ...u, name: u.name || `#${u.serial}` }))
      }));
      setItems(normalized);
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
      {/* Preset suggestions for major types */}
      <datalist id="equipmentMajorTypePresets">
        <option value="Electronics" />
        <option value="Furniture" />
        <option value="Laboratory" />
        <option value="Audio/Visual" />
        <option value="Sports & Fitness" />
        <option value="IT/Networking" />
      </datalist>

        {/* Enhanced Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="
                  absolute left-4 top-1/2 transform -translate-y-1/2 
                  text-gray-400 w-5 h-5
                " />
                <input
                  type="text"
                  placeholder="Search equipment..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="
                    pl-12 pr-4 py-3 w-full
                    bg-gray-50 border-0 rounded-lg
                    focus:bg-white focus:ring-2 focus:ring-blue-500/20
                    transition-all duration-200
                    placeholder:text-gray-400
                  "
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Filter className="
                  absolute left-3 top-1/2 transform -translate-y-1/2 
                  text-gray-400 w-4 h-4
                " />
                <input 
                  list="equipmentMajorTypePresets" 
                  value={filters.majorType} 
                  onChange={(e) => setFilters(prev => ({ ...prev, majorType: e.target.value }))} 
                  placeholder="Filter by type"
                  className="
                    pl-10 pr-4 py-3
                    bg-gray-50 border-0 rounded-lg
                    focus:bg-white focus:ring-2 focus:ring-blue-500/20
                    transition-all duration-200
                    placeholder:text-gray-400
                    min-w-[200px]
                  "
                />
              </div>
              
              <button
                onClick={() => setModal({ open: true, mode: 'create', data: null })}
                className="
                  flex items-center gap-2 px-5 py-3
                  bg-blue-600 text-white rounded-lg
                  hover:bg-blue-700 hover:shadow-lg
                  transition-all duration-200 font-medium
                "
              >
                <Plus className="w-4 h-4" />
                Add Equipment
          </button>
        </div>
      </div>
      </div>

        {/* Content Area */}
      {loading ? (
          <div className="
            flex flex-col justify-center items-center 
            bg-white rounded-xl p-16 shadow-sm
          ">
            <Loader className="animate-spin text-blue-500 mb-4" size={40} />
            <p className="text-gray-600">Loading equipment...</p>
          </div>
      ) : error ? (
          <div className="
            bg-red-50 border border-red-100 rounded-xl p-6
            flex items-center gap-4
          ">
            <AlertTriangle className="text-red-500 w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800 mb-1">Error</h3>
        <p className="text-red-600">{error}</p>
            </div>
          </div>
      ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {filtered.length > 0 ? (
        <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="
                        px-6 py-4 text-left text-xs font-semibold 
                        text-gray-600 uppercase tracking-wider
                      ">
                        Equipment
                      </th>
                      <th className="
                        px-6 py-4 text-left text-xs font-semibold 
                        text-gray-600 uppercase tracking-wider
                      ">
                        Quantity
                      </th>
                      <th className="
                        px-6 py-4 text-left text-xs font-semibold 
                        text-gray-600 uppercase tracking-wider
                      ">
                        Units
                      </th>
                      <th className="
                        px-6 py-4 text-right text-xs font-semibold 
                        text-gray-600 uppercase tracking-wider
                      ">
                        Actions
                      </th>
              </tr>
            </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map(item => (
                      <tr 
                        key={item._id} 
                        className="
                          hover:bg-gray-50 transition-colors duration-150
                          group
                        "
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="
                              w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 
                              rounded-xl flex items-center justify-center 
                              text-white font-semibold
                            ">
                              <Package className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="
                                font-medium text-gray-900 
                                group-hover:text-green-600 transition-colors
                              ">
                                {item.itemName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.majorType}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {item.quantity} {item.quantity === 1 ? 'unit' : 'units'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(item.units || []).slice(0, 3).map(unit => (
                              <span
                                key={unit.serial}
                                className={`
                                  inline-flex items-center gap-1 px-2 py-1 
                                  text-xs font-medium rounded-full border
                                  ${getUnitStateStyle(unit.state)}
                                `}
                              >
                                #{unit.serial}
                                {getStateIcon(unit.state)}
                              </span>
                            ))}
                            <button
                              onClick={() => setEquipmentPopup({ open: true, item })}
                              className="
                                inline-flex items-center gap-1 px-2 py-1 
                                text-xs font-medium rounded-full
                                bg-blue-50 text-blue-700 border border-blue-200
                                hover:bg-blue-100 transition-colors duration-200
                              "
                            >
                              <Eye className="w-3 h-3" />
                              View units{(item.units || []).length > 3 ? ` (+${(item.units || []).length - 3} more)` : ''}
                            </button>
                    </div>
                  </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <UnitAdjuster item={item} onUpdated={(updated) => {
                              setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
                            }} />
                            <button
                              onClick={() => setModal({ open: true, mode: 'edit', data: item })}
                              className="
                                p-2 text-gray-400 hover:text-green-600 
                                hover:bg-green-50 rounded-lg transition-all duration-200
                                group-hover:bg-green-50
                              "
                              title="Edit equipment"
                            >
                              <Edit className="w-4 h-4" />
                    </button>
                            <button
                              onClick={() => onDelete(item)}
                              className="
                                p-2 text-gray-400 hover:text-red-600 
                                hover:bg-red-50 rounded-lg transition-all duration-200
                                group-hover:bg-red-50
                              "
                              title="Delete equipment"
                            >
                              <Trash2 className="w-4 h-4" />
                    </button>
                          </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
            ) : (
              <div className="
                flex flex-col justify-center items-center 
                p-16 text-center
              ">
                <Package className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No equipment found</h3>
                <p className="text-gray-500 mb-6">
                  {search || filters.majorType ? 'No equipment match your search criteria.' : 'Get started by adding your first equipment.'}
                </p>
                {!search && !filters.majorType && (
                  <button
                    onClick={() => setModal({ open: true, mode: 'create', data: null })}
                    className="
                      flex items-center gap-2 px-4 py-2
                      bg-blue-600 text-white rounded-lg
                      hover:bg-blue-700 transition-colors duration-200
                    "
                  >
                    <Plus className="w-4 h-4" />
                    Add First Equipment
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Equipment Units Popup */}
        {equipmentPopup.open && (
          <EquipmentUnitsPopup 
            item={equipmentPopup.item}
            onClose={() => setEquipmentPopup({ open: false, item: null })}
            onUpdated={(updated) => {
              setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
              setEquipmentPopup(prev => ({ ...prev, item: updated }));
            }}
          />
        )}

        {/* Equipment Modal */}
      {modal.open && (
        <EquipmentModal
          mode={modal.mode}
          data={modal.data}
            onClose={() => setModal({ open: false, mode: 'create', data: null })}
          onSave={onSave}
        />
      )}
      </div>
    </div>
  );
};

// Equipment Units Popup Component
const EquipmentUnitsPopup = ({ item, onClose, onUpdated }) => {
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [nameDrafts, setNameDrafts] = useState({});
  const [stateDrafts, setStateDrafts] = useState({});
  const [notesDrafts, setNotesDrafts] = useState({});

  // Unified edit mode handlers
  
  const beginEdit = (unit) => {
    setEditingUnitId(unit.serial);
    setNameDrafts(prev => ({ ...prev, [unit.serial]: (unit.name ?? `#${unit.serial}`) }));
    setStateDrafts(prev => ({ ...prev, [unit.serial]: unit.state }));
    setNotesDrafts(prev => ({ ...prev, [unit.serial]: unit.notes ?? '' }));
  };
  
  const cancelEdit = (unit) => {
    setEditingUnitId(null);
    setNameDrafts(prev => ({ ...prev, [unit.serial]: unit.name ?? '' }));
    setStateDrafts(prev => ({ ...prev, [unit.serial]: unit.state }));
    setNotesDrafts(prev => ({ ...prev, [unit.serial]: unit.notes ?? '' }));
  };
  
  const saveUnit = async (unit) => {
    try {
      const payload = {
        name: nameDrafts[unit.serial] ?? unit.name ?? '',
        state: stateDrafts[unit.serial] ?? unit.state,
        notes: notesDrafts[unit.serial] ?? unit.notes ?? '',
      };
      const { data } = await axios.patch(
        `/api/equipment/${item._id}/units/${unit.serial}`,
        payload,
        authConfig()
      );
      onUpdated(data);
      setEditingUnitId(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update unit');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-xl font-semibold text-gray-900">{item.itemName}</h4>
              <p className="text-sm text-gray-500">{item.majorType} • {item.quantity} units</p>
            </div>
          </div>
          <button 
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all duration-200" 
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(item.units || []).map(unit => (
              <div 
                key={unit.serial}
                className="
                  p-4 border border-gray-200 rounded-lg 
                  hover:border-gray-300 transition-all duration-200
                "
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mt-1">
                      <div className="text-xs text-gray-500">Name</div>
                      {editingUnitId === unit.serial ? (
                        <input
                          className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm"
                          placeholder={unit.name ?? `#${unit.serial}`}
                          value={nameDrafts[unit.serial] ?? unit.name ?? ''}
                          onChange={(e) => setNameDrafts(prev => ({ ...prev, [unit.serial]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveUnit(unit); } if (e.key === 'Escape') { e.preventDefault(); cancelEdit(unit); } }}
                          onFocus={(e) => e.target.select()}
                          autoFocus
                        />
                      ) : (
                        <div className="text-sm text-gray-700 inline-block px-2 py-1 rounded">
                          {unit.name ? unit.name : `#${unit.serial}`}
                        </div>
                      )}
                    </div>
                  </div>
                  {editingUnitId === unit.serial ? null : (
                    <button
                      onClick={() => beginEdit(unit)}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit unit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className={`
                  px-3 py-2 rounded-lg text-sm font-medium
                  ${getUnitStateStyle(editingUnitId === unit.serial ? (stateDrafts[unit.serial] ?? unit.state) : unit.state)}
                `}>
                  {editingUnitId === unit.serial ? (
                    <select 
                      value={stateDrafts[unit.serial] ?? unit.state}
                      onChange={(e) => setStateDrafts(prev => ({ ...prev, [unit.serial]: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="Working Fine">Working Fine</option>
                      <option value="Broken">Broken</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                    </select>
                  ) : (
                    unit.state
                  )}
                </div>

                <div className="mt-3">
                  <label className="block text-xs text-gray-500">Notes</label>
                  {editingUnitId === unit.serial ? (
                    <div className="mt-1">
                      <textarea
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        rows={3}
                        placeholder="Add notes for this unit"
                        value={notesDrafts[unit.serial] ?? unit.notes ?? ''}
                        onChange={(e) => setNotesDrafts(prev => ({ ...prev, [unit.serial]: e.target.value }))}
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                      {unit.notes && unit.notes.trim() ? unit.notes : <span className="italic text-gray-400">No notes</span>}
                    </div>
                  )}
                </div>

                {editingUnitId === unit.serial && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => saveUnit(unit)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Save changes
                    </button>
                    <button
                      onClick={() => cancelEdit(unit)}
                      className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* legacy state-only editor removed in favor of unified edit mode */}
              </div>
            ))}
          </div>
        </div>
      </div>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg relative shadow-2xl" onClick={e => e.stopPropagation()}>
        <button 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all duration-200" 
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-xl font-semibold text-gray-900">
              {mode === 'edit' ? 'Edit Equipment' : 'Add New Equipment'}
            </h4>
            <p className="text-sm text-gray-500">
              {mode === 'edit' ? 'Update equipment details' : 'Add new equipment to your inventory'}
            </p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Major Type</label>
            <input 
              list="equipmentMajorTypePresets" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200" 
              value={form.majorType} 
              onChange={(e) => setForm({...form, majorType: e.target.value})} 
              required 
              placeholder="e.g., Electronics, Furniture, Laboratory"
            />
            <p className="text-xs text-gray-500 mt-1">Suggestions: Electronics, Furniture, Laboratory, Audio/Visual, Sports & Fitness, IT/Networking</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
            <input 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200" 
              value={form.itemName} 
              onChange={(e) => setForm({...form, itemName: e.target.value})} 
              required 
              placeholder="e.g., Laptop, Desk, Microscope"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="number" 
                min={0} 
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100" 
                value={form.quantity} 
                onChange={(e) => setForm({...form, quantity: Number(e.target.value)})} 
                required 
                disabled={mode === 'edit'}
                placeholder="Enter quantity"
              />
            </div>
            {mode === 'edit' && (
              <p className="text-xs text-gray-500 mt-1">Use the +/- adjuster in the table to change quantity.</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="
                px-4 py-2 border border-gray-300 rounded-lg text-gray-700 
                hover:bg-gray-50 transition-all duration-200 font-medium
              "
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="
                px-4 py-2 bg-green-600 text-white rounded-lg 
                hover:bg-green-700 transition-all duration-200 font-medium
              "
            >
              {mode === 'create' ? 'Add Equipment' : 'Update Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
      <button className="underline" onClick={() => setOpen(o => !o)}>{state}</button>
      {open && (
        <div className="absolute mt-6 bg-white border rounded shadow p-2 z-10">
          <select value={state} onChange={(e) => setState(e.target.value)} className="border rounded p-1 text-sm">
            <option>Working Fine</option>
            <option>Broken</option>
            <option>Under Maintenance</option>
          </select>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setOpen(false)} className="px-2 py-1 border rounded text-xs">Cancel</button>
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
      <button 
        className="px-2 py-1 border rounded text-xs hover:bg-gray-50 transition-colors duration-200" 
        onClick={() => adjust(-Math.abs(delta))}
      >
        - {delta}
      </button>
      <input 
        type="number" 
        min={1} 
        value={delta} 
        onChange={(e) => setDelta(Math.max(1, Number(e.target.value)))} 
        className="w-16 p-1 border rounded text-xs" 
      />
      <button 
        className="px-2 py-1 border rounded text-xs hover:bg-gray-50 transition-colors duration-200" 
        onClick={() => adjust(Math.abs(delta))}
      >
        + {delta}
      </button>
    </span>
  );
};

export default EquipmentTab;
