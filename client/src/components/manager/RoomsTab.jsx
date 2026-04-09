import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Plus, Edit, Trash2, X, Search, Loader, AlertTriangle,
  Building2, Users, RefreshCw, Lightbulb
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../lib/translations';

const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
};
const authConfig = () => ({ headers: { Authorization: `Bearer ${getUser()?.token}` } });

const ACTIVITY_TYPE_KEYS = [
  'supportLessons',
  'reviewCourses',
  'vocationalTrainings',
  'languages',
  'otherActivities'
];

const ACTIVITY_TYPE_LABELS = {
  supportLessons: (t) => t.supportLessons || 'Support Lessons',
  reviewCourses: (t) => t.reviewCourses || 'Review Courses',
  vocationalTrainings: (t) => t.vocationalTrainings || 'Vocational Trainings',
  languages: (t) => t.languages || 'Languages',
  otherActivities: (t) => t.otherActivities || 'Other Activities'
};

const ACTIVITY_TYPE_ALIAS_MAP = new Map();

const registerActivityAlias = (label, key) => {
  if (!label) return;
  const trimmed = String(label).trim();
  if (trimmed) ACTIVITY_TYPE_ALIAS_MAP.set(trimmed, key);
};

Object.values(translations).forEach((lang) => {
  registerActivityAlias(lang.supportLessons, 'supportLessons');
  registerActivityAlias(lang.reviewCourses, 'reviewCourses');
  registerActivityAlias(lang.vocationalTrainings, 'vocationalTrainings');
  registerActivityAlias(lang.languages, 'languages');
  registerActivityAlias(lang.otherActivities, 'otherActivities');
});

registerActivityAlias('Support Lessons', 'supportLessons');
registerActivityAlias('Review Courses', 'reviewCourses');
registerActivityAlias('Vocational Trainings', 'vocationalTrainings');
registerActivityAlias('Vocational Training', 'vocationalTrainings');
registerActivityAlias('Languages', 'languages');
registerActivityAlias('Other Activities', 'otherActivities');

const normalizeActivityType = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (ACTIVITY_TYPE_KEYS.includes(trimmed)) return trimmed;
  return ACTIVITY_TYPE_ALIAS_MAP.get(trimmed) || trimmed;
};

const normalizeActivityTypes = (types) => {
  if (!Array.isArray(types)) return [];
  const normalized = [];
  const seen = new Set();
  types.forEach((type) => {
    const next = normalizeActivityType(type);
    if (!next || seen.has(next)) return;
    seen.add(next);
    normalized.push(next);
  });
  return normalized;
};

const getActivityTypeLabel = (key, t) => {
  const labelFn = ACTIVITY_TYPE_LABELS[key];
  return labelFn ? labelFn(t) : key;
};

const deriveActivityTypes = (catalog) => {
  const types = [];
  if (!catalog) return types;
  if (Array.isArray(catalog.supportLessons) && catalog.supportLessons.length) types.push('supportLessons');
  if (Array.isArray(catalog.reviewCourses) && catalog.reviewCourses.length) types.push('reviewCourses');
  if (Array.isArray(catalog.vocationalTrainings) && catalog.vocationalTrainings.length) types.push('vocationalTrainings');
  if (Array.isArray(catalog.languages) && catalog.languages.length) types.push('languages');
  if (Array.isArray(catalog.otherActivities) && catalog.otherActivities.length) types.push('otherActivities');
  return types;
};

// Smart room name generation based on existing room patterns
const generateNextRoomName = (existingRooms, t) => {
  if (!existingRooms || existingRooms.length === 0) {
    return t.roomNumbered.replace('{number}', 1);
  }

  // Extract all room names and sort them
  const roomNames = existingRooms.map(room => room.name).sort();

  // Pattern 1: Check for numbered rooms (Room 1, Room 2, etc.)
  const numberedRoomPattern = /^room\s*(\d+)$/i;
  const numberedRooms = roomNames
    .map(name => {
      const match = name.match(numberedRoomPattern);
      return match ? parseInt(match[1]) : null;
    })
    .filter(num => num !== null)
    .sort((a, b) => a - b);

  if (numberedRooms.length > 0) {
    const nextNumber = Math.max(...numberedRooms) + 1;
    return t.roomNumbered.replace('{number}', nextNumber);
  }

  // Pattern 2: Check for room with numbers at the end (Classroom 101, Lab 2, etc.)
  const numberSuffixPattern = /^(.+?)\s*(\d+)$/i;
  const numberSuffixGroups = {};

  roomNames.forEach(name => {
    const match = name.match(numberSuffixPattern);
    if (match) {
      const prefix = match[1].trim();
      const number = parseInt(match[2]);
      if (!numberSuffixGroups[prefix]) {
        numberSuffixGroups[prefix] = [];
      }
      numberSuffixGroups[prefix].push(number);
    }
  });

  // Find the most common prefix with the highest number
  let bestPrefix = null;
  let maxNumber = 0;

  Object.entries(numberSuffixGroups).forEach(([prefix, numbers]) => {
    const maxNum = Math.max(...numbers);
    if (maxNum > maxNumber) {
      maxNumber = maxNum;
      bestPrefix = prefix;
    }
  });

  if (bestPrefix) {
    return `${bestPrefix} ${maxNumber + 1}`;
  }

  // Pattern 3: Check for alphabetical sequences (A, B, C, etc.)
  const letterPattern = /^(.+?)\s*([A-Z])$/i;
  const letterGroups = {};

  roomNames.forEach(name => {
    const match = name.match(letterPattern);
    if (match) {
      const prefix = match[1].trim();
      const letter = match[2].toUpperCase();
      if (!letterGroups[prefix]) {
        letterGroups[prefix] = [];
      }
      letterGroups[prefix].push(letter.charCodeAt(0));
    }
  });

  // Find the most common prefix with the highest letter
  let bestLetterPrefix = null;
  let maxLetterCode = 0;

  Object.entries(letterGroups).forEach(([prefix, letterCodes]) => {
    const maxCode = Math.max(...letterCodes);
    if (maxCode > maxLetterCode) {
      maxLetterCode = maxCode;
      bestLetterPrefix = prefix;
    }
  });

  if (bestLetterPrefix) {
    const nextLetter = String.fromCharCode(maxLetterCode + 1);
    return `${bestLetterPrefix} ${nextLetter}`;
  }

  // Pattern 4: Check for common room types and add numbers
  const commonTypes = ['Classroom', 'Lab', 'Office', 'Meeting', 'Conference', 'Study', 'Computer'];
  const typeCounts = {};

  roomNames.forEach(name => {
    const lowerName = name.toLowerCase();
    commonTypes.forEach(type => {
      if (lowerName.includes(type.toLowerCase())) {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
    });
  });

  // Find the most common type
  const mostCommonType = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)[0];

  if (mostCommonType) {
    return `${mostCommonType[0]} ${mostCommonType[1] + 1}`;
  }

  // Fallback: If no clear pattern, just add a number to the last room
  const lastRoom = roomNames[roomNames.length - 1];
  const fallbackPattern = /^(.+?)\s*(\d+)$/;
  const fallbackMatch = lastRoom.match(fallbackPattern);

  if (fallbackMatch) {
    const prefix = fallbackMatch[1];
    const number = parseInt(fallbackMatch[2]) + 1;
    return `${prefix} ${number}`;
  }

  // Final fallback: Add "2" to the last room name
  return `${lastRoom} 2`;
};

