import { 
  Users, BookOpen, GraduationCap, Calendar, BarChart3, Settings, Bell, 
  UserCheck, Building2, FileText, Search, Plus, Edit, Trash2, Eye,
  Clock, Star, Award, TrendingUp, Filter, Download, Mail, Phone
} from 'lucide-react';
import React from 'react';
const ManagerClassPanel = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex items-center gap-2 mb-3">
      <BookOpen className="w-5 h-5 text-blue-600" />
      <h3 className="text-lg font-semibold">Class Management</h3>
    </div>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div className="text-gray-600">Total Classes: <span className="font-medium text-gray-900">24</span></div>
      <div className="text-gray-600">Active Sessions: <span className="font-medium text-gray-900">18</span></div>
    </div>
    <button className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium">Manage Classes →</button>
  </div>
);

export default ManagerClassPanel;