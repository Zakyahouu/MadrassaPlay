import { 
  Users, BookOpen, GraduationCap, Calendar, BarChart3, Settings, Bell, 
  UserCheck, Building2, FileText, Search, Plus, Edit, Trash2, Eye,
  Clock, Star, Award, TrendingUp, Filter, Download, Mail, Phone
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
const ManagerSchoolPanel = ({ setActiveTab }) => {
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
      } catch (_) {}
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Building2 className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold">School Overview</h3>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="text-gray-600">Total Students: <span className="font-medium text-gray-900">{students}</span></div>
        <div className="text-gray-600">Total Teachers: <span className="font-medium text-gray-900">{teachers}</span></div>
      </div>
      <button onClick={() => setActiveTab && setActiveTab('reports')} className="mt-3 text-green-600 hover:text-green-700 text-sm font-medium">View Details →</button>
    </div>
  );
};

export default ManagerSchoolPanel;