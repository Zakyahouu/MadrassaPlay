import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ClassAnnouncements from '../student/ClassAnnouncements';
import { useLanguage } from '../../context/LanguageContext';
import { Search, BookOpen, Users } from 'lucide-react';

const TeacherAnnouncements = () => {
  const { t } = useLanguage();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get('/api/classes/teacher');
        if (!mounted) return;
        const list = res.data || [];
        setClasses(list);
        if (list[0]?._id) setSelectedClassId(list[0]._id);
      } catch (e) {
        console.error('Failed to load teacher classes', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const selectedClass = classes.find(c => c._id === selectedClassId);
  const filteredClasses = classes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="text-sm text-gray-500 p-8 text-center">{t.loading}</div>;

  return (
    <div className="flex h-[calc(100vh-160px)] bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Left Sidebar - Class List */}
      <div className="w-72 border-r border-gray-200 flex flex-col bg-gray-50/30">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-base font-bold text-gray-900 mb-3">{t.myClasses || 'My Classes'}</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t.searchClasses || "Search classes..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white border focus:border-primary rounded-lg text-sm transition-all focus:ring-0"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredClasses.length > 0 ? filteredClasses.map(c => {
            const active = c._id === selectedClassId;
            return (
              <button
                key={c._id}
                onClick={() => setSelectedClassId(c._id)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-3 group ${active ? 'bg-primary/5 border-primary/10 shadow-sm' : 'hover:bg-white hover:border-gray-200 border border-transparent'
                  }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary'
                  }`}>
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={`font-semibold text-sm truncate ${active ? 'text-primary' : 'text-gray-900'}`}>{c.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Users className={`w-3 h-3 ${active ? 'text-primary/60' : 'text-gray-400'}`} />
                    <span className={`text-[11px] font-medium ${active ? 'text-primary/70' : 'text-gray-500'}`}>
                      {c.enrolledStudents?.length || 0}
                    </span>
                  </div>
                </div>
                {active && <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>}
              </button>
            );
          }) : (
            <div className="p-4 text-center text-xs text-gray-500 italic">No classes found</div>
          )}
        </div>
      </div>

      {/* Main Area - Chat interface */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {selectedClass ? (
          <ClassAnnouncements
            classId={selectedClassId}
            classData={selectedClass}
            className="h-full"
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/10">
            <BookOpen className="w-12 h-12 mb-3 opacity-10" />
            <p className="text-sm font-medium">{t.noClassSelected || 'Select a class to start'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAnnouncements;
