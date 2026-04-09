import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Plus, Edit, Trash2, X, Search, Loader, AlertTriangle,
  Package, Filter, Eye, Users, Wrench, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

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
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ majorType: '' });
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [equipmentPopup, setEquipmentPopup] = useState({ open: false, item: null });
  const [manageUnits, setManageUnits] = useState({ open: false, item: null });

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
      setError(err.response?.data?.message || t.failedLoadData);
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
      alert(err.response?.data?.message || t.errorOccurred);
    }
  };

  const onDelete = async (item) => {
    if (!confirm(`Delete equipment "${item.itemName}"?`)) return;
    try {
      await axios.delete(`/api/equipment/${item._id}`, authConfig());
      setItems(prev => prev.filter(i => i._id !== item._id));
    } catch (err) {
      alert(err.response?.data?.message || t.errorOccurred);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Preset suggestions for major types */}
        <datalist id="equipmentMajorTypePresets">
          <option value={t.electronics} />
          <option value={t.furniture} />
          <option value={t.laboratory} />
          <option value={t.audioVisual} />
          <option value={t.sportsFitness} />
          <option value={t.itNetworking} />
        </datalist>

        {/* Enhanced Header */}
        <div className="card-base p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="
                  absolute left-4 top-1/2 transform -translate-y-1/2 
                  text-text-muted-light w-5 h-5
                " />
                <input
                  type="text"
                  placeholder={t.searchEquipment}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="
                    pl-12 pr-4 py-3 w-full
                    bg-background-light border-0 rounded-lg
                    focus:bg-white focus:ring-2 focus:ring-primary/20
                    transition-all duration-200
                    placeholder:text-text-muted-light
                  "
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Filter className="
                  absolute left-3 top-1/2 transform -translate-y-1/2 
                  text-text-muted-light w-4 h-4
                " />
                <input
                  list="equipmentMajorTypePresets"
                  value={filters.majorType}
                  onChange={(e) => setFilters(prev => ({ ...prev, majorType: e.target.value }))}
                  placeholder={t.filterByType}
                  className="
                    pl-10 pr-4 py-3
                    bg-background-light border-0 rounded-lg
                    focus:bg-white focus:ring-2 focus:ring-primary/20
                    transition-all duration-200
                    placeholder:text-text-muted-light
                    min-w-[200px]
                  "
                />
              </div>

              <button
                onClick={() => setModal({ open: true, mode: 'create', data: null })}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t.addEquipment}
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
            <p className="text-gray-600">{t.loading}</p>
          </div>
        ) : error ? (
          <div className="
            bg-red-50 border border-red-100 rounded-xl p-6
            flex items-center gap-4
          ">
            <AlertTriangle className="text-red-500 w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800 mb-1">{t.error}</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        ) : (
          <div className="card-base overflow-hidden">
            {filtered.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 border-b border-border-light">
                    <tr>
                      <th className="
                        px-6 py-4 text-left text-xs font-semibold 
                        text-text-muted-light uppercase tracking-wider
                      ">{t.equipment}</th>
                      <th className="
                        px-6 py-4 text-left text-xs font-semibold 
                        text-text-muted-light uppercase tracking-wider
                      ">{t.quantity}</th>
                      <th className="
                        px-6 py-4 text-left text-xs font-semibold 
                        text-text-muted-light uppercase tracking-wider
                      ">
                        {t.unitsCount.charAt(0).toUpperCase() + t.unitsCount.slice(1)}
                      </th>
                      <th className="
                        px-6 py-4 text-right text-xs font-semibold 
                        text-text-muted-light uppercase tracking-wider
                      ">{t.actions}</th>
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
                              w-10 h-10 bg-primary/10
                              rounded-xl flex items-center justify-center 
                              text-primary font-semibold
                            ">
                              <Package className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="
                                font-medium text-text-main-light 
                                group-hover:text-primary transition-colors
                              ">
                                {item.itemName}
                              </div>
                              <div className="text-sm text-text-muted-light">
                                {item.majorType}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {item.quantity} {item.quantity === 1 ? t.unitCount : t.unitsCount}
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
                                bg-primary/10 text-primary border border-primary/20
                                hover:bg-primary/20 transition-colors duration-200
                              "
                            >
                              <Eye className="w-3 h-3" />
                              {t.viewUnitsAction}{(item.units || []).length > 3 ? ` (${t.plusMore.replace('{count}', (item.units || []).length - 3)})` : ''}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setManageUnits({ open: true, item })}
                              className="
                                p-2 text-gray-400 hover:text-blue-600
                                hover:bg-blue-50 rounded-lg transition-all duration-200
                                group-hover:bg-blue-50
                              "
                              title={t.manageUnits}
                            >
                              <Wrench className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setModal({ open: true, mode: 'edit', data: item })}
                              className="
                                p-2 text-gray-400 hover:text-green-600 
                                hover:bg-green-50 rounded-lg transition-all duration-200
                                group-hover:bg-green-50
                              "
                              title={t.editEquipment}
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
                              title={t.deleteEquipment}
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t.noEquipmentFound}</h3>
                <p className="text-gray-500 mb-6">
                  {search || filters.majorType ? t.noEquipmentMatchSearch : t.getStartedCreateFirstEquipment}
                </p>
                {!search && !filters.majorType && (
                  <button
                    onClick={() => setModal({ open: true, mode: 'create', data: null })}
                    className="btn-primary mt-4"
                  >
                    <Plus className="w-4 h-4" />
                    {t.addFirstEquipment}
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

        {manageUnits.open && (
          <ManageUnitsDialog
            item={manageUnits.item}
            onClose={() => setManageUnits({ open: false, item: null })}
            onUpdated={(updated) => {
              setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
              setEquipmentPopup(prev => (prev.item?._id === updated._id ? { ...prev, item: updated } : prev));
              setManageUnits({ open: false, item: null });
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
  const { t } = useLanguage();
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
      alert(err.response?.data?.message || t.failUpdateUnit);
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
              <p className="text-sm text-gray-500">{item.majorType} • {item.quantity} {item.quantity === 1 ? t.unitCount : t.unitsCount}</p>
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
                      <div className="text-xs text-gray-500">{t.name}</div>
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
                      title={t.editRoom.replace(t.rooms, t.unitCount)}
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
                      <option value="Working Fine">{t.workingFine}</option>
                      <option value="Broken">{t.broken}</option>
                      <option value="Under Maintenance">{t.underMaintenance}</option>
                    </select>
                  ) : (
                    unit.state === 'Working Fine' ? t.workingFine :
                      unit.state === 'Broken' ? t.broken :
                        unit.state === 'Under Maintenance' ? t.underMaintenance : unit.state
                  )}
                </div>

                <div className="mt-3">
                  <label className="block text-xs text-gray-500">{t.notes}</label>
                  {editingUnitId === unit.serial ? (
                    <div className="mt-1">
                      <textarea
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        rows={3}
                        placeholder={t.addNotePayout.replace(t.payment, t.unitCount)}
                        value={notesDrafts[unit.serial] ?? unit.notes ?? ''}
                        onChange={(e) => setNotesDrafts(prev => ({ ...prev, [unit.serial]: e.target.value }))}
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                      {unit.notes && unit.notes.trim() ? unit.notes : <span className="italic text-gray-400">{t.noNotes}</span>}
                    </div>
                  )}
                </div>

                {editingUnitId === unit.serial && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => saveUnit(unit)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      {t.saveChanges}
                    </button>
                    <button
                      onClick={() => cancelEdit(unit)}
                      className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm"
                    >{t.cancel}</button>
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
  const { t } = useLanguage();
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
              {mode === 'edit' ? t.editEquipment : t.addEquipment}
            </h4>
            <p className="text-sm text-gray-500">
              {mode === 'edit' ? t.updateEquipmentDetails : t.addNewEquipmentInventory}
            </p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.majorType}</label>
            <input
              list="equipmentMajorTypePresets"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              value={form.majorType}
              onChange={(e) => setForm({ ...form, majorType: e.target.value })}
              required
              placeholder={t.majorTypeExample}
            />
            <p className="text-xs text-gray-500 mt-1">{t.suggested}: {t.electronics}, {t.furniture}, {t.laboratory}, {t.audioVisual}, {t.sportsFitness}, {t.itNetworking}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.itemName}</label>
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              value={form.itemName}
              onChange={(e) => setForm({ ...form, itemName: e.target.value })}
              required
              placeholder={t.itemNameExample}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.quantity}</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                min={0}
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                required
                disabled={mode === 'edit'}
                placeholder={t.enterQuantity}
              />
            </div>
            {mode === 'edit' && (
              <p className="text-xs text-gray-500 mt-1">{t.useAdjusterHint}</p>
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
            >{t.cancel}</button>
            <button
              type="submit"
              className="
                px-4 py-2 bg-green-600 text-white rounded-lg 
                hover:bg-green-700 transition-all duration-200 font-medium
              "
            >
              {mode === 'create' ? t.addEquipment : t.updateEquipment}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ManageUnitsDialog = ({ item, onClose, onUpdated }) => {
  const { t } = useLanguage();
  const [addCount, setAddCount] = useState(0);
  const [selectedSerials, setSelectedSerials] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const units = item?.units || [];

  const toggleSerial = (serial) => {
    setSelectedSerials(prev => (
      prev.includes(serial) ? prev.filter(s => s !== serial) : [...prev, serial]
    ));
  };

  const applyChanges = async () => {
    const removeSerials = selectedSerials;
    if (addCount <= 0 && removeSerials.length === 0) return;
    if (removeSerials.length > 0) {
      const message = t.confirmRemoveUnits.replace('{count}', removeSerials.length);
      if (!confirm(message)) return;
    }
    const payload = {};
    if (addCount > 0) payload.addCount = addCount;
    if (removeSerials.length > 0) payload.removeSerials = removeSerials;

    setSubmitting(true);
    try {
      const { data } = await axios.post(`/api/equipment/${item._id}/units/manage`, payload, authConfig());
      onUpdated(data);
    } catch (err) {
      alert(err.response?.data?.message || t.failAdjustUnits);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedLabel = `${selectedSerials.length} ${selectedSerials.length === 1 ? t.unitCount : t.unitsCount}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-3xl relative shadow-2xl" onClick={e => e.stopPropagation()}>
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all duration-200"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-xl font-semibold text-gray-900">{t.manageUnits}</h4>
            <p className="text-sm text-gray-500">{t.manageUnitsHint}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">{t.unitsToAdd}</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                min={0}
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                value={addCount}
                onChange={(e) => setAddCount(Math.max(0, Number(e.target.value)))}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.unitsToRemove}</label>
                <p className="text-xs text-gray-500">{t.selectUnitsToRemove}</p>
              </div>
              <span className="text-xs text-gray-500">{selectedLabel}</span>
            </div>
            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              {units.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">{t.noUnitsAvailable}</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {units.map(unit => (
                    <li key={unit.serial} className="flex items-center gap-3 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedSerials.includes(unit.serial)}
                        onChange={() => toggleSerial(unit.serial)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {unit.name ? unit.name : `#${unit.serial}`}
                        </div>
                        <div className="text-xs text-gray-500">#{unit.serial}</div>
                      </div>
                      <span className={`
                        inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border
                        ${getUnitStateStyle(unit.state)}
                      `}>
                        {unit.state === 'Working Fine' ? t.workingFine : unit.state === 'Broken' ? t.broken : unit.state === 'Under Maintenance' ? t.underMaintenance : unit.state}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={applyChanges}
            disabled={submitting || (addCount <= 0 && selectedSerials.length === 0)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? t.processing : t.applyUnitsChanges}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentTab;
