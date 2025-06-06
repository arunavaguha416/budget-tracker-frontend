import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user');
    if (token && userId) {
      setUser({ token, user: userId });
    }
  }, []);

  const login = async (credentials) => {
    try {
      const response = await axios.post('https://budget-tracker-m261.onrender.com/api/auth/login/', credentials);
      const token = response.data.access;
      const refreshToken = response.data.token; // Store refresh token
      const user = response.data.user;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', user);
      setUser({ token, user });
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) throw new Error('No refresh token available');
      const response = await axios.post('https://budget-tracker-m261.onrender.com/api/token/refresh/', {
        refresh: refreshToken
      });
      const newAccessToken = response.data.access;
      localStorage.setItem('token', newAccessToken);
      setUser((prev) => ({ ...prev, token: newAccessToken }));
      return newAccessToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => React.useContext(AuthContext);