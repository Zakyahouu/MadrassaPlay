
import { 
  Users, BookOpen, GraduationCap, Calendar, BarChart3, Settings, Bell, 
  UserCheck, Building2, FileText, Search, Plus, Edit, Trash2, Eye,
  Clock, Star, Award, TrendingUp, Filter, Download, Mail, Phone
} from 'lucide-react';
import React from 'react';
const NotificationItem = ({ message, time, type }) => (
  <div className="flex items-start gap-3 py-2">
    <div className={`w-2 h-2 rounded-full mt-2 ${
      type === 'urgent' ? 'bg-red-500' : 
      type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    }`} />
    <div className="flex-1">
      <p className="text-sm text-gray-900">{message}</p>
      <p className="text-xs text-gray-500">{time}</p>
    </div>
  </div>
);

export default NotificationItem;