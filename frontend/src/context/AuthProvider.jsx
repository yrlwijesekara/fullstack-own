import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { API_BASE_URL } from '../utils/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user data on mount using server-set httpOnly cookie
  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include', // Include httpOnly cookie
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        throw response;
      }
    } catch (error) {
      // Handle the error once here
      if (error && error.status === 401) {
        // User not authenticated, that's fine
        console.warn('Auth check failed (not logged in)');
        setUser(null);
      } else if (error && error.status) {
        // HTTP error from response
        console.error('Error fetching user:', error.status, error.statusText);
        setUser(null);
      } else {
        // Network error
        console.error('Network error fetching user:', error);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Called after login/register — server sets httpOnly cookie; refresh user from /me
  const login = async (newToken, newUser) => {
    // optimistic update
    if (newUser) setUser(newUser);
    // refresh authoritative user data from server (cookie-based)
    await fetchUserData();
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return { success: true, message: data.message };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.message };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
