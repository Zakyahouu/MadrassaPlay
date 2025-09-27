// client/src/components/shared/ModelCard.jsx
import React from 'react';
import { Eye, Edit, Trash2, Share, ExternalLink } from 'lucide-react';

const ModelCard = ({ 
  model, 
  onInspect, 
  onEdit, 
  onDelete, 
  onShare, 
  showAdminActions = false,
  showTeacherActions = false 
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-slate-300">
      <div className="p-6">
        {/* Model Preview Placeholder */}
        <div className="w-full h-48 bg-slate-50 rounded-lg mb-4 flex items-center justify-center border border-slate-200">
          <div className="text-center text-slate-500">
            <div className="w-16 h-16 mx-auto mb-2 bg-slate-100 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-sm">3D Model Preview</p>
          </div>
        </div>

        {/* Model Info */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
            {model.name}
          </h3>
          <p className="text-sm text-slate-600 mb-3 line-clamp-3">
            {model.description}
          </p>
          
          {/* Category */}
          {model.category && (
            <div className="mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                {typeof model.category === 'object' ? model.category.name : model.category}
              </span>
            </div>
          )}

          {/* Tags */}
          {model.tags && model.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {model.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200"
                >
                  {typeof tag === 'object' ? tag.name : tag}
                </span>
              ))}
              {model.tags.length > 3 && (
                <span className="text-xs text-slate-500">
                  +{model.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          {/* Inspect Button - Always shown */}
          <button
            onClick={() => onInspect(model)}
            className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <Eye className="w-4 h-4 mr-1" />
            Inspect
          </button>

          {/* Admin Actions */}
          {showAdminActions && (
            <>
              <button
                onClick={() => onEdit(model)}
                className="flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(model)}
                className="flex items-center justify-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Teacher Actions */}
          {showTeacherActions && (
            <button
              onClick={() => onShare(model)}
              className="flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <Share className="w-4 h-4 mr-1" />
              Share
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelCard;
