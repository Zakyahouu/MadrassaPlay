// client/src/pages/FullScreenModelViewer.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ThreeJSViewer from '../components/shared/ThreeJSViewer';
import { teacherApi, adminApi } from '../services/model3dService';

const FullScreenModelViewer = () => {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        // Try teacher endpoint first, then admin as fallback
        try {
          const res = await teacherApi.getModel(modelId);
          setModel(res.data.data || res.data.model || res.data);
        } catch (e1) {
          const res = await adminApi.getModel(modelId);
          setModel(res.data.data || res.data.model || res.data);
        }
      } catch (e) {
        setError('Failed to load model');
      } finally {
        setLoading(false);
      }
    };
    if (modelId) load();
  }, [modelId]);

  return (
    <div className="fixed inset-0 bg-white">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white/80 border border-gray-300 rounded-md hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
      </div>

      <div className="absolute inset-0">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading 3D model...</p>
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          </div>
        ) : model?.fileUrl ? (
          <ThreeJSViewer modelUrl={model.fileUrl} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p>No model file available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullScreenModelViewer;


