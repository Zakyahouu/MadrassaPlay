import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 1. Import the AuthProvider we just created.
import { AuthProvider } from './context/AuthContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Wrap the entire App component with the AuthProvider. */}
    {/* Now, every component inside App will have access to the user's session. */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
