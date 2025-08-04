// client/src/App.jsx
import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// Import all our page and helper components
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ManagerDashboardPage from './pages/ManagerDashboard';
import CreateGame from './pages/CreateGame';
import PlayGame from './pages/PlayGame';
import ViewResults from './pages/ViewResults';
import HostLobby from './pages/HostLobby';
import PlayerLobby from './pages/PlayerLobby'; // 1. Import the new page
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRedirect from './components/RoleBasedRedirect';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        {/* Route 1: The Login Page */}
        <Route 
          path="/login" 
          element={
            user ? <RoleBasedRedirect /> : <Login />
          } 
        />

        {/* Route 2: The Home/Redirect Page */}
        <Route 
          path="/" 
          element={<RoleBasedRedirect />} 
        />

        {/* Route 3: The Admin Dashboard */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Route 4: The Teacher Dashboard */}
        <Route 
          path="/teacher/dashboard" 
          element={
            <ProtectedRoute>
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Route 5: The Student Dashboard */}
        <Route 
          path="/student/dashboard" 
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Route 6: The Manager Dashboard */}
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute>
              <ManagerDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Route 6: The Create Game Page */}
        <Route
          path="/teacher/create-game/:templateId"
          element={
            <ProtectedRoute>
              <CreateGame />
            </ProtectedRoute>
          }
        />

        {/* Route 7: The Play Game Page */}
        <Route
          path="/teacher/play-game/:creationId"
          element={
            <ProtectedRoute>
              <PlayGame />
            </ProtectedRoute>
          }
        />

        {/* Route 8: The View Results Page */}
        <Route
          path="/teacher/results/:gameCreationId"
          element={
            <ProtectedRoute>
              <ViewResults />
            </ProtectedRoute>
          }
        />

        {/* Route 9: The Host Lobby Page */}
        <Route
          path="/teacher/host-lobby/:gameCreationId"
          element={
            <ProtectedRoute>
              <HostLobby />
            </ProtectedRoute>
          }
        />

        {/* 10. NEW ROUTE: The Player Lobby Page */}
        <Route
          path="/student/lobby/:roomCode"
          element={
            <ProtectedRoute>
              <PlayerLobby />
            </ProtectedRoute>
          }
        />

        {/* Add this new route for admin game testing */}
        <Route
          path="/admin/play-game/:creationId"
          element={
            <ProtectedRoute>
              <PlayGame />
            </ProtectedRoute>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;

