import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ApiClient } from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
  tokenExpiresAt: number | null;
}

/**
 * Decode JWT token to extract expiration time
 * Returns expiration timestamp in seconds, or null if invalid
 */
function decodeJWT(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);

  // Helper function to set token and extract expiration
  const setAuthToken = useCallback((newToken: string) => {
    setToken(newToken);

    // Decode JWT to extract expiration
    const decoded = decodeJWT(newToken);
    if (decoded?.exp) {
      setTokenExpiresAt(decoded.exp);
    } else {
      setTokenExpiresAt(null);
    }
  }, []);

  // Sign out function with useCallback to prevent infinite loops
  const signOut = useCallback(() => {
    // Clear auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setTokenExpiresAt(null);
  }, []);

  // Register session expiration handler with ApiClient
  useEffect(() => {
    ApiClient.setSessionExpiredCallback(signOut);
  }, [signOut]);

  // Token expiration checking - check every minute
  useEffect(() => {
    if (!tokenExpiresAt) return;

    const checkTokenExpiration = () => {
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const timeUntilExpiration = tokenExpiresAt - now;

      // If token has expired, sign out immediately
      if (timeUntilExpiration <= 0) {
        console.warn('Token has expired. Signing out...');
        signOut();
        return;
      }

      // If token expires in less than 5 minutes, show warning
      const fiveMinutes = 5 * 60; // 5 minutes in seconds
      if (timeUntilExpiration <= fiveMinutes && timeUntilExpiration > 0) {
        const minutesRemaining = Math.ceil(timeUntilExpiration / 60);
        console.warn(`Token expires in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}. Please refresh your session.`);
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Set up interval to check every minute
    const intervalId = setInterval(checkTokenExpiration, 60 * 1000);

    return () => clearInterval(intervalId);
  }, [tokenExpiresAt, signOut]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setAuthToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Validate token by calling session endpoint
          await validateSession(storedToken);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear invalid session
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [setAuthToken]);

  const validateSession = async (authToken: string): Promise<void> => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const response = await fetch(`${apiBaseUrl}/api/auth/session`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Invalid session');
    }

    const data = await response.json();
    setUser(data.user);
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const response = await fetch(`${apiBaseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Sign in failed');
    }

    // Store auth data
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setAuthToken(data.token);
    setUser(data.user);
  };

  const signUp = async (email: string, password: string, name: string): Promise<void> => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    // Store auth data
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setAuthToken(data.token);
    setUser(data.user);
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!token && !!user,
    tokenExpiresAt,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
