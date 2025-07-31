import React from 'react';
import { useManager } from '../context/ManagerContext';
import GradeSystemManager from '../components/manager/GradeSystemManager';
import ClassManager from '../components/manager/ClassManager';
import StaffManager from '../components/manager/StaffManager';
import StudentManager from '../components/manager/StudentManager';

const ManagerDashboard = () => {
  const { schoolId, loading, error } = useManager();

  if (loading) return <div className="p-8">Loading school data...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!schoolId) return <div className="p-8">No school assigned to this manager account.</div>;

  console.log("School ID in ManagerDashboard:", schoolId); // Debug log

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">School Management</h1>
          <p className="text-sm text-gray-600">School ID: {schoolId}</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* School structure management */}
          <section className="mb-8">
            <GradeSystemManager schoolId={schoolId} />
          </section>

          {/* Class management */}
          <section className="mb-8">
            <ClassManager schoolId={schoolId} />
          </section>

          {/* Staff management */}
          <section className="mb-8">
            <StaffManager schoolId={schoolId} />
          </section>

          {/* Student management */}
          <section className="mb-8">
            <StudentManager schoolId={schoolId} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
