import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ClassAnnouncements from '../student/ClassAnnouncements';
import { useLanguage } from '../../context/LanguageContext';

const TeacherAnnouncements = () => {
  const { t } = useLanguage();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get('/api/classes/teacher');
        if (!mounted) return;
        const list = res.data || [];
        setClasses(list);
        if (list[0]?._id) setSelectedClass(list[0]._id);
      } catch (e) {
        console.error('Failed to load teacher classes', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="text-sm text-gray-500">{t('loading')}</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 border">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700">{t('class')}</label>
          <select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)} className="px-3 py-2 border rounded-md">
            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {selectedClass ? (
        <ClassAnnouncements classId={selectedClass} />
      ) : (
        <div className="text-sm text-gray-500">{t('no-class-selected')}</div>
      )}
    </div>
  );
};

export default TeacherAnnouncements;
