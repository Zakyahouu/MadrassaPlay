// ManagerDashboard.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import ManagerClassPanel from './ManagerClassPanel';
import ManagerSchoolPanel from './ManagerSchoolPanel';

const ManagerDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Manager Dashboard</h2>
        <button
          onClick={logout}
          className="px-4 py-2 font-semibold text-sm text-white bg-red-600 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </header>
      <ManagerClassPanel />
      <ManagerSchoolPanel />
    </div>
  );
};

export default ManagerDashboard;
