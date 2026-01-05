import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import BackButton from '../components/BackButton';

export default function Profile() {
  const { user, logout, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div>Please login to view your profile.</div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = () => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setIsEditing(true);
    setMessage('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setMessage('');
  };

  const handleSave = async () => {
    // Validation
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    if (formData.newPassword && !formData.currentPassword) {
      setMessage('Current password is required to change password');
      return;
    }

    setLoading(true);
    setMessage('');

    const updateData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
    };

    if (formData.newPassword) {
      updateData.currentPassword = formData.currentPassword;
      updateData.newPassword = formData.newPassword;
    }

    const result = await updateProfile(updateData);

    setLoading(false);

    if (result.success) {
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } else {
      setMessage(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-background-900 text-text-primary">
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-10 md:static md:relative">
        <BackButton variant="round" />
      </div>

      <div className="max-w-4xl mx-auto p-8 pt-20 md:pt-8">
        {/* Header */}
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-secondary-500 flex items-center justify-center border-4 border-secondary-300 text-3xl font-bold shadow-lg">
            {((user.name || user.firstName || user.email || 'U').charAt(0)).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-secondary-300">
              {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.name || user.email}
            </h1>
            <p className="text-text-secondary text-lg">{user.email}</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-purple-500/30 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-purple-300">Account Details</h2>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors duration-200 shadow-lg"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors duration-200"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors duration-200 shadow-lg"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${message.includes('success') ? 'bg-semantic-success/20 border border-semantic-success/50 text-semantic-success' : 'bg-semantic-error/20 border border-semantic-error/50 text-semantic-error'}`}>
              {message}
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent text-text-primary placeholder-text-muted transition-all duration-200"
                  placeholder="Enter first name"
                />
              ) : (
                <div className="px-4 py-3 bg-surface-500/50 border border-surface-400 rounded-lg text-text-primary">
                  {user.firstName || '-'}
                </div>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent text-text-primary placeholder-text-muted transition-all duration-200"
                  placeholder="Enter last name"
                />
              ) : (
                <div className="px-4 py-3 bg-surface-500/50 border border-surface-400 rounded-lg text-text-primary">
                  {user.lastName || '-'}
                </div>
              )}
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
              <div className="px-4 py-3 bg-surface-500/30 border border-surface-400 rounded-lg text-text-muted cursor-not-allowed">
                {user.email}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent text-text-primary placeholder-text-muted transition-all duration-200"
                  placeholder="Enter phone number"
                />
              ) : (
                <div className="px-4 py-3 bg-surface-500/50 border border-surface-400 rounded-lg text-text-primary">
                  {user.phone || '-'}
                </div>
              )}
            </div>
          </div>

          {/* Password Section */}
          {isEditing && (
            <div className="mt-8 pt-6 border-t border-surface-400">
              <h3 className="text-lg font-semibold text-secondary-300 mb-4">Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent text-text-primary placeholder-text-muted transition-all duration-200"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent text-text-primary placeholder-text-muted transition-all duration-200"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent text-text-primary placeholder-text-muted transition-all duration-200"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-lg font-medium transition-colors duration-200 shadow-lg"
            >
              ← Back to Home
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-semantic-error hover:bg-semantic-error/80 rounded-lg font-medium transition-colors duration-200 shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
