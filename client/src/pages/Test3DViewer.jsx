// client/src/pages/Test3DViewer.jsx
import React, { useState } from 'react';
import ThreeJSViewer from '../components/shared/ThreeJSViewer';

const Test3DViewer = () => {
  const [testUrl, setTestUrl] = useState('');

  // Sample GLB URLs for testing (you can replace these with actual model URLs)
  const sampleModels = [
    {
      name: 'Sample Model 1',
      url: 'http://localhost:3001/uploads/models/sample-model-1.glb'
    },
    {
      name: 'Sample Model 2', 
      url: 'http://localhost:3001/uploads/models/sample-model-2.glb'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Three.js 3D Model Viewer Test</h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Model Loading</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Model URL:
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="http://localhost:3001/uploads/models/your-model.glb"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setTestUrl('')}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Sample Models:</h3>
              <div className="flex space-x-2">
                {sampleModels.map((model, index) => (
                  <button
                    key={index}
                    onClick={() => setTestUrl(model.url)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    {model.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">3D Viewer</h3>
              {testUrl ? (
                <div className="bg-gray-100 rounded-lg">
                  <ThreeJSViewer 
                    modelUrl={testUrl} 
                    className="w-full h-96" 
                  />
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">
                  <div className="text-center text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <p>Enter a model URL above to test the 3D viewer</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Instructions:</h3>
            <ul className="text-blue-700 space-y-1">
              <li>• Upload a GLB model through the admin panel first</li>
              <li>• Copy the model URL from the admin panel</li>
              <li>• Paste it in the input field above to test</li>
              <li>• Use mouse to rotate, zoom, and pan the model</li>
              <li>• Check browser console for any errors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test3DViewer;
