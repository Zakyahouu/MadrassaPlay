import React from 'react';
import axios from 'axios';

const StaffList = ({ staff, schoolId, onUpdate }) => {
  const handleRemoveStaff = async (staffId) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      try {
        await axios.delete(`/api/schools/${schoolId}/staff/${staffId}`);
        onUpdate();
      } catch (err) {
        console.error('Failed to remove staff member:', err);
      }
    }
  };

  return (
    <div className="mt-4">
      <h4 className="text-lg font-medium mb-2">Current Staff</h4>
      <div className="bg-white rounded-lg shadow divide-y">
        {staff?.map(member => (
          <div key={member.user._id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{member.user.name}</p>
              <p className="text-sm text-gray-600">{member.role}</p>
            </div>
            <button
              onClick={() => handleRemoveStaff(member.user._id)}
              className="text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ))}
        {!staff?.length && (
          <p className="p-4 text-gray-500">No staff members found</p>
        )}
      </div>
    </div>
  );
};

export default StaffList;
