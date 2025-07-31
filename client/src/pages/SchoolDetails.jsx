import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const SchoolDetails = () => {
  const { schoolId } = useParams();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchoolDetails = async () => {
      try {
        const response = await axios.get(`/api/schools/${schoolId}`);
        setSchool(response.data);
      } catch (err) {
        console.error('Failed to fetch school details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchoolDetails();
  }, [schoolId]);

  const handleAssignPrincipal = async (formData) => {
    try {
      await axios.post(`/api/schools/${schoolId}/principal`, formData);
      // Refresh school details
      const response = await axios.get(`/api/schools/${schoolId}`);
      setSchool(response.data);
    } catch (err) {
      console.error('Failed to assign principal:', err);
    }
  };

  if (loading) return <div>Loading school details...</div>;
  if (!school) return <div>School not found</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">{school.name}</h2>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">School Management</h3>
        {/* Principal Assignment Form */}
        {!school.principal && (
          <form onSubmit={handleAssignPrincipal} className="space-y-4">
            {/* Principal assignment form fields */}
          </form>
        )}
        
        {/* Staff List */}
        <div className="mt-6">
          <h4 className="font-semibold mb-2">Staff Members</h4>
          {school.staff?.length > 0 ? (
            <ul className="divide-y">
              {school.staff.map(member => (
                <li key={member.user._id} className="py-2">
                  {member.user.name} - {member.role}
                </li>
              ))}
            </ul>
          ) : (
            <p>No staff members assigned</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchoolDetails;
