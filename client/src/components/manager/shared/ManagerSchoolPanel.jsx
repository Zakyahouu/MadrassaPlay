import { 
  Users, BookOpen, GraduationCap, Calendar, BarChart3, Settings, Bell, 
  UserCheck, Building2, FileText, Search, Plus, Edit, Trash2, Eye,
  Clock, Star, Award, TrendingUp, Filter, Download, Mail, Phone
} from 'lucide-react';
import React from 'react';
const ManagerSchoolPanel = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex items-center gap-2 mb-3">
      <Building2 className="w-5 h-5 text-green-600" />
      <h3 className="text-lg font-semibold">School Overview</h3>
    </div>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div className="text-gray-600">Total Students: <span className="font-medium text-gray-900">1,247</span></div>
      <div className="text-gray-600">Total Teachers: <span className="font-medium text-gray-900">89</span></div>
    </div>
    <button className="mt-3 text-green-600 hover:text-green-700 text-sm font-medium">View Details →</button>
  </div>
);

export default ManagerSchoolPanel;