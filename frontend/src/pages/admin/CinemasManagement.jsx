import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/api';
import { toast } from 'react-toastify';
import Modal from '../../components/Modal';

// Helper function to get the correct image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // If it's already a full URL (B2), return as is
  if (imagePath.startsWith('http')) return imagePath;
  // Otherwise, prepend API_BASE_URL for local images
  return `${API_BASE_URL}${imagePath}`;
};

export default function CinemasManagement() {
  const navigate = useNavigate();
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cinemaToDelete, setCinemaToDelete] = useState(null);

  useEffect(() => {
    fetchCinemas();
  }, []);

  const fetchCinemas = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cinemas`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCinemas(data.data || []);
      } else {
        toast.error('Failed to fetch cinemas');
      }
    } catch (err) {
      console.error('Error fetching cinemas:', err);
      toast.error('Error fetching cinemas');
    }
  };

  const openCreateModal = () => {
    navigate('/admin-dashboard/cinemas/new');
  };

  const openEditModal = (cinema) => {
    navigate(`/admin-dashboard/cinemas/${cinema._id}/edit`);
  };

  const openDeleteModal = (cinema) => {
    setCinemaToDelete(cinema);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCinemaToDelete(null);
  };

  const confirmDeleteCinema = async () => {
    if (!cinemaToDelete) return;

    try {
      const res = await fetch(`${API_BASE_URL}/cinemas/${cinemaToDelete._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        toast.success('Cinema deleted successfully');
        fetchCinemas();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to delete cinema');
      }
    } catch (err) {
      console.error('Error deleting cinema:', err);
      toast.error('Error deleting cinema');
    } finally {
      closeDeleteModal();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary">Manage Cinemas</h2>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium"
        >
          Add Cinema
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cinemas.map((cinema) => (
          <div key={cinema._id} className="bg-surface-500 p-4 rounded-lg border border-surface-400/30">
            {cinema.image && (
              <img
                src={getImageUrl(cinema.image)}
                alt={cinema.name}
                className="w-full h-32 object-cover rounded mb-3"
              />
            )}
            <h3 className="text-lg font-semibold text-text-primary mb-2">{cinema.name}</h3>
            <p className="text-text-secondary text-sm mb-1"><strong>City:</strong> {cinema.city}</p>
            {cinema.address && <p className="text-text-secondary text-sm mb-1"><strong>Address:</strong> {cinema.address}</p>}
            {cinema.description && <p className="text-text-secondary text-sm mb-3"><strong>Description:</strong> {cinema.description}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(cinema)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => openDeleteModal(cinema)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {cinemas.length === 0 && !loading && (
        <p className="text-text-muted text-center py-8">No cinemas found.</p>
      )}

      <Modal
        isOpen={showDeleteModal}
        title="Delete Cinema"
        message={`Are you sure you want to delete "${cinemaToDelete?.name}"? This action cannot be undone.`}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteCinema}
        confirmText="Delete"
        theme="default"
      />
    </div>
  );
}
