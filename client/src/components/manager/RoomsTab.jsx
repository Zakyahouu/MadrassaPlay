import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, X } from 'lucide-react';

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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Rooms</h3>
        <button onClick={() => setModal({ open: true, mode: 'create', data: null })}
          className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Add Room
        </button>
      </div>
      <div className="mb-4">
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search rooms..."
          className="w-full md:w-64 p-2 border border-gray-300 rounded-md" />
      </div>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">No rooms found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Capacity</th>
                <th className="py-2 pr-4">Activity Types</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r._id} className="border-b">
                  <td className="py-2 pr-4">{r.name}</td>
                  <td className="py-2 pr-4">{r.capacity}</td>
                  <td className="py-2 pr-4">{(r.activityTypes||[]).join(', ') || '—'}</td>
                  <td className="py-2 pr-4">
                    <button className="text-indigo-600 hover:underline mr-3" onClick={()=>setModal({ open:true, mode:'edit', data:r })}>
                      <Edit className="inline w-4 h-4" /> Edit
                    </button>
                    <button className="text-red-600 hover:underline" onClick={()=>onDelete(r)}>
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
        <RoomModal 
          mode={modal.mode}
          data={modal.data}
          onClose={()=>setModal({ open:false, mode:'create', data:null })}
          onSave={onSave}
          activityOptions={activityOptions}
        />
      )}
    </div>
  );
};

const RoomModal = ({ mode, data, onClose, onSave, activityOptions }) => {
  const [form, setForm] = useState({
    name: data?.name || '',
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg relative" onClick={e=>e.stopPropagation()}>
        <button className="absolute top-3 right-3 text-gray-500" onClick={onClose}><X/></button>
        <h4 className="text-lg font-semibold mb-4">{mode==='edit'?'Edit Room':'Add Room'}</h4>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input className="w-full p-2 border rounded" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Capacity</label>
            <input type="number" min={1} className="w-full p-2 border rounded" value={form.capacity} onChange={(e)=>setForm({...form, capacity: Number(e.target.value)})} required />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Activity Types</label>
            {activityOptions.length === 0 ? (
              <p className="text-xs text-gray-500">No catalog activities available yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activityOptions.map(t => (
                  <button type="button" key={t} onClick={()=>toggleActivity(t)}
                    className={`px-2 py-1 rounded border text-sm ${form.activityTypes.includes(t) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 border rounded">Cancel</button>
            <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomsTab;
