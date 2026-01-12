import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from '../../hooks/useNavigate';
import { API_BASE_URL } from '../../utils/api';
import { toast } from 'react-toastify';
import Modal from '../../components/Modal';
import Logo from '../../components/Logo';

export default function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Summary counts
  const [moviesOverview, setMoviesOverview] = useState([]);
  const [halls, setHalls] = useState([]);
  const [showtimesCount, setShowtimesCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [snacksCount, setSnacksCount] = useState(0);

  // Showtime create state
  const [showCreateShowtimeModal, setShowCreateShowtimeModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showtimeFormData, setShowtimeFormData] = useState({
    hallId: '',
    startTime: '',
    price: '',
    availableSeats: '',
  });
  const [loading, setLoading] = useState(false);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    fetchMoviesOverview();
    fetchHalls();
    fetchSummaryCounts();
  }, []);

  async function fetchHalls() {
    try {
      const res = await fetch(`${API_BASE_URL}/halls`);
      if (!res.ok) return;
      const data = await res.json();
      // API may return an array or an object with a `data` field
      if (Array.isArray(data)) setHalls(data);
      else if (Array.isArray(data.data)) setHalls(data.data);
      else setHalls([]);
    } catch (err) {
      console.error('Failed to fetch halls', err);
    }
  }

  async function fetchMoviesOverview() {
    try {
      const res = await fetch(`${API_BASE_URL}/movies`);
      if (!res.ok) return;
      const data = await res.json();

      let movies = [];
      if (Array.isArray(data)) movies = data;
      else if (Array.isArray(data.movies)) movies = data.movies;
      else if (Array.isArray(data.data)) movies = data.data;
      else if (Array.isArray(data.moviesList)) movies = data.moviesList;
      else movies = [];

      const overview = await Promise.all(
        movies.map(async (m) => {
          try {
            const q = new URLSearchParams();
            q.append('movieId', m._id);
            q.append('status', 'scheduled');
            q.append('limit', '1');
            q.append('sortBy', 'startTime');
            q.append('sortOrder', 'asc');

            const sres = await fetch(`${API_BASE_URL}/showtimes?${q.toString()}`);
            if (!sres.ok) return { movie: m, nextShowtime: null, count: 0 };
            const sdata = await sres.json();
            const next = (sdata.data && sdata.data[0]) || null;
            const count = sdata.pagination?.total || 0;
            return { movie: m, nextShowtime: next, count };
          } catch (err) {
            return { movie: m, nextShowtime: null, count: 0 };
          }
        })
      );

      setMoviesOverview(overview);
    } catch (err) {
      console.error('Failed to fetch movies overview', err);
    }
  }

  async function fetchSummaryCounts() {
    try {
      const showtimesReq = fetch(`${API_BASE_URL}/showtimes?status=scheduled&limit=1`, { credentials: 'include' });
      const usersReq = fetch(`${API_BASE_URL}/auth/users?limit=1`, { credentials: 'include' });
      const snacksReq = fetch(`${API_BASE_URL}/snacks?limit=1`, { credentials: 'include' });

      const [sres, ures, nres] = await Promise.all([showtimesReq, usersReq, snacksReq]);

      if (sres.ok) {
        const sdata = await sres.json();
        setShowtimesCount(sdata.pagination?.total ?? (Array.isArray(sdata) ? sdata.length : 0));
      }

      if (ures.ok) {
        const udata = await ures.json();
        setUsersCount(udata.pagination?.total ?? (Array.isArray(udata.users) ? udata.users.length : (Array.isArray(udata) ? udata.length : 0)));
      }

      if (nres.ok) {
        const ndata = await nres.json();
        setSnacksCount(ndata.pagination?.total ?? (Array.isArray(ndata.data) ? ndata.data.length : (Array.isArray(ndata) ? ndata.length : 0)));
      }
    } catch (err) {
      console.warn('Failed to fetch summary counts', err);
    }
  }

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    toast.success('You have been successfully logged out.');
    navigate('/login');
  };

  const openCreateShowtimeModal = (movie) => {
    setSelectedMovie(movie);
    setShowtimeFormData({ hallId: '', startTime: '', price: '', availableSeats: '' });
    setShowCreateShowtimeModal(true);
  };

  const handleShowtimeFormChange = (e) => {
    const { name, value } = e.target;
    setShowtimeFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateShowtime = async (e) => {
    e.preventDefault();
    if (!selectedMovie) return;
    setLoading(true);
    try {
      const body = { movieId: selectedMovie._id, ...showtimeFormData };
      const res = await fetch(`${API_BASE_URL}/showtimes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create showtime');
      toast.success('Showtime created successfully!');
      setShowCreateShowtimeModal(false);
      fetchMoviesOverview();
    } catch (err) {
      toast.error(err.message || 'Failed to create showtime');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-surface-600 rounded-2xl shadow-2xl p-8 border border-surface-400/40">
            <div className="flex items-center justify-center mb-6">
              <Logo size={64} className="bg-transparent shadow-none border-0" />
            </div>
            <h1 className="text-3xl font-bold text-secondary-400 mb-6 text-center">Admin Dashboard</h1>
            <p className="text-text-secondary text-center mb-8">Welcome, {user?.firstName} {user?.lastName}! You are logged in as an administrator.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Summary cards */}
              <div className="col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-2">
                <div className="bg-surface-500 p-4 rounded-xl border border-secondary-400/40">
                  <div className="text-sm text-text-secondary">Movies</div>
                  <div className="text-2xl font-bold">{moviesOverview.length}</div>
                </div>
                <div className="bg-surface-500 p-4 rounded-xl border border-secondary-400/40">
                  <div className="text-sm text-text-secondary">Halls</div>
                  <div className="text-2xl font-bold">{halls.length}</div>
                </div>
                <div className="bg-surface-500 p-4 rounded-xl border border-secondary-400/40">
                  <div className="text-sm text-text-secondary">Showtimes</div>
                  <div className="text-2xl font-bold">{showtimesCount}</div>
                </div>
                <div className="bg-surface-500 p-4 rounded-xl border border-secondary-400/40">
                  <div className="text-sm text-text-secondary">Users</div>
                  <div className="text-2xl font-bold">{usersCount}</div>
                </div>
                <div className="bg-surface-500 p-4 rounded-xl border border-secondary-400/40">
                  <div className="text-sm text-text-secondary">Concessions</div>
                  <div className="text-2xl font-bold">{snacksCount}</div>
                </div>
              </div>

              {/* Admin function cards */}
              <div className="bg-surface-500 p-6 rounded-xl border border-secondary-400/40 hover:border-primary-500 transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-2">Manage Movies</h3>
                <p className="text-text-secondary mb-4">Add, edit, or remove movies from the system.</p>
                <button onClick={() => navigate('/movies')} className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-colors">Go to Movies</button>
              </div>

              <div className="bg-surface-500 p-6 rounded-xl border border-secondary-400/40 hover:border-primary-500 transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-2">Manage Halls</h3>
                <p className="text-text-secondary mb-4">Configure cinema halls and seating arrangements. <span className="font-semibold">{halls.length} {halls.length === 1 ? 'hall' : 'halls'}</span></p>
                <button onClick={() => navigate('/admin-dashboard/halls')} className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-colors">Go to Halls</button>
              </div>

              <div className="bg-surface-500 p-6 rounded-xl border border-secondary-400/40 hover:border-primary-500 transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-2">Manage Cinemas</h3>
                <p className="text-text-secondary mb-4">Add and manage cinema locations and images.</p>
                <button onClick={() => navigate('/admin-dashboard/cinemas')} className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-colors">Go to Cinemas</button>
              </div>

              <div className="bg-surface-500 p-6 rounded-xl border border-secondary-400/40 hover:border-primary-500 transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-2">Manage Showtimes</h3>
                <p className="text-text-secondary mb-4">Schedule and manage movie showtimes.</p>
                <button onClick={() => navigate('/admin-dashboard/showtime-management')} className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-colors">Go to Showtimes</button>
              </div>

              <div className="bg-surface-500 p-6 rounded-xl border border-secondary-400/40 hover:border-primary-500 transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-2">User Management</h3>
                <p className="text-text-secondary mb-4">View and manage user accounts.</p>
                <button onClick={() => navigate('/admin-dashboard/user-management')} className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-colors">Go to Users</button>
              </div>

              <div className="bg-surface-500 p-6 rounded-xl border border-secondary-400/40 hover:border-primary-500 transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-2">Manage Concessions</h3>
                <p className="text-text-secondary mb-4">Add and manage concession items and inventory.</p>
                <button onClick={() => navigate('/admin-dashboard/concession-management')} className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-colors">Go to Concessions</button>
              </div>

              <div className="bg-surface-500 p-6 rounded-xl border border-secondary-400/40 hover:border-primary-500 transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-2">Reports</h3>
                <p className="text-text-secondary mb-4">View sales and performance reports.</p>
                <button className="w-full py-2 bg-gray-500 text-white font-bold rounded-lg cursor-not-allowed" disabled>Coming Soon</button>
              </div>

              <div className="bg-surface-500 p-6 rounded-xl border border-secondary-400/40 hover:border-primary-500 transition-colors">
                <h3 className="text-xl font-semibold text-text-primary mb-2">Settings</h3>
                <p className="text-text-secondary mb-4">Configure system settings.</p>
                <button className="w-full py-2 bg-gray-500 text-white font-bold rounded-lg cursor-not-allowed" disabled>Coming Soon</button>
              </div>
            </div>

            {/* Create Showtime Modal */}
            {showCreateShowtimeModal && selectedMovie && (
              <Modal onClose={() => setShowCreateShowtimeModal(false)}>
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Add Showtime for {selectedMovie.title}</h2>
                  <form onSubmit={handleCreateShowtime} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Hall</label>
                      <select name="hallId" value={showtimeFormData.hallId} onChange={handleShowtimeFormChange} className="w-full p-2 bg-surface-600 border border-secondary-400 rounded" required>
                        <option value="">Select Hall</option>
                        {halls.map((hall) => (
                          <option key={hall._id} value={hall._id}>{hall.name} (Capacity: {hall.capacity})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Time</label>
                      <input type="datetime-local" name="startTime" value={showtimeFormData.startTime} onChange={handleShowtimeFormChange} className="w-full p-2 bg-surface-600 border border-secondary-400 rounded" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Price</label>
                      <input type="number" name="price" value={showtimeFormData.price} onChange={handleShowtimeFormChange} className="w-full p-2 bg-surface-600 border border-secondary-400 rounded" min="0" step="0.01" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Available Seats</label>
                      <input type="number" name="availableSeats" value={showtimeFormData.availableSeats} onChange={handleShowtimeFormChange} className="w-full p-2 bg-surface-600 border border-secondary-400 rounded" min="1" required />
                    </div>
                    <div className="flex gap-4">
                      <button type="submit" disabled={loading} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">{loading ? 'Creating...' : 'Create Showtime'}</button>
                      <button type="button" onClick={() => setShowCreateShowtimeModal(false)} className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">Cancel</button>
                    </div>
                  </form>
                </div>
              </Modal>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}