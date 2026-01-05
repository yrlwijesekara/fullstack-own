import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import Logo from '../components/Logo';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-background-800 border-b border-secondary-400 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Logo size={48} className="flex-shrink-0" />
          <div className="text-2xl font-bold text-text-primary">
            Enimate
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
    </nav>
  );
}