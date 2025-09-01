import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const storedToken = localStorage.getItem('token');
    const userDataStr = localStorage.getItem('userData');
    
    if (storedToken && userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        setCurrentUser(userData);
        setToken(storedToken);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
      }
    }
    
    setLoading(false);
  }, []);

  const login = (data) => {
    const { user, token } = data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('userData', JSON.stringify(user));
    
    setCurrentUser(user);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setCurrentUser(null);
    setToken(null);
  };

  // Function to update user data after profile update
  const updateUser = (userData) => {
    if (!currentUser) return false;
    
    // Merge new data with existing user data
    const updatedUser = { ...currentUser, ...userData };
    
    // Update localStorage
    localStorage.setItem('userData', JSON.stringify(updatedUser));
    
    // Update state
    setCurrentUser(updatedUser);
    
    return true;
  };

  // Function to get auth header for API requests
  const getAuthHeader = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    updateUser,
    getAuthHeader,
    isAuthenticated: !!currentUser,
    token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext; 