// ManagerPanel.jsx
import React, { useState } from 'react';
import ManagerCreateForm from './ManagerCreateForm';
import ManagerList from './ManagerList';
import ManagerDeleteButton from './ManagerDeleteButton';
import ManagerUpdateForm from './ManagerUpdateForm';

const ManagerPanel = ({ schoolId }) => {
  const [selectedManager, setSelectedManager] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const handleManagerSelected = (manager) => {
    setSelectedManager(manager);
  };

  const handleRefresh = () => {
    setRefresh(r => !r);
    setSelectedManager(null);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Manager Management</h2>
      <ManagerCreateForm schoolId={schoolId} onCreated={handleRefresh} />
      <ManagerList schoolId={schoolId} key={refresh} onSelect={handleManagerSelected} />
      {selectedManager && (
        <div className="mt-6">
          <ManagerUpdateForm schoolId={schoolId} manager={selectedManager} onUpdated={handleRefresh} />
          <ManagerDeleteButton schoolId={schoolId} managerId={selectedManager._id} onDeleted={handleRefresh} />
        </div>
      )}
    </div>
  );
};

export default ManagerPanel;
