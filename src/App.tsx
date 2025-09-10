import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { GamesPage } from './pages/GamesPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ErrorBoundary, AccessibilityProvider, SkipNav } from './components';

function App() {
  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <div className="min-h-screen bg-gray-50">
          <SkipNav />
          <Navigation />
          <main 
            id="main-content" 
            className="container mx-auto px-4 py-8"
            role="main"
            aria-label="Main content"
          >
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/games" element={<GamesPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}

export default App;