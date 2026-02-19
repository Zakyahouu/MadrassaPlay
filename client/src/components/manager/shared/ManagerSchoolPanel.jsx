import {
  Users, BookOpen, GraduationCap, Calendar, BarChart3, Settings, Bell,
  UserCheck, Building2, FileText, Search, Plus, Edit, Trash2, Eye,
  Clock, Star, Award, TrendingUp, Filter, Download, Mail, Phone
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../../../context/LanguageContext';
const ManagerSchoolPanel = ({ setActiveTab }) => {
  const { t } = useLanguage();
  const [students, setStudents] = useState('—');
  const [teachers, setTeachers] = useState('—');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [s, t] = await Promise.all([
          axios.get('/api/users/count', { params: { role: 'student' } }),
          axios.get('/api/users/count', { params: { role: 'teacher' } }),
        ]);
        if (!mounted) return;
        setStudents(s.data?.count ?? 0);
        setTeachers(t.data?.count ?? 0);
      } catch (_) { }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="card-base p-4">
      <div className="flex items-center gap-2 mb-3">
        <Building2 className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-semibold text-text-main-light">{t.schoolOverview}</h3>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="text-text-muted-light">{t.totalStudents}: <span className="font-medium text-text-main-light">{students}</span></div>
        <div className="text-text-muted-light">{t.totalTeachers}: <span className="font-medium text-text-main-light">{teachers}</span></div>
      </div>
      <button onClick={() => setActiveTab && setActiveTab('reports')} className="mt-3 text-primary hover:text-primary-hover text-sm font-medium">
        {t.viewDetailsAction}
      </button>
    </div>
  );
};

export default ManagerSchoolPanel;