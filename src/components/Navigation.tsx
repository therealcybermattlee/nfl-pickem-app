import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export function Navigation() {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-foreground">
            NFL Pick'em
          </Link>
          
          <div className="flex items-center space-x-8">
            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-8" role="navigation" aria-label="Main navigation">
              <Link
                to="/"
                className={`${
                  isActive('/') 
                    ? 'text-brand border-b-2 border-brand' 
                    : 'text-muted-foreground hover:text-brand'
                } px-3 py-2 transition-colors`}
              >
                Home
              </Link>
              <Link
                to="/games"
                className={`${
                  isActive('/games') 
                    ? 'text-brand border-b-2 border-brand' 
                    : 'text-muted-foreground hover:text-brand'
                } px-3 py-2 transition-colors`}
              >
                Games
              </Link>
              <Link
                to="/leaderboard"
                className={`${
                  isActive('/leaderboard') 
                    ? 'text-brand border-b-2 border-brand' 
                    : 'text-muted-foreground hover:text-brand'
                } px-3 py-2 transition-colors`}
              >
                Leaderboard
              </Link>
            </nav>
            
            {/* Mobile Navigation Links */}
            <nav className="flex md:hidden space-x-4" role="navigation" aria-label="Mobile navigation">
              <Link
                to="/"
                className={`${
                  isActive('/') 
                    ? 'text-brand border-b-2 border-brand' 
                    : 'text-muted-foreground hover:text-brand'
                } px-2 py-2 text-sm transition-colors`}
              >
                Home
              </Link>
              <Link
                to="/games"
                className={`${
                  isActive('/games') 
                    ? 'text-brand border-b-2 border-brand' 
                    : 'text-muted-foreground hover:text-brand'
                } px-2 py-2 text-sm transition-colors`}
              >
                Games
              </Link>
              <Link
                to="/leaderboard"
                className={`${
                  isActive('/leaderboard') 
                    ? 'text-brand border-b-2 border-brand' 
                    : 'text-muted-foreground hover:text-brand'
                } px-2 py-2 text-sm transition-colors`}
              >
                Leaderboard
              </Link>
            </nav>
            
            {/* Theme Toggle - Always visible */}
            <ThemeToggle className="ml-4" />
          </div>
        </div>
      </div>
    </nav>
  );
}