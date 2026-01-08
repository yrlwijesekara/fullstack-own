import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import Modal from '../components/Modal';
import Logo from '../components/Logo';
import { API_BASE_URL } from '../utils/api';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include', // Include cookies
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // JWT token is now in httpOnly cookie (set by backend)
      // Pass token and user to context
      login(data.token, data.user);
      
      // Show success modal
      const isAdmin = data.user.role === 'admin';
      setModalMessage(`🎉 Welcome back${isAdmin ? ', Admin' : ''}, ${data.user.firstName}! You have successfully logged in.`);
      setShowModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    // Navigate based on user role
    if (user?.role === 'admin') {
      navigate('/admin-dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-900 px-4 py-8">
      <div className="w-full max-w-md bg-surface-600 rounded-2xl shadow-2xl p-8 border border-surface-400/40">
        <div className="flex justify-center mb-6">
          <Logo size={96} className="bg-transparent shadow-none border-0" />
        </div>
        <h2 className="text-2xl font-bold text-secondary-400 mb-6 text-center">Login</h2>

        {error && (
          <div className="mb-4 p-3 bg-semantic-error text-white rounded-lg text-sm border border-semantic-error/60 animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-2 bg-surface-500 text-text-primary rounded-lg border border-secondary-400 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2 bg-surface-500 text-text-primary rounded-lg border border-secondary-400 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 mt-2 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-700/40 focus:outline-none focus:ring-2 focus:ring-accent-magenta focus:ring-offset-2 focus:ring-offset-background-900 relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center">
              {loading ? (
                <span className="animate-pulse">Logging in...</span>
              ) : (
                <>
                  Login
                  <svg className="w-5 h-5 ml-2 text-accent-gold group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8m0 0l-4-4m4 4l-4 4" /></svg>
                </>
              )}
            </span>
            {/* Neon animated border */}
            <span className="absolute inset-0 rounded-xl pointer-events-none group-hover:shadow-[0_0_16px_4px_#FF4AE0] group-focus:shadow-[0_0_16px_4px_#2AB7CA] transition-shadow duration-200" />
          </button>
        </form>

        <p className="text-center text-text-muted mt-4">
          Don't have an account?{' '}
          <a href="/register" className="text-accent-magenta hover:text-accent-blue font-medium underline underline-offset-2 transition-colors">
            Register here
          </a>
        </p>
      </div>
      {/* Success Modal */}
      <Modal
        isOpen={showModal}
        title="Login Successful"
        message={modalMessage}
        onClose={handleModalClose}
        confirmText="Go to Home"
        theme="success"
      />
    </div>
  );
}
