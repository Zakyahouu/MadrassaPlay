// client/src/App.jsx
import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { ToastProvider } from './components/shared/ToastProvider';
import { LanguageProvider } from './context/LanguageContext';
import LanguageTransitionOverlay from './components/shared/LanguageTransitionOverlay';
import './styles/language-transitions.css';

// Import all our page and helper components
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ManagerDashboardPage from './pages/ManagerDashboard';
import Finance from './pages/Finance';
import CreateGame from './pages/CreateGame';
import PlayGame from './pages/PlayGame';
import ViewResults from './components/teacher/ViewResults';
import HostLobby from './pages/HostLobby';
import PlayerLobby from './pages/PlayerLobby';
import TeacherLiveSessions from './components/teacher/TeacherLiveSessions';
import TeacherLiveSessionSummary from './components/teacher/TeacherLiveSessionSummary';
import ResultDetail from './components/teacher/ResultDetail';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRedirect from './components/RoleBasedRedirect';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <LanguageProvider>
      <ToastProvider>
        <Router>
          <div className="App">
            <LanguageTransitionOverlay />
            <Routes>
          {/* Route 1: The Login Page */}
          <Route 
            path="/login" 
            element={user ? <RoleBasedRedirect /> : <Login />} 
          />

          {/* Route 2: The Home/Redirect Page */}
          <Route path="/" element={<RoleBasedRedirect />} />

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

          {/* Route 6.1: The Finance Page (Manager only) */}
          <Route
            path="/manager/finance"
            element={
              <ProtectedRoute>
                <Finance />
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
            path="/admin/play-game/:creationId"
            element={
              <ProtectedRoute>
                <PlayGame />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/play-game/:creationId"
            element={
              <ProtectedRoute>
                <PlayGame />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/play-game/:creationId"
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

          {/* Detailed result page (teacher/admin) */}
          <Route
            path="/teacher/result/:resultId"
            element={
              <ProtectedRoute>
                <ResultDetail />
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
          <Route
            path="/teacher/host-lobby/session/:sessionId"
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

          {/* Live Sessions */}
          <Route
            path="/teacher/live-sessions"
            element={
              <ProtectedRoute>
                <Navigate to="/teacher/dashboard?tab=live-sessions" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/live-sessions/:id"
            element={
              <ProtectedRoute>
                <TeacherLiveSessionSummary />
              </ProtectedRoute>
            }
          />

          {/* Profile Route - Unified for all roles */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
          </div>
        </Router>
      </ToastProvider>
    </LanguageProvider>
  );
}

export default App;
