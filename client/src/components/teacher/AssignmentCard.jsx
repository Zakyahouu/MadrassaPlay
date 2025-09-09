import React from 'react';
import { FileText, Calendar, Users, CheckCircle, Eye, Edit, Trash2, XCircle, Flag } from 'lucide-react';

// Unified assignment card UI for teacher views
// Props:
// - assignment: the assignment object
// - summary: { submittedCount, totalStudents } optional
// - onView, onEdit, onDelete: handlers
export default function AssignmentCard({ assignment, summary, onView, onEdit, onDelete, onCancel }) {
  const a = assignment;
  const status = a.status;
  const dateRange = `${new Date(a.startDate).toLocaleString()} → ${new Date(a.endDate).toLocaleString()}`;

  let variant = { bg: 'from-green-500 to-emerald-500', Icon: CheckCircle };
  if (status === 'active') variant = { bg: 'from-blue-500 to-cyan-500', Icon: FileText };
  else if (status === 'upcoming') variant = { bg: 'from-amber-500 to-yellow-400', Icon: Calendar };
  else if (status === 'canceled') variant = { bg: 'from-rose-500 to-red-500', Icon: XCircle };
  else if (status === 'completed') variant = { bg: 'from-slate-500 to-gray-500', Icon: Flag };

  const Icon = variant.Icon;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${variant.bg} rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {a.title}
              <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                status==='active' ? 'bg-blue-50 text-blue-700' :
                status==='upcoming' ? 'bg-amber-50 text-amber-700' :
                status==='canceled' ? 'bg-rose-50 text-rose-700' :
                status==='completed' ? 'bg-gray-100 text-gray-700' : 'bg-emerald-50 text-emerald-700'
              }`}>{status}</span>
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {dateRange}
              </span>
            </div>
            {Array.isArray(a.classes) && a.classes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {a.classes.map((c) => (
                  <span key={c._id || c} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                    {c.name || 'Class'}
                  </span>
                ))}
              </div>
            )}
            {a.description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{a.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {status !== 'upcoming' && (
            <div className="text-center">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  {summary ? `${summary.submittedCount}/${summary.totalStudents}` : '—'}
                </span>
              </div>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <button onClick={onView} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
              <Eye className="w-4 h-4" />
            </button>
            {onEdit && (
              <button onClick={onEdit} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" title="Edit">
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onCancel && (status==='upcoming' || status==='active') && (
              <button onClick={onCancel} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg" title="Cancel">
                <XCircle className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      {status==='active' && (
        <div className="mt-3 text-[11px] text-gray-500">Rule: Active assignments can only be canceled while completion is below 50%.</div>
      )}
    </div>
  );
}
