import { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from '../../hooks/useNavigate';
import { toast } from 'react-toastify';
import Modal from '../../components/Modal';
import Navbar from '../../components/Navbar';
import Logo from '../../components/Logo';

export default function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    toast.success('You have been successfully logged out.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-surface-600 rounded-2xl shadow-2xl p-8 border border-surface-400/40">
            <div className="flex items-center justify-center mb-6">
              <Logo size={64} className="bg-transparent shadow-none border-0" />
            </div>
            <h1 className="text-3xl font-bold text-secondary-400 mb-6 text-center">
              Admin Dashboard
            </h1>
            <p className="text-text-secondary text-center mb-8">
              Welcome, {user?.firstName} {user?.lastName}! You are logged in as an administrator.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Admin functions can be added here */}
              <div className="bg-surface-500 p-6 rounded-xl border border-secondary-400/40 hover:border-primary-500 transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-2">Manage Movies</h3>
                <p className="text-text-secondary mb-4">Add, edit, or remove movies from the system.</p>
                <button
                  onClick={() => navigate('/movies')}
                  className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-colors"
                >
                  Go to Movies
                </button>
              </div>

              <div className="bg-surface-500 p-6 rounded-xl border border-secondary-400/40 hover:border-primary-500 transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-2">Manage Halls</h3>
                <p className="text-text-secondary mb-4">Configure cinema halls and seating arrangements.</p>
                <button
                  onClick={() => navigate('/halls')}
                  className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-colors"
                >
                  Go to Halls
                </button>
              </div>

              <div className="bg-surface-500 p-6 rounded-xl border border-secondary-400/40 hover:border-primary-500 transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-2">Manage Showtimes</h3>
                <p className="text-text-secondary mb-4">Schedule and manage movie showtimes.</p>
                <button
                  onClick={() => navigate('/showtime-management')}
                  className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-colors"
                >
                  Go to Showtimes
                </button>
              </div>

              <div className="bg-surface-500 p-6 rounded-xl border border-secondary-400/40 hover:border-primary-500 transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-2">User Management</h3>
                <p className="text-text-secondary mb-4">View and manage user accounts.</p>
                <button
                  onClick={() => navigate('/user-management')}
                  className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-colors"
                >
                  Go to Users
                </button>
              </div>

              <div className="bg-surface-500 p-6 rounded-xl border border-secondary-400/40 hover:border-primary-500 transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-2">Reports</h3>
                <p className="text-text-secondary mb-4">View sales and performance reports.</p>
                <button
                  className="w-full py-2 bg-gray-500 text-white font-bold rounded-lg cursor-not-allowed"
                  disabled
                >
                  Coming Soon
                </button>
              </div>

              <div className="bg-surface-500 p-6 rounded-xl border border-secondary-400/40 hover:border-primary-500 transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-2">Settings</h3>
                <p className="text-text-secondary mb-4">Configure system settings.</p>
                <button
                  className="w-full py-2 bg-gray-500 text-white font-bold rounded-lg cursor-not-allowed"
                  disabled
                >
                  Coming Soon
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-semantic-error hover:bg-red-600 text-white font-bold rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
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
    </div>
  );
}