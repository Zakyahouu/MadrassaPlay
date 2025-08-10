import { 
  Users, BookOpen, GraduationCap, Calendar, BarChart3, Settings, Bell, 
  UserCheck, Building2, FileText, Search, Plus, Edit, Trash2, Eye,
  Clock, Star, Award, TrendingUp, Filter, Download, Mail, Phone
} from 'lucide-react';
import React from 'react';
const QuickActionCard = ({ title, description, icon: Icon, color, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white rounded-lg border border-gray-200 p-4 text-left hover:shadow-md transition-shadow duration-200"
  >
    <div className="flex items-start gap-3">
      <Icon className={`w-6 h-6 ${color} mt-1`} />
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  </button>
);

export default QuickActionCard;