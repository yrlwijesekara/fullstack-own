import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user data on mount using server-set httpOnly cookie
  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5008/api/auth/me', {
        credentials: 'include', // Include httpOnly cookie
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
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
      await fetch('http://localhost:5008/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
