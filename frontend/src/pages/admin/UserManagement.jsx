import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/api';
import Modal from '../../components/Modal';
import Navbar from '../../components/Navbar';
import BackButton from '../../components/BackButton';

export default function UserManagement() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userToDelete._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      setSuccess('User deleted successfully');
      setUsers(users.filter(u => u._id !== userToDelete._id));
      setShowDeleteModal(false);
      setUserToDelete(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setShowDeleteModal(false);
      setUserToDelete(null);

      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-xl text-text-primary">Loading users...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <BackButton />
              <h1 className="text-3xl font-bold text-secondary-400">User Management</h1>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-semantic-error text-white rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-600 text-white rounded-lg">
              {success}
            </div>
          )}

          <div className="bg-surface-600 rounded-2xl shadow-2xl overflow-hidden border border-surface-400/40">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-500">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Joined</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-500">
                  {users.map((userData) => (
                    <tr key={userData._id} className="hover:bg-surface-500/50">
                      <td className="px-6 py-4 text-sm text-text-primary">
                        {userData.firstName} {userData.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-primary">
                        {userData.email}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          userData.role === 'admin'
                            ? 'bg-purple-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}>
                          {userData.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-primary">
                        {userData.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {new Date(userData.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {userData.role !== 'admin' && userData._id !== user?.id && (
                          <button
                            onClick={() => handleDeleteClick(userData)}
                            className="px-3 py-1 bg-semantic-error hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-12">
                <p className="text-text-secondary">No users found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        title="Confirm Delete"
        message={`Are you sure you want to delete user "${userToDelete?.firstName} ${userToDelete?.lastName}" (${userToDelete?.email})? This action cannot be undone.`}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete User"
        cancelText="Cancel"
        theme="danger"
      />
    </div>
  );
}