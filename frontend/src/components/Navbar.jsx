import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import Logo from '../components/Logo';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentPath, setCurrentPath] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Track current path for active link highlighting
    setCurrentPath(window.location.pathname);
    
    const handlePathChange = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', handlePathChange);
    
    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const navTo = (path) => {
    setMobileOpen(false);
    navigate(path);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    toast.success('You have been successfully logged out.');
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  return (
    <nav className="bg-background-800 border-b border-secondary-400 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
            <Logo size={48} className="flex-shrink-0" />
            <div className="text-2xl font-bold text-text-primary">
              Enimate
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6 ml-8">
            <button
              onClick={() => navigate('/movies')}
              className={`font-medium transition uppercase tracking-wide text-sm ${
                isActive('/movies') 
                  ? 'text-secondary-300 border-b-2 border-secondary-300 pb-1' 
                  : 'text-text-primary hover:text-purple-400'
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => navigate('/cinemas')}
              className={`font-medium transition uppercase tracking-wide text-sm ${
                isActive('/cinemas') 
                  ? 'text-secondary-300 border-b-2 border-secondary-300 pb-1' 
                  : 'text-text-primary hover:text-purple-400'
              }`}
            >
              Cinemas
            </button>
            <button
              onClick={() => navigate('/concessions')}
              className={`font-medium transition uppercase tracking-wide text-sm ${
                isActive('/concessions') 
                  ? 'text-secondary-300 border-b-2 border-secondary-300 pb-1' 
                  : 'text-text-primary hover:text-purple-400'
              }`}
            >
              Concessions
            </button>
            {user && user.role === 'admin' && (
              <button
                onClick={() => navigate('/admin-dashboard')}
                className={`font-medium transition uppercase tracking-wide text-sm ${
                  isActive('/admin-dashboard') 
                    ? 'text-secondary-300 border-b-2 border-secondary-300 pb-1' 
                    : 'text-text-primary hover:text-purple-400'
                }`}
              >
                Admin
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle (visible on small screens) */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-md text-text-primary hover:bg-secondary-700"
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {user ? (
            <>
              <div className="flex items-center gap-3">
                <div
                  role="button"
                  onClick={() => navigate('/profile')}
                  className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center border-2 border-purple-400 cursor-pointer hover:bg-purple-700 transition"
                  title="View profile"
                >
                  <span className="text-white font-bold text-sm">{((user.name || user.firstName || user.email || 'U').charAt(0)).toUpperCase()}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium shadow-lg"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg transition font-medium shadow-lg"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition font-medium shadow-lg"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu (small screens) */}
      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 border-t border-secondary-400">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navTo('/movies')}
              className={`w-full text-left font-medium transition uppercase tracking-wide text-sm ${isActive('/movies') ? 'text-secondary-300' : 'text-text-primary hover:text-purple-400'}`}
            >
              Movies
            </button>
            <button
              onClick={() => navTo('/cinemas')}
              className={`w-full text-left font-medium transition uppercase tracking-wide text-sm ${isActive('/cinemas') ? 'text-secondary-300' : 'text-text-primary hover:text-purple-400'}`}
            >
              Cinemas
            </button>
            <button
              onClick={() => navTo('/concessions')}
              className={`w-full text-left font-medium transition uppercase tracking-wide text-sm ${isActive('/concessions') ? 'text-secondary-300' : 'text-text-primary hover:text-purple-400'}`}
            >
              Concessions
            </button>
            {user && user.role === 'admin' && (
              <button
                onClick={() => navTo('/admin-dashboard')}
                className={`w-full text-left font-medium transition uppercase tracking-wide text-sm ${isActive('/admin-dashboard') ? 'text-secondary-300' : 'text-text-primary hover:text-purple-400'}`}
              >
                Admin
              </button>
            )}

            <div className="pt-2">
              {user ? (
                <div className="flex flex-col gap-2">
                  <button onClick={() => { setMobileOpen(false); navigate('/profile'); }} className="w-full text-left px-3 py-2 bg-purple-600 text-white rounded-md">Profile</button>
                  <button onClick={() => { setMobileOpen(false); handleLogout(); }} className="w-full text-left px-3 py-2 bg-red-600 text-white rounded-md">Logout</button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button onClick={() => navTo('/login')} className="w-full text-left px-3 py-2 bg-secondary-500 text-white rounded-md">Login</button>
                  <button onClick={() => navTo('/register')} className="w-full text-left px-3 py-2 bg-primary-500 text-white rounded-md">Register</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        confirmText="Yes, Logout"
        theme="default"
      />
    </nav>
  );
}