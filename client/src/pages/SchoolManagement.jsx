import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AssignPrincipalForm from '../components/admin/AssignPrincipalForm'; // This is correct, as only admin can assign a principal
import StaffList from '../components/manager/StaffList';
import StaffManagement from '../components/manager/StaffManagement';
import GradeSystemManager from '../components/manager/GradeSystemManager';
import ClassManager from '../components/manager/ClassManager';

const SchoolManagement = () => {
  const { schoolId } = useParams();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSchoolDetails();
  }, [schoolId]);

  const fetchSchoolDetails = async () => {
    try {
      const response = await axios.get(`/api/schools/${schoolId}`);
      setSchool(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch school details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading school details...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!school) return <div className="p-8">School not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/admin/dashboard" className="text-blue-600 hover:underline">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">{school.name}</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">School Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Address</p>
              <p>{school.address?.street}</p>
              <p>{school.address?.city}, {school.address?.state}</p>
              <p>{school.address?.country} {school.address?.postalCode}</p>
            </div>
            <div>
              <p className="text-gray-600">Contact</p>
              <p>Phone: {school.contact?.phone}</p>
              <p>Email: {school.contact?.email}</p>
            </div>
          </div>
        </div>

        {!school.principal ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <AssignPrincipalForm 
              schoolId={schoolId} 
              onSuccess={fetchSchoolDetails} 
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Principal</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{school.principal.name}</p>
                <p className="text-gray-600">{school.principal.email}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <GradeSystemManager schoolId={schoolId} />
        </div>

        <div className="mb-6">
          <ClassManager schoolId={schoolId} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <StaffManagement 
            schoolId={schoolId} 
            onUpdate={fetchSchoolDetails} 
          />
          <StaffList 
            staff={school.staff} 
            schoolId={schoolId}
            onUpdate={fetchSchoolDetails}
          />
        </div>
      </div>
    </div>
  );
};

export default SchoolManagement;

