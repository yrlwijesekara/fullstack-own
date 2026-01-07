import { useContext, useEffect, useState } from 'react';
import { AuthContext } from './context/AuthContext';
import { AuthProvider } from './context/AuthProvider';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Movies from './pages/Movies';

function AppContent() {
  const { loading } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    // Simple routing based on URL
    const handleRouteChange = () => {
      const path = window.location.pathname;
      if (path === '/login') setCurrentPage('login');
        else if (path === '/register') setCurrentPage('register');
        else if (path === '/profile') setCurrentPage('profile');
        else if (path === '/movies') setCurrentPage('movies');
        else setCurrentPage('home');
    };

    handleRouteChange();
    window.addEventListener('popstate', handleRouteChange);

    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  // Override history for navigation
  useEffect(() => {
    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args);
      const newPath = args[2];
      if (newPath === '/login') setCurrentPage('login');
      else if (newPath === '/register') setCurrentPage('register');
      else if (newPath === '/profile') setCurrentPage('profile');
      else if (newPath === '/movies') setCurrentPage('movies');
      else setCurrentPage('home');
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-900">
        <div className="text-2xl text-text-primary">Loading...</div>
      </div>
    );
  }

  // Show all pages - home is public, login/register for auth
  return (
    <>
      {currentPage === 'login' && <Login />}
      {currentPage === 'register' && <Register />}
      {currentPage === 'movies' && <Movies />}
      {currentPage === 'profile' && <Profile />}
      {currentPage === 'home' && <Home />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
