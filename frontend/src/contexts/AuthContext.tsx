import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../services/api';
import { socketService } from '../services/socket';

interface User {
  id: string;
  username: string;
  email: string;
  displayColor: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      socketService.connect(savedToken);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    const { access_token, user: userData } = response.data;
    
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    setToken(access_token);
    setUser(userData);
    socketService.connect(access_token);
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await authAPI.register({ username, email, password });
    const { access_token, user: userData } = response.data;
    
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    setToken(access_token);
    setUser(userData);
    socketService.connect(access_token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    socketService.disconnect();
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
