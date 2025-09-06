import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { TeamsPage } from './pages/TeamsPage';
import { GamesPage } from './pages/GamesPage';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/games" element={<GamesPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;