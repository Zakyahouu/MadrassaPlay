// ManagerClassPanel.jsx
import React, { useState } from 'react';
import ClassList from './ClassList';
import ClassCreateForm from './ClassCreateForm';
import ClassEditForm from './ClassEditForm';
import ClassDeleteButton from './ClassDeleteButton';
import StudentAssignForm from './StudentAssignForm';
import ClassPaymentStatus from './ClassPaymentStatus';

const ManagerClassPanel = () => {
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const handleClassSelected = (classId) => {
    setSelectedClassId(classId);
  };

  const handleRefresh = () => {
    setRefresh(r => !r);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Class Management</h2>
      <ClassCreateForm onCreated={handleRefresh} />
      <ClassList key={refresh} />
      {selectedClassId && (
        <div className="mt-6">
          <ClassEditForm classId={selectedClassId} onUpdated={handleRefresh} />
          <StudentAssignForm classId={selectedClassId} onAssigned={handleRefresh} />
          <ClassPaymentStatus classId={selectedClassId} />
          <ClassDeleteButton classId={selectedClassId} onDeleted={handleRefresh} />
        </div>
      )}
      {/* Add logic to select a class from ClassList and pass its ID to child components */}
    </div>
  );
};

export default ManagerClassPanel;
