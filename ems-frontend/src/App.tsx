import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProtocolsPage from "./pages/ProtocolsPage";
import MedicationsPage from "./pages/MedicationsPage";
import AIQueryPage from "./pages/AIQueryPage";
import AdminPage from "./pages/AdminPage";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes - accessible to all authenticated users */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/protocols"
              element={
                <ProtectedRoute>
                  <ProtocolsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/medications"
              element={
                <ProtectedRoute>
                  <MedicationsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ai-query"
              element={
                <ProtectedRoute>
                  <AIQueryPage />
                </ProtectedRoute>
              }
            />

            {/* Admin-only route */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;