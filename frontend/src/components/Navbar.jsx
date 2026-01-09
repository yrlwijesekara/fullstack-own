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
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                <div
                  role="button"
                  onClick={() => navigate('/profile')}
                  className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center border-2 border-purple-400 cursor-pointer"
                  title="View profile"
                >
                  <span className="text-white font-bold text-sm">{((user.name || user.firstName || user.email || 'U').charAt(0)).toUpperCase()}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="px-4 py-2 text-purple-400 hover:text-purple-300 font-medium">
                Login
              </a>
              <a href="/register" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium">
                Register
              </a>
            </>
          )}
        </div>
      </div>

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