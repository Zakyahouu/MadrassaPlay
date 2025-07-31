// client/src/App.jsx
import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// Import all our page and helper components
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import CreateGame from './pages/CreateGame';
import PlayGame from './pages/PlayGame';
import ViewResults from './pages/ViewResults';
import HostLobby from './pages/HostLobby';
import PlayerLobby from './pages/PlayerLobby';
import SchoolManagement from './pages/SchoolManagement';
import AdminSchoolDetailsPage from './pages/AdminSchoolDetailsPage';
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
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />

        {/* Route 2: The Home/Redirect Page */}
        <Route 
          path="/" 
          element={user ? <RoleBasedRedirect /> : <Navigate to="/login" replace />} 
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

        {/* Route 4: The Manager Dashboard */}
        <Route 
          path="/manager/dashboard" 
          element={
            <ProtectedRoute>
              <ManagerDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Route 5: The Teacher Dashboard */}
        <Route 
          path="/teacher/dashboard" 
          element={
            <ProtectedRoute>
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Route 6: The Student Dashboard */}
        <Route 
          path="/student/dashboard" 
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Route 7: The Create Game Page */}
        <Route
          path="/teacher/create-game/:templateId"
          element={
            <ProtectedRoute>
              <CreateGame />
            </ProtectedRoute>
          }
        />

        {/* Route 8: The Play Game Page */}
        <Route
          path="/teacher/play-game/:creationId"
          element={
            <ProtectedRoute>
              <PlayGame />
            </ProtectedRoute>
          }
        />

        {/* Route 9: The View Results Page */}
        <Route
          path="/teacher/results/:gameCreationId"
          element={
            <ProtectedRoute>
              <ViewResults />
            </ProtectedRoute>
          }
        />

        {/* Route 10: The Host Lobby Page */}
        <Route
          path="/teacher/host-lobby/:gameCreationId"
          element={
            <ProtectedRoute>
              <HostLobby />
            </ProtectedRoute>
          }
        />

        {/* Route 11: The Player Lobby Page */}
        <Route
          path="/student/lobby/:roomCode"
          element={
            <ProtectedRoute>
              <PlayerLobby />
            </ProtectedRoute>
          }
        />

        {/* Route 12: School Management Page */}
        <Route
          path="/admin/schools/:schoolId"
          element={
            <ProtectedRoute>
              <SchoolManagement />
            </ProtectedRoute>
          }
        />

        {/* Route 13: Admin Play Game */}
        <Route
          path="/admin/play-game/:creationId"
          element={
            <ProtectedRoute>
              <PlayGame />
            </ProtectedRoute>
          }
        />

        {/* Route 14: Admin Results */}
        <Route
          path="/admin/results/:gameCreationId"
          element={
            <ProtectedRoute>
              <ViewResults />
            </ProtectedRoute>
          }
        />

        {/* Add this new route for admin to view/edit school details */}
        <Route
          path="/admin/schools/:schoolId/details"
          element={
            <ProtectedRoute>
              <AdminSchoolDetailsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
