
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'

import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import FarmsPage from './pages/FarmsPage'
import FieldsPage from './pages/FieldsPage'
import CropManagementPage from './pages/CropManagementPage'
import DatasetUploadPage from './pages/DatasetUploadPage'
import DataQualityPage from './pages/DataQualityPage'
import CropPredictionsPage from './pages/CropPredictionsPage'
import AlertsPage from './pages/AlertsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Public marketing site */}
              <Route element={<PublicLayout />}>
                <Route index element={<LandingPage />} />
              </Route>

              {/* Authentication */}
              <Route
                path="/login"
                element={
                  <PublicOnly>
                    <LoginPage />
                  </PublicOnly>
                }
              />

              <Route
                path="/register"
                element={
                  <PublicOnly>
                    <RegisterPage />
                  </PublicOnly>
                }
              />

              {/* Protected application */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="farms" element={<FarmsPage />} />
                  <Route path="fields" element={<FieldsPage />} />
                  <Route path="crop-management" element={<CropManagementPage />} />

                  {/* CAP-16 Dataset Management */}
                  <Route
                    path="dataset-upload"
                    element={<DatasetUploadPage />}
                  />

                  {/* CAP-16 Data Quality */}
                  <Route
                    path="data-quality"
                    element={<DataQualityPage />}
                  />

                  {/* Existing routes retained */}
                  <Route path="crop-predictions" element={<CropPredictionsPage />} />
                  <Route path="alerts" element={<AlertsPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