const RoomsTab = () => {
  const { t } = useLanguage();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activityOptions, setActivityOptions] = useState([]);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get('/api/rooms', authConfig());
      const normalizedRooms = (data || []).map((room) => ({
        ...room,
        activityTypes: normalizeActivityTypes(room.activityTypes)
      }));
      setRooms(normalizedRooms);
    } catch (err) {
      setError(err.response?.data?.message || t.failedLoadData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const user = getUser();
        if (user?.school) {
          const { data: catalog } = await axios.get(`/api/catalog/${user.school}`, authConfig());
          setActivityOptions(deriveActivityTypes(catalog));
        }
      } catch (e) {
        // if catalog missing, leave options empty
      }
      await fetchRooms();
    };
    init();
  }, []);

  const filtered = useMemo(() => {
    return rooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
  }, [rooms, search]);

  const onSave = async (form) => {
    try {
      if (modal.mode === 'edit') {
        const { data } = await axios.put(`/api/rooms/${modal.data._id}`, form, authConfig());
        setRooms(prev => prev.map(r => r._id === data._id ? data : r));
      } else {
        const { data } = await axios.post('/api/rooms', form, authConfig());
        setRooms(prev => [...prev, data]);
      }
      setModal({ open: false, mode: 'create', data: null });
    } catch (err) {
      alert(err.response?.data?.message || t.errorOccurred);
    }
  };

  const onDelete = async (room) => {
    if (!confirm(`Delete room "${room.name}"?`)) return;
    try {
      await axios.delete(`/api/rooms/${room._id}`, authConfig());
      setRooms(prev => prev.filter(r => r._id !== room._id));
    } catch (err) {
      alert(err.response?.data?.message || t.errorOccurred);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
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
                  placeholder={t.searchRooms}
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

            <button
              onClick={() => setModal({ open: true, mode: 'create', data: null })}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t.addRoom}
            </button>
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
                      ">
                        {t.rooms}
                      </th>
                      <th className="
                        px-6 py-4 text-left text-xs font-semibold 
                        text-text-muted-light uppercase tracking-wider
                      ">
                        {t.capacity}
                      </th>
                      <th className="
                        px-6 py-4 text-left text-xs font-semibold 
                        text-text-muted-light uppercase tracking-wider
                      ">
                        {t.activityTypes}
                      </th>
                      <th className="
                        px-6 py-4 text-right text-xs font-semibold 
                        text-text-muted-light uppercase tracking-wider
                      ">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map(room => (
                      <tr
                        key={room._id}
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
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="
                                font-medium text-text-main-light 
                                group-hover:text-primary transition-colors
                              ">
                                {room.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {room.capacity} {room.capacity === 1 ? t.personCount : t.peopleCount}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(room.activityTypes || []).length > 0 ? (
                              room.activityTypes.map((type, index) => (
                                <span
                                  key={index}
                                  className="
                                    inline-flex items-center px-2 py-1 
                                    text-xs font-medium rounded-full
                                    bg-blue-50 text-blue-700 border border-blue-200
                                  "
                                >
                                  {getActivityTypeLabel(type, t)}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400">{t.noActivitiesAssigned}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setModal({ open: true, mode: 'edit', data: room })}
                              className="
                                p-2 text-gray-400 hover:text-indigo-600 
                                hover:bg-indigo-50 rounded-lg transition-all duration-200
                                group-hover:bg-indigo-50
                              "
                              title={t.editRoom}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(room)}
                              className="
                                p-2 text-gray-400 hover:text-red-600 
                                hover:bg-red-50 rounded-lg transition-all duration-200
                                group-hover:bg-red-50
                              "
                              title={t.deleteRoom}
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
                <Building2 className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t.noRoomsFound}</h3>
                <p className="text-gray-500 mb-6">
                  {search ? t.noRoomsMatchSearch : t.getStartedCreateFirstRoom}
                </p>
                {!search && (
                  <button
                    onClick={() => setModal({ open: true, mode: 'create', data: null })}
                    className="btn-primary flex items-center gap-2 mt-4"
                  >
                    <Plus className="w-4 h-4" />
                    {t.createFirstRoom}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {modal.open && (
        <RoomModal
          mode={modal.mode}
          data={modal.data}
          onClose={() => setModal({ open: false, mode: 'create', data: null })}
          onSave={onSave}
          activityOptions={activityOptions}
          existingRooms={rooms}
        />
      )}
    </div>
  );
};

const RoomModal = ({ mode, data, onClose, onSave, activityOptions, existingRooms }) => {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: data?.name || (mode === 'create' ? generateNextRoomName(existingRooms, t) : ''),
    capacity: data?.capacity || 1,
    activityTypes: normalizeActivityTypes(data?.activityTypes || []),
  });

  const toggleActivity = (typeKey) => {
    setForm(prev => ({
      ...prev,
      activityTypes: prev.activityTypes.includes(typeKey)
        ? prev.activityTypes.filter(x => x !== typeKey)
        : [...prev.activityTypes, typeKey]
    }));
  };

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
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-xl font-semibold text-gray-900">
              {mode === 'edit' ? t.editRoom : t.addRoom}
            </h4>
            <p className="text-sm text-gray-500">
              {mode === 'edit' ? t.update + ' ' + t.rooms.toLowerCase() : t.create + ' ' + t.rooms.toLowerCase()}
            </p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.roomName}</label>
            <div className="flex gap-2">
              <input
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder={t.enterRoomName}
              />
              {mode === 'create' && (
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, name: generateNextRoomName(existingRooms, t) }))}
                  className="
                    px-3 py-3 text-sm bg-gray-100 hover:bg-gray-200 
                    border border-gray-300 rounded-lg transition-all duration-200
                    flex items-center gap-1
                  "
                  title={t.generateRoomName}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
            {mode === 'create' && (
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <Lightbulb className="w-3 h-3 text-yellow-500" />
                <span>{t.smartSuggestion}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.capacity}</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                min={1}
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                required
                placeholder={t.enterCapacity}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.activityTypes}</label>
            {activityOptions.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500 text-center">{t.noCatalogActivities}</p>
                <p className="text-xs text-gray-400 text-center mt-1">{t.addCatalogActivitiesFirst}</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activityOptions.map(typeKey => (
                  <button
                    type="button"
                    key={typeKey}
                    onClick={() => toggleActivity(typeKey)}
                    className={`
                      px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200
                      ${form.activityTypes.includes(typeKey)
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }
                    `}
                  >
                    {getActivityTypeLabel(typeKey, t)}
                  </button>
                ))}
              </div>
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
                px-4 py-2 bg-blue-600 text-white rounded-lg 
                hover:bg-blue-700 transition-all duration-200 font-medium
              "
            >
              {mode === 'create' ? t.create + ' ' + t.rooms.toLowerCase() : t.updateRoom}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomsTab;
