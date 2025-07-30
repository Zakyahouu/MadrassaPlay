import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Import both of our providers
import { AuthProvider } from './context/AuthContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import { TemplateProvider } from './context/TemplateContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <TemplateProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </TemplateProvider>
    </AuthProvider>
  </React.StrictMode>,
)
