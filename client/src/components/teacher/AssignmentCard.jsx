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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className={`w-14 h-14 bg-gradient-to-br ${variant.bg} rounded-xl flex items-center justify-center shadow-lg`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900">{a.title}</h3>
              <span className={`text-xs uppercase tracking-wide px-3 py-1 rounded-full font-medium ${
                status==='active' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                status==='upcoming' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                status==='canceled' ? 'bg-red-100 text-red-800 border border-red-200' :
                status==='completed' ? 'bg-gray-100 text-gray-800 border border-gray-200' : 'bg-green-100 text-green-800 border border-green-200'
              }`}>{status}</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                {dateRange}
              </span>
            </div>
            {Array.isArray(a.classes) && a.classes.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {a.classes.map((c) => (
                  <span key={c._id || c} className="px-3 py-1 text-xs rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                    {c.name || 'Class'}
                  </span>
                ))}
              </div>
            )}
            {a.description && (
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{a.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {status !== 'upcoming' && (
            <div className="text-center bg-gray-50 rounded-xl p-4 min-w-[100px]">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-lg font-bold text-gray-900">
                  {summary ? `${summary.submittedCount}/${summary.totalStudents}` : '—'}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">Completed</p>
              {summary && summary.totalStudents > 0 && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-purple-500 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${(summary.submittedCount / summary.totalStudents) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center space-x-1">
            <button onClick={onView} className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="View Details">
              <Eye className="w-5 h-5" />
            </button>
            {onEdit && (
              <button onClick={onEdit} className="p-3 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors" title="Edit Assignment">
                <Edit className="w-5 h-5" />
              </button>
            )}
            {onCancel && (status==='upcoming' || status==='active') && (
              <button onClick={onCancel} className="p-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" title="Cancel Assignment">
                <XCircle className="w-5 h-5" />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Delete Assignment">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
      {status==='active' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs text-blue-700 font-medium">
            <span className="font-semibold">Note:</span> Active assignments can only be canceled while completion is below 50%.
          </p>
        </div>
      )}
    </div>
  );
}
