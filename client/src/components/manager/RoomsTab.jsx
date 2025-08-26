import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { 
  Plus, Edit, Trash2, X, Search, Loader, AlertTriangle, 
  Building2, Users, RefreshCw, Lightbulb
} from 'lucide-react';

const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
};
const authConfig = () => ({ headers: { Authorization: `Bearer ${getUser()?.token}` } });

const deriveActivityTypes = (catalog) => {
  const types = [];
  if (!catalog) return types;
  if (Array.isArray(catalog.supportLessons) && catalog.supportLessons.length) types.push('Support Lessons');
  if (Array.isArray(catalog.reviewCourses) && catalog.reviewCourses.length) types.push('Review Courses');
  if (Array.isArray(catalog.vocationalTrainings) && catalog.vocationalTrainings.length) types.push('Vocational Training');
  if (Array.isArray(catalog.languages) && catalog.languages.length) types.push('Languages');
  if (Array.isArray(catalog.otherActivities) && catalog.otherActivities.length) types.push('Other Activities');
  return types;
};

// Smart room name generation based on existing room patterns
const generateNextRoomName = (existingRooms) => {
  if (!existingRooms || existingRooms.length === 0) {
    return 'Room 1';
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
    return `Room ${nextNumber}`;
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
    .sort(([,a], [,b]) => b - a)[0];
  
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
      setRooms(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch rooms');
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
      alert(err.response?.data?.message || 'Save failed');
    }
  };

  const onDelete = async (room) => {
    if (!confirm(`Delete room "${room.name}"?`)) return;
    try {
      await axios.delete(`/api/rooms/${room._id}`, authConfig());
      setRooms(prev => prev.filter(r => r._id !== room._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
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
                  placeholder="Search rooms..."
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
              Add Room
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
            <p className="text-gray-600">Loading rooms...</p>
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
                        Room
                      </th>
                      <th className="
                        px-6 py-4 text-left text-xs font-semibold 
                        text-gray-600 uppercase tracking-wider
                      ">
                        Capacity
                      </th>
                      <th className="
                        px-6 py-4 text-left text-xs font-semibold 
                        text-gray-600 uppercase tracking-wider
                      ">
                        Activity Types
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
                              w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 
                              rounded-xl flex items-center justify-center 
                              text-white font-semibold
                            ">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="
                                font-medium text-gray-900 
                                group-hover:text-indigo-600 transition-colors
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
                              {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
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
                                  {type}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400">No activities assigned</span>
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
                              title="Edit room"
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
                              title="Delete room"
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
                <p className="text-gray-500 mb-6">
                  {search ? 'No rooms match your search criteria.' : 'Get started by creating your first room.'}
                </p>
                {!search && (
                  <button
                    onClick={() => setModal({ open: true, mode: 'create', data: null })}
                    className="
                      flex items-center gap-2 px-4 py-2
                      bg-blue-600 text-white rounded-lg
                      hover:bg-blue-700 transition-colors duration-200
                    "
                  >
                    <Plus className="w-4 h-4" />
                    Create First Room
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
          onClose={()=>setModal({ open:false, mode:'create', data:null })}
          onSave={onSave}
          activityOptions={activityOptions}
          existingRooms={rooms}
        />
      )}
    </div>
  );
};

const RoomModal = ({ mode, data, onClose, onSave, activityOptions, existingRooms }) => {
  const [form, setForm] = useState({
    name: data?.name || (mode === 'create' ? generateNextRoomName(existingRooms) : ''),
    capacity: data?.capacity || 1,
    activityTypes: data?.activityTypes || [],
  });

  const toggleActivity = (t) => {
    setForm(prev => ({
      ...prev,
      activityTypes: prev.activityTypes.includes(t)
        ? prev.activityTypes.filter(x => x !== t)
        : [...prev.activityTypes, t]
    }));
  };

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg relative shadow-2xl" onClick={e=>e.stopPropagation()}>
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
              {mode === 'edit' ? 'Edit Room' : 'Add New Room'}
            </h4>
            <p className="text-sm text-gray-500">
              {mode === 'edit' ? 'Update room details and settings' : 'Create a new room for your school'}
            </p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Room Name</label>
            <div className="flex gap-2">
              <input 
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200" 
                value={form.name} 
                onChange={(e)=>setForm({...form, name:e.target.value})} 
                required 
                placeholder="Enter room name"
              />
              {mode === 'create' && (
                <button 
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, name: generateNextRoomName(existingRooms) }))}
                  className="
                    px-3 py-3 text-sm bg-gray-100 hover:bg-gray-200 
                    border border-gray-300 rounded-lg transition-all duration-200
                    flex items-center gap-1
                  "
                  title="Generate next room name"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
            {mode === 'create' && (
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <Lightbulb className="w-3 h-3 text-yellow-500" />
                <span>Smart suggestion based on existing room patterns. Click the refresh button to regenerate.</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="number" 
                min={1} 
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200" 
                value={form.capacity} 
                onChange={(e)=>setForm({...form, capacity: Number(e.target.value)})} 
                required 
                placeholder="Enter capacity"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activity Types</label>
            {activityOptions.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500 text-center">No catalog activities available yet.</p>
                <p className="text-xs text-gray-400 text-center mt-1">Add activities to your school catalog first.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activityOptions.map(t => (
                  <button 
                    type="button" 
                    key={t} 
                    onClick={()=>toggleActivity(t)}
                    className={`
                      px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200
                      ${form.activityTypes.includes(t) 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }
                    `}
                  >
                    {t}
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
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="
                px-4 py-2 bg-blue-600 text-white rounded-lg 
                hover:bg-blue-700 transition-all duration-200 font-medium
              "
            >
              {mode === 'create' ? 'Create Room' : 'Update Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomsTab;
