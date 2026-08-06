import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/index.js';
import apiClient from '../services/apiClient.js';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (token: string, refreshToken: string, userProfile: UserProfile) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    const token = localStorage.getItem('theiakshi_access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data?.success) {
        setUser(res.data.data);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.warn('Failed to fetch user profile, clearing session');
      localStorage.removeItem('theiakshi_access_token');
      localStorage.removeItem('theiakshi_refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = (accessToken: string, refreshToken: string, userProfile: UserProfile) => {
    localStorage.setItem('theiakshi_access_token', accessToken);
    localStorage.setItem('theiakshi_refresh_token', refreshToken);
    setUser(userProfile);
  };

  const logout = () => {
    localStorage.removeItem('theiakshi_access_token');
    localStorage.removeItem('theiakshi_refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
