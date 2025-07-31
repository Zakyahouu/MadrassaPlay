import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

// Set the base URL for all axios requests
axios.defaults.baseURL = 'http://localhost:5000';

export const ManagerContext = createContext();

export const ManagerProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [schoolId, setSchoolId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchManagerSchool = async () => {
      // Skip if no user or not a staff/principal
      if (!user || !(user.role === 'staff' || user.role === 'principal')) {
        setLoading(false);
        return;
      }

      try {
        // If school is already in user object, use that
        if (user.school && typeof user.school === 'string') {
          setSchoolId(user.school);
          setLoading(false);
          return;
        }
        
        // If school is an object with _id, use that
        if (user.school && user.school._id) {
          setSchoolId(user.school._id);
          setLoading(false);
          return;
        }

        // Otherwise fetch manager's school data with auth token
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        };
        
        const response = await axios.get('/api/users/me', config);
        
        if (response.data.school) {
          // Handle both string ID and object with _id
          const id = typeof response.data.school === 'string' 
            ? response.data.school 
            : response.data.school._id;
          setSchoolId(id);
        }
      } catch (err) {
        console.error('Error fetching manager data:', err);
        setError('Failed to fetch manager school data');
      } finally {
        setLoading(false);
      }
    };

    fetchManagerSchool();
  }, [user]);

  return (
    <ManagerContext.Provider value={{ schoolId, loading, error }}>
      {children}
    </ManagerContext.Provider>
  );
};

export const useManager = () => useContext(ManagerContext);
