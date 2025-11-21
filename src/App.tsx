import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { ErrorBoundary, AccessibilityProvider, SkipNav, ThemeProvider } from './components';
import { MobileNavigationSystem } from './components/mobile';
import { useMobileViewport } from './hooks/useMobileNavigation';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Lazy load pages for better performance and code splitting
const HomePage = React.lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const GamesPage = React.lazy(() => import('./pages/GamesPage').then(module => ({ default: module.GamesPage })));
const LeaderboardPage = React.lazy(() => import('./pages/LeaderboardPage').then(module => ({ default: module.LeaderboardPage })));
const SignInPage = React.lazy(() => import('./pages/SignInPage').then(module => ({ default: module.SignInPage })));
const SignUpPage = React.lazy(() => import('./pages/SignUpPage').then(module => ({ default: module.SignUpPage })));

// Loading component for suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex items-center space-x-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="text-gray-600">Loading...</span>
    </div>
  </div>
);

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

function AppContent() {
  const { isMobile } = useMobileViewport();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SkipNav />

      {/* PWA Install Prompt and Status */}
      <PWAInstallPrompt />

      {/* Show navigation only when authenticated */}
      {isAuthenticated && (
        <>
          {!isMobile && <Navigation />}
          {isMobile && <MobileNavigationSystem />}
        </>
      )}

      <main
        id="main-content"
        className={`container mx-auto px-4 ${
          isMobile && isAuthenticated ? 'py-4' : 'py-8'
        }`}
        role="main"
        aria-label="Main content"
        style={{
          // Add top padding for mobile header when authenticated
          paddingTop: isMobile && isAuthenticated ? '80px' : undefined
        }}
      >
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games"
                element={
                  <ProtectedRoute>
                    <GamesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <LeaderboardPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AccessibilityProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;