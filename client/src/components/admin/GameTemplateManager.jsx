import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Edit,
  Trash2,
  Target,
  Plus,
  Play,
  Gamepad2,
  FileCheck,
  FileX,
  Loader2
} from 'lucide-react';
import TemplateUploader from './TemplateUploader';
import TemplateMetaEditor from './TemplateMetaEditor';
import { TemplateContext } from '../../context/TemplateContext';
import StatusMessage from '../shared/StatusMessage';
import { useLanguage } from '../../context/LanguageContext';

const GameTemplateManager = () => {
  const { t } = useLanguage();
  const [error, setError] = useState('');
  const { templates, setTemplates, triggerTemplateUpdate } = useContext(TemplateContext);
  const [editing, setEditing] = useState(null);

  const fetchTemplates = async () => {
    try {
      const { data } = await axios.get('/api/templates');
      setTemplates(data);
    } catch (err) {
      setError(t.failedToFetchTemplates);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const [pendingStatusId, setPendingStatusId] = useState(null);
  const handlePublishToggle = async (templateId, newStatus) => {
    if (!confirm(newStatus === 'published' ? t.publishTemplateConfirm : t.unpublishTemplateConfirm)) return;
    setPendingStatusId(templateId);
    try {
      await axios.put(`/api/templates/${templateId}/status`, { status: newStatus });
      fetchTemplates();
      triggerTemplateUpdate();
    } catch (err) {
      setError(t.failedToUpdateTemplateStatus);
    } finally {
      setPendingStatusId(null);
    }
  };

  const [success, setSuccess] = useState('');
  const handleDelete = async (templateId) => {
    if (!confirm(t.deleteTemplateConfirm)) return;
    try {
      await axios.delete(`/api/templates/${templateId}`);
      fetchTemplates();
      setSuccess(t.templateDeletedSuccess);
    } catch (err) {
      const msg = err.response?.data?.message || t.failedToDeleteTemplate;
      setError(msg);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
          <Gamepad2 className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">{t.gameTemplates}</h3>
        <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {templates.length}
        </span>
      </div>

      {error && (
        <StatusMessage variant="error" message={error} onClose={() => setError('')} />
      )}
      {success && (
        <StatusMessage variant="success" message={success} onClose={() => setSuccess('')} />
      )}

      <div className="space-y-3 mb-8">
        {templates.length > 0 ? (
          templates.map((template) => (
            <div key={template._id} className="group p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all duration-200">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold text-gray-900 truncate">{template.name}</h4>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${template.status === 'published'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                      {template.status === 'published' ? <FileCheck className="w-3 h-3" /> : <Loader2 className="w-3 h-3" />}
                      {template.status === 'published' ? t.published : t.draft}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm truncate">{template.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/teacher/create-game/${template._id}`}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title={t.test}
                  >
                    <Play className="w-5 h-5" />
                  </Link>

                  <button
                    onClick={() => handlePublishToggle(template._id, template.status === 'draft' ? 'published' : 'draft')}
                    className={`p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${template.status === 'draft'
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-amber-600 hover:bg-amber-50'
                      }`}
                    aria-label={`${template.status === 'draft' ? t.publish : t.unpublish} template ${template.name}`}
                    disabled={pendingStatusId === template._id}
                    title={template.status === 'draft' ? t.publish : t.unpublish}
                  >
                    {pendingStatusId === template._id ? <Loader2 className="w-5 h-5 animate-spin" /> : (template.status === 'draft' ? <FileCheck className="w-5 h-5" /> : <FileX className="w-5 h-5" />)}
                  </button>

                  <div className="w-px h-6 bg-gray-200 mx-1"></div>

                  <button
                    onClick={() => setEditing(template)}
                    aria-label={`Edit template ${template.name}`}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(template._id)}
                    aria-label={`Delete template ${template.name}`}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-gray-900 font-medium mb-1">{t.noGameTemplates}</h3>
            <p className="text-sm text-gray-500">{t.uploadTemplatesToStart}</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-6">
        <TemplateUploader onUploadSuccess={fetchTemplates} />
      </div>
      {editing && (
        <TemplateMetaEditor
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); fetchTemplates(); triggerTemplateUpdate(); }}
        />
      )}
    </div>
  );
};
export default GameTemplateManager;