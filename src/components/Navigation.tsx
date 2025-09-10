import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Navigation() {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-primary">
            NFL Pick'em
          </Link>
          
          <div className="flex space-x-8">
            <Link
              to="/"
              className={`${
                isActive('/') 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-primary'
              } px-3 py-2 transition-colors`}
            >
              Home
            </Link>
            <Link
              to="/games"
              className={`${
                isActive('/games') 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-primary'
              } px-3 py-2 transition-colors`}
            >
              Games
            </Link>
            <Link
              to="/leaderboard"
              className={`${
                isActive('/leaderboard') 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-primary'
              } px-3 py-2 transition-colors`}
            >
              Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}