import { useEffect, useState } from 'react';
import { getHalls, deleteHall } from '../../services/hallService';
import { useNavigate } from 'react-router-dom';
import LoadingLogo from '../../components/LoadingLogo';

const HallsList = () => {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadHalls = async () => {
    try {
      setLoading(true);
      const data = await getHalls();
      setHalls(data);
    } catch (err) {
      setError(err.message || 'Failed to load halls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHalls();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hall?')) return;
    try {
      await deleteHall(id);
      setHalls((prev) => prev.filter((h) => h._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background-900 flex items-center justify-center">
      <LoadingLogo size={80} text="Loading halls..." />
    </div>
  );
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-semibold">Halls</h1>
        <button
          onClick={() => navigate('/admin-dashboard/halls/new')}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          + New Hall
        </button>
      </div>

      {halls.length === 0 ? (
        <p>No halls created yet.</p>
      ) : (
        <div className="space-y-3">
          {halls.map((hall) => (
            <div
              key={hall._id}
              className="border rounded px-4 py-3 flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{hall.name}</div>
                <div className="text-sm text-gray-500">
                  Status: {hall.status} · Capacity: {hall.totalSeats}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/admin-dashboard/halls/${hall._id}`)}
                  className="px-3 py-1 text-sm border rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(hall._id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HallsList;