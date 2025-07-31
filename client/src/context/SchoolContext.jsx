import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

export const SchoolContext = createContext();

export const SchoolProvider = ({ children }) => {
  const [schools, setSchools] = useState([]);
  const [currentSchool, setCurrentSchool] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/schools');
      setSchools(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch schools');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolDetails = async (schoolId) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/schools/${schoolId}`);
      setCurrentSchool(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch school details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SchoolContext.Provider 
      value={{ 
        schools, 
        currentSchool, 
        loading, 
        error, 
        fetchSchools, 
        fetchSchoolDetails 
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => useContext(SchoolContext);
