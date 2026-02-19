// client/src/App.jsx
import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { ToastProvider } from './components/shared/ToastProvider';
import { LanguageProvider } from './context/LanguageContext';
import LanguageTransitionOverlay from './components/shared/LanguageTransitionOverlay';
import './styles/language-transitions.css';

// Import all our page and helper components
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import TutorialVideo from './pages/TutorialVideo';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ManagerDashboardPage from './pages/ManagerDashboard';
import ManagerPasswordReset from './pages/ManagerPasswordReset';
import Finance from './pages/Finance';
import CreateGame from './pages/CreateGame';
import EditGame from './pages/EditGame';
import PlayGame from './pages/PlayGame';
import ViewResults from './components/teacher/ViewResults';
import HostLobby from './pages/HostLobby';
import PlayerLobby from './pages/PlayerLobby';
import TeacherLiveSessions from './components/teacher/TeacherLiveSessions';
import TeacherLiveSessionSummary from './components/teacher/TeacherLiveSessionSummary';
import ResultDetail from './components/teacher/ResultDetail';
import Profile from './pages/Profile';
import SharedModelViewer from './pages/SharedModelViewer';
import FullScreenModelViewer from './pages/FullScreenModelViewer';
import ProtectedRoute from './components/ProtectedRoute';
import GameAnalyticsDashboard from './components/analytics/GameAnalyticsDashboard';
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
              {/* Route 1: The Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* Tutorial Video Page */}
              <Route path="/tutorial" element={<TutorialVideo />} />

              {/* Route 2: The Login Page */}
              <Route
                path="/login"
                element={user ? <RoleBasedRedirect /> : <Login />}
              />

              {/* Route 3: Dashboard redirect for authenticated users */}
              <Route path="/dashboard" element={<RoleBasedRedirect />} />

              {/* Route 4: The Admin Dashboard */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
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

              {/* Route 7: The Manager Dashboard */}
              <Route
                path="/manager/dashboard"
                element={
                  <ProtectedRoute>
                    <ManagerDashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/manager/password-reset"
                element={
                  <ProtectedRoute>
                    <ManagerPasswordReset />
                  </ProtectedRoute>
                }
              />

<<<<<<< Updated upstream
          {/* Route 9: The Create Game Page */}
          <Route
            path="/teacher/create-game/:templateId"
            element={
              <ProtectedRoute>
                <CreateGame />
              </ProtectedRoute>
            }
          />
=======
              {/* Route 8: The Finance Page (Manager only) */}
              <Route
                path="/manager/finance"
                element={
                  <ProtectedRoute>
                    <Finance />
                  </ProtectedRoute>
                }
              />

              {/* Route 8.1: Landing Page Builder (Manager only) */}
              <Route
                path="/manager/landing-page-builder"
                element={
                  <ProtectedRoute>
                    <LandingPageBuilder />
                  </ProtectedRoute>
                }
              />

              {/* Route 8.2: Inquiries Manager (Manager only) */}
              <Route
                path="/manager/inquiries"
                element={
                  <ProtectedRoute>
                    <InquiriesManager />
                  </ProtectedRoute>
                }
              />
>>>>>>> Stashed changes

              {/* Route 9: The Create Game Page */}
              <Route
                path="/teacher/create-game/:templateId"
                element={
                  <ProtectedRoute>
                    <CreateGame />
                  </ProtectedRoute>
                }
              />

              {/* Route 10: The Edit Game Page */}
              <Route
                path="/teacher/edit-game/:creationId"
                element={
                  <ProtectedRoute>
                    <EditGame />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/edit-game/:creationId"
                element={
                  <ProtectedRoute>
                    <EditGame />
                  </ProtectedRoute>
                }
              />

              {/* Route 11: The Play Game Page */}
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

              {/* Route 12: The View Results Page */}
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

              {/* Route 13: The Host Lobby Page */}
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

              {/* Route 14: The Player Lobby Page */}
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

<<<<<<< Updated upstream
          {/* Shared Model Viewer - Public route (no authentication required) */}
          <Route
            path="/shared/:authKey"
            element={<SharedModelViewer />}
          />
          {/* Full-screen 3D Model viewer (authenticated via underlying API token) */}
          <Route
            path="/viewer/:modelId"
            element={<FullScreenModelViewer />}
          />
        </Routes>
=======
              {/* Profile Route - Unified for all roles */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Shared Model Viewer - Public route (no authentication required) */}
              <Route
                path="/shared/:authKey"
                element={<SharedModelViewer />}
              />

              {/* Public School Landing Pages - Two routes for compatibility */}
              <Route path="/school/:schoolId" element={<PublicSchoolLandingPage />} />
              <Route path="/school/:schoolId/legacy" element={<PublicSchoolPage />} />

              {/* Full-screen 3D Model viewer (authenticated via underlying API token) */}
              <Route
                path="/viewer/:modelId"
                element={<FullScreenModelViewer />}
              />
            </Routes>
>>>>>>> Stashed changes
          </div>
        </Router>
      </ToastProvider>
    </LanguageProvider>
  );
}

export default App;
