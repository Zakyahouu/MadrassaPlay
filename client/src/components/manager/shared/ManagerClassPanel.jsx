import {
  Users, BookOpen, GraduationCap, Calendar, BarChart3, Settings, Bell,
  UserCheck, Building2, FileText, Search, Plus, Edit, Trash2, Eye,
  Clock, Star, Award, TrendingUp, Filter, Download, Mail, Phone
} from 'lucide-react';
import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import axios from 'axios';
import { useLanguage } from '../../../context/LanguageContext';
const ManagerClassPanel = ({ setActiveTab }) => {
  const { t } = useLanguage();
  const [top, setTop] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get('/api/leaderboard/school', { params: { metric: 'points', limit: 3 } });
        if (mounted) setTop(res.data?.items || []);
      } catch (_) { }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="card-base p-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-text-main-light">{t.classManagement}</h3>
      </div>
      <div className="text-sm mb-2 text-text-muted-light">{t.topStudentsSchool}</div>
      <div className="space-y-1 text-sm">
        {top.length === 0 && <div className="text-text-muted-light">{t.noData}</div>}
        {top.map((s, i) => {
          const isMe = user?._id === s._id;
          return (
            <div key={s._id} className={`flex justify-between ${isMe ? 'text-primary font-semibold' : ''}`}>
              <span>{i + 1}. {s.name}{isMe ? t.youSuffix : ''}</span>
              <span className="font-medium">{s.totalPoints} pts</span>
            </div>
          );
        })}
      </div>
      <button onClick={() => setActiveTab && setActiveTab('classes')} className="mt-3 text-primary hover:text-primary-hover text-sm font-medium">
        {t.manageClassesAction}
      </button>
    </div>
  );
};

export default ManagerClassPanel;