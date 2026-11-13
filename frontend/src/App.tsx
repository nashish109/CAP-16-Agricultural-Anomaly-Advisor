
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

              {/* Authenticated application */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>

                  {/* Dashboard */}
                  <Route element={<ProtectedRoute path="/dashboard" />}>
                    <Route path="dashboard" element={<DashboardPage />} />
                  </Route>

                  {/* Farm and crop management */}
                  <Route element={<ProtectedRoute path="/farms" />}>
                    <Route path="farms" element={<FarmsPage />} />
                  </Route>

                  <Route element={<ProtectedRoute path="/fields" />}>
                    <Route path="fields" element={<FieldsPage />} />
                  </Route>

                  <Route element={<ProtectedRoute path="/crop-management" />}>
                    <Route path="crop-management" element={<CropManagementPage />} />
                  </Route>

                  {/* Dataset management */}
                  <Route element={<ProtectedRoute path="/dataset-upload" />}>
                    <Route path="dataset-upload" element={<DatasetUploadPage />} />
                  </Route>

                  <Route element={<ProtectedRoute path="/data-quality" />}>
                    <Route path="data-quality" element={<DataQualityPage />} />
                  </Route>

                  {/* Crop intelligence */}
                  <Route element={<ProtectedRoute path="/crop-predictions" />}>
                    <Route path="crop-predictions" element={<CropPredictionsPage />} />
                  </Route>

                  {/* Analytics and reporting */}
                  <Route element={<ProtectedRoute path="/alerts" />}>
                    <Route path="alerts" element={<AlertsPage />} />
                  </Route>

                  <Route element={<ProtectedRoute path="/reports" />}>
                    <Route path="reports" element={<ReportsPage />} />
                  </Route>

                  {/* Account settings */}
                  <Route element={<ProtectedRoute path="/settings" />}>
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>

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
