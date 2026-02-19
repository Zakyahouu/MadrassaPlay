// client/src/components/manager/builder/editors/TeachersEditor.jsx

import React from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext';

const TeachersEditor = ({ data, onChange, showMessage }) => {
  const { t } = useLanguage();
  const teachers = data?.teachers || [];

  const handleTeacherChange = (index, field, value) => {
    const updatedTeachers = [...teachers];
    updatedTeachers[index] = { ...updatedTeachers[index], [field]: value };
    onChange({ ...data, teachers: updatedTeachers });
  };

  const handleSubjectChange = (teacherIndex, subjectIndex, value) => {
    const updatedTeachers = [...teachers];
    updatedTeachers[teacherIndex].subjects[subjectIndex] = value;
    onChange({ ...data, teachers: updatedTeachers });
  };

  const addTeacher = () => {
    onChange({
      ...data,
      teachers: [
        ...teachers,
        {
          name: t.newTeacherName || 'New Teacher',
          qualification: t.newTeacherQualification || 'M.Ed., B.Sc.',
          subjects: [t.newTeacherSubject || 'Subject 1', t.newTeacherSubject || 'Subject 2'],
          experience: '5+ ' + (t.year || 'years'),
          rating: '4.8',
          photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=300'
        }
      ]
    });
    showMessage(t.teacherAdded, 'success');
  };

  const removeTeacher = (index) => {
    const updatedTeachers = teachers.filter((_, i) => i !== index);
    onChange({ ...data, teachers: updatedTeachers });
    showMessage(t.teacherRemoved, 'success');
  };

  const addSubject = (teacherIndex) => {
    const updatedTeachers = [...teachers];
    updatedTeachers[teacherIndex].subjects.push(t.newTeacherSubject || 'New Subject');
    onChange({ ...data, teachers: updatedTeachers });
  };

  const removeSubject = (teacherIndex, subjectIndex) => {
    const updatedTeachers = [...teachers];
    updatedTeachers[teacherIndex].subjects = updatedTeachers[teacherIndex].subjects.filter((_, i) => i !== subjectIndex);
    onChange({ ...data, teachers: updatedTeachers });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t.teachersHeader}</h3>
          <p className="text-sm text-gray-600">{t.teachersHeaderDesc}</p>
        </div>
        <button
          onClick={addTeacher}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          {t.addTeacher}
        </button>
      </div>

      {teachers.map((teacher, teacherIndex) => (
        <div key={teacherIndex} className="border rounded-lg p-6 space-y-4 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">{t.teacherNameLabel || 'Teacher'} {teacherIndex + 1}</h4>
            <button
              onClick={() => removeTeacher(teacherIndex)}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.teacherNameLabel}</label>
              <input
                type="text"
                value={teacher.name}
                onChange={(e) => handleTeacherChange(teacherIndex, 'name', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.qualificationLabel}
              </label>
              <input
                type="text"
                value={teacher.qualification}
                onChange={(e) => handleTeacherChange(teacherIndex, 'qualification', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.experienceLabel}
              </label>
              <input
                type="text"
                value={teacher.experience}
                onChange={(e) => handleTeacherChange(teacherIndex, 'experience', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.ratingLabel}
              </label>
              <input
                type="text"
                value={teacher.rating}
                onChange={(e) => handleTeacherChange(teacherIndex, 'rating', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.photoUrlLabel}
            </label>
            <input
              type="text"
              value={teacher.photo}
              onChange={(e) => handleTeacherChange(teacherIndex, 'photo', e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">{t.photoUrlNote || 'Use the Media tab to upload images'}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {t.subjectsHeader}
              </label>
              <button
                onClick={() => addSubject(teacherIndex)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + {t.addSubject}
              </button>
            </div>
            <div className="space-y-2">
              {teacher.subjects?.map((subject, subjectIndex) => (
                <div key={subjectIndex} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => handleSubjectChange(teacherIndex, subjectIndex, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeSubject(teacherIndex, subjectIndex)}
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

      {teachers.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <p className="text-gray-500">{t.noTeachersYet}</p>
        </div>
      )}
    </div>
  );
};

export default TeachersEditor;
