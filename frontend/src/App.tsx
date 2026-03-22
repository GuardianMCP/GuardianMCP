import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuthStore } from '@/stores/auth.store';

const LandingPage = lazy(() => import('@/pages/landing/LandingPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const OnboardingPage = lazy(() => import('@/pages/onboarding/OnboardingPage'));
const AppLayout = lazy(() => import('@/components/layout/AppLayout'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const ServersListPage = lazy(() => import('@/pages/servers/ServersListPage'));
const ServerDetailPage = lazy(() => import('@/pages/servers/ServerDetailPage'));
const ScansListPage = lazy(() => import('@/pages/scans/ScansListPage'));
const ScanDetailPage = lazy(() => import('@/pages/scans/ScanDetailPage'));
const FindingsPage = lazy(() => import('@/pages/findings/FindingsPage'));
const AlertsPage = lazy(() => import('@/pages/alerts/AlertsPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/servers" element={<ServersListPage />} />
          <Route path="/servers/:serverId" element={<ServerDetailPage />} />
          <Route path="/scans" element={<ScansListPage />} />
          <Route path="/scans/:scanId" element={<ScanDetailPage />} />
          <Route path="/findings" element={<FindingsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
