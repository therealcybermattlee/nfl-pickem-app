import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { ErrorBoundary, AccessibilityProvider, SkipNav } from './components';
import { MobileNavigationSystem } from './components/mobile';
import { useMobileViewport } from './hooks/useMobileNavigation';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

// Lazy load pages for better performance and code splitting
const HomePage = React.lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const GamesPage = React.lazy(() => import('./pages/GamesPage').then(module => ({ default: module.GamesPage })));
const LeaderboardPage = React.lazy(() => import('./pages/LeaderboardPage').then(module => ({ default: module.LeaderboardPage })));

// Loading component for suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex items-center space-x-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="text-gray-600">Loading...</span>
    </div>
  </div>
);

function App() {
  const { isMobile } = useMobileViewport();

  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <div className="min-h-screen bg-gray-50">
          <SkipNav />
          
          {/* PWA Install Prompt and Status */}
          <PWAInstallPrompt />
          
          {/* Show desktop navigation on desktop, mobile navigation system on mobile */}
          {!isMobile && <Navigation />}
          {isMobile && <MobileNavigationSystem />}
          
          <main 
            id="main-content" 
            className={`container mx-auto px-4 ${
              isMobile ? 'py-4' : 'py-8'
            }`}
            role="main"
            aria-label="Main content"
            style={{
              // Add top padding for mobile header
              paddingTop: isMobile ? '80px' : undefined
            }}
          >
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/games" element={<GamesPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}

export default App;