import React, { createContext, useState, useContext } from 'react';

export const TemplateContext = createContext();

export const TemplateProvider = ({ children }) => {
  const [templates, setTemplates] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const triggerTemplateUpdate = () => {
    setLastUpdate(Date.now());
  };

  return (
    <TemplateContext.Provider value={{ templates, setTemplates, lastUpdate, triggerTemplateUpdate }}>
      {children}
    </TemplateContext.Provider>
  );
};
