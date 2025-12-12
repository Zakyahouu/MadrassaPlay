// client/src/components/manager/builder/editors/ProgramsEditor.jsx

import React from 'react';
import { Plus, Trash2, Star } from 'lucide-react';

const ProgramsEditor = ({ data, onChange, showMessage }) => {
  const programs = data?.programs || [];

  const handleProgramChange = (index, field, value) => {
    const updatedPrograms = [...programs];
    updatedPrograms[index] = { ...updatedPrograms[index], [field]: value };
    onChange({ ...data, programs: updatedPrograms });
  };

  const handleFeatureChange = (programIndex, featureIndex, value) => {
    const updatedPrograms = [...programs];
    updatedPrograms[programIndex].features[featureIndex] = value;
    onChange({ ...data, programs: updatedPrograms });
  };

  const addProgram = () => {
    onChange({
      ...data,
      programs: [
        ...programs,
        {
          title: 'New Program',
          description: 'Program description',
          features: ['Feature 1', 'Feature 2', 'Feature 3'],
          price: '99',
          duration: '8 weeks',
          level: 'Beginner',
          highlight: false
        }
      ]
    });
    showMessage('Program added', 'success');
  };

  const removeProgram = (index) => {
    const updatedPrograms = programs.filter((_, i) => i !== index);
    onChange({ ...data, programs: updatedPrograms });
    showMessage('Program removed', 'success');
  };

  const addFeature = (programIndex) => {
    const updatedPrograms = [...programs];
    updatedPrograms[programIndex].features.push('New Feature');
    onChange({ ...data, programs: updatedPrograms });
  };

  const removeFeature = (programIndex, featureIndex) => {
    const updatedPrograms = [...programs];
    updatedPrograms[programIndex].features = updatedPrograms[programIndex].features.filter((_, i) => i !== featureIndex);
    onChange({ ...data, programs: updatedPrograms });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Programs</h3>
          <p className="text-sm text-gray-600">Manage your course programs</p>
        </div>
        <button
          onClick={addProgram}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Program
        </button>
      </div>

      {programs.map((program, programIndex) => (
        <div key={programIndex} className="border rounded-lg p-6 space-y-4 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Program {programIndex + 1}</h4>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={program.highlight || false}
                  onChange={(e) => handleProgramChange(programIndex, 'highlight', e.target.checked)}
                  className="rounded"
                />
                <Star className="w-4 h-4" />
                Highlight
              </label>
              <button
                onClick={() => removeProgram(programIndex)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program Title
              </label>
              <input
                type="text"
                value={program.title}
                onChange={(e) => handleProgramChange(programIndex, 'title', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                value={program.level}
                onChange={(e) => handleProgramChange(programIndex, 'level', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input
                type="text"
                value={program.price}
                onChange={(e) => handleProgramChange(programIndex, 'price', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <input
                type="text"
                value={program.duration}
                onChange={(e) => handleProgramChange(programIndex, 'duration', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={program.description}
              onChange={(e) => handleProgramChange(programIndex, 'description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Features
              </label>
              <button
                onClick={() => addFeature(programIndex)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Feature
              </button>
            </div>
            <div className="space-y-2">
              {program.features?.map((feature, featureIndex) => (
                <div key={featureIndex} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleFeatureChange(programIndex, featureIndex, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeFeature(programIndex, featureIndex)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {programs.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <p className="text-gray-500">No programs yet. Click "Add Program" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default ProgramsEditor;
