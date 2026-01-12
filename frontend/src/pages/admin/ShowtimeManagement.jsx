import { useState, useEffect, useContext } from "react";
import { useLocation } from 'react-router-dom';
import { AuthContext } from "../../context/AuthContext";
import { API_BASE_URL } from "../../utils/api";
import Modal from "../../components/Modal";
import BackButton from "../../components/BackButton";
import LoadingLogo from "../../components/LoadingLogo";

export default function ShowtimeManagement() {
  const { user } = useContext(AuthContext);
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter states
  const location = useLocation();
  // Initialize filters from query params (allows linking from AdminDashboard)
  const query = new URLSearchParams(location.search);
  const [filters, setFilters] = useState({
    date: query.get('date') || "",
    movieId: query.get('movieId') || "",
    hallId: query.get('hallId') || "",
    status: query.get('status') || "scheduled",
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentShowtime, setCurrentShowtime] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    movieId: "",
    hallId: "",
    startTime: "",
    price: "",
    totalSeats: "",
  });
  const [hallCapacityPlaceholder, setHallCapacityPlaceholder] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetchShowtimes();
    fetchMovies();
    fetchHalls();
  }, [filters.date, filters.movieId, filters.hallId, filters.status]);

  const fetchShowtimes = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.date) queryParams.append("date", filters.date);
      if (filters.movieId) queryParams.append("movieId", filters.movieId);
      if (filters.hallId) queryParams.append("hallId", filters.hallId);
      if (filters.status) queryParams.append("status", filters.status);

      const response = await fetch(`${API_BASE_URL}/showtimes?${queryParams}`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch showtimes");

      const data = await response.json();
      setShowtimes(data.data || []);
      setError("");
    } catch (err) {
      setError("Failed to load showtimes: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovies = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/movies`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setMovies(data.movies || []);
      }
    } catch (err) {
      console.error("Failed to fetch movies:", err);
    }
  };

  const fetchHalls = async () => {
    try {
      // Assuming Hall API endpoint exists (Member 3's work)
      const response = await fetch(`${API_BASE_URL}/halls`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        // Backend may return halls as a plain array or wrapped in an object
        if (Array.isArray(data)) {
          setHalls(data);
        } else if (Array.isArray(data.data)) {
          setHalls(data.data);
        } else if (Array.isArray(data.halls)) {
          setHalls(data.halls);
        } else {
          setHalls([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch halls:", err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    // If hall changed, populate totalSeats from selected hall capacity
    if (name === 'hallId') {
      const selectedHall = halls.find(h => h._id === value);
      // Determine capacity from hall.totalSeats or layout (rows * cols) or seats length
      let capacity = '';
      if (selectedHall) {
        if (typeof selectedHall.totalSeats === 'number' && selectedHall.totalSeats > 0) {
          capacity = String(selectedHall.totalSeats);
        } else if (selectedHall.layout) {
          if (Array.isArray(selectedHall.layout.seats) && selectedHall.layout.seats.length > 0) {
            capacity = String(selectedHall.layout.seats.length);
          } else if (selectedHall.layout.rows && selectedHall.layout.cols) {
            capacity = String(Number(selectedHall.layout.rows) * Number(selectedHall.layout.cols));
          }
        }
      }
      setHallCapacityPlaceholder(capacity);
      setFormData((prev) => ({ ...prev, hallId: value }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Format currency as Sri Lankan Rupee
  const formatCurrency = (amount) => {
    try {
      const num = Number(amount) || 0;
      return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(num);
    } catch (err) {
      return `Rs ${Number(amount || 0).toFixed(2)}`;
    }
  };

  // Helper: get local datetime-local string for input min (YYYY-MM-DDTHH:mm)
  const getLocalDateTimeForInput = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000; // in ms
    const localISO = new Date(now - tzOffset).toISOString().slice(0, 16);
    return localISO;
  };

  const handleCreateShowtime = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      // Prepare payload: ensure required fields and coerce types
      const payload = { ...formData };
      // Basic validation
      if (!payload.movieId || !payload.hallId || !payload.startTime) {
        setError('Please select a movie, hall and start time');
        return;
      }

      // Normalize startTime to ISO (treat datetime-local as local time)
      try {
        payload.startTime = new Date(payload.startTime).toISOString();
      } catch (err) {
        setError('Invalid start time format');
        return;
      }

      // Coerce numeric fields
      payload.price = parseFloat(payload.price) || 0;

      // Ensure totalSeats: if empty use selected hall capacity
      if (!payload.totalSeats || Number(payload.totalSeats) <= 0) {
        const selectedHall = halls.find(h => h._id === payload.hallId);
        let capacity = null;
        if (selectedHall) {
          if (typeof selectedHall.totalSeats === 'number' && selectedHall.totalSeats > 0) capacity = selectedHall.totalSeats;
          else if (selectedHall.layout) {
            if (Array.isArray(selectedHall.layout.seats) && selectedHall.layout.seats.length > 0) capacity = selectedHall.layout.seats.length;
            else if (selectedHall.layout.rows && selectedHall.layout.cols) capacity = Number(selectedHall.layout.rows) * Number(selectedHall.layout.cols);
          }
        }
        if (capacity) payload.totalSeats = capacity;
        else {
          setError('Total seats missing and cannot be inferred from selected hall');
          return;
        }
      } else {
        payload.totalSeats = Number(payload.totalSeats);
      }

      const response = await fetch(`${API_BASE_URL}/showtimes`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create showtime");
      }

      setSuccess("Showtime created successfully!");
      setShowCreateModal(false);
      resetForm();
      fetchShowtimes();

      // Auto-clear success message
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateShowtime = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!currentShowtime) return;

    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      // Prepare payload similar to create
      const payload = { ...formData };
      if (!payload.movieId || !payload.hallId || !payload.startTime) {
        setError('Please select a movie, hall and start time');
        return;
      }
      // Normalize startTime to ISO for update as well
      try {
        payload.startTime = new Date(payload.startTime).toISOString();
      } catch (err) {
        setError('Invalid start time format');
        return;
      }
      payload.price = parseFloat(payload.price) || 0;
      if (!payload.totalSeats || Number(payload.totalSeats) <= 0) {
        const selectedHall = halls.find(h => h._id === payload.hallId);
        let capacity = null;
        if (selectedHall) {
          if (typeof selectedHall.totalSeats === 'number' && selectedHall.totalSeats > 0) capacity = selectedHall.totalSeats;
          else if (selectedHall.layout) {
            if (Array.isArray(selectedHall.layout.seats) && selectedHall.layout.seats.length > 0) capacity = selectedHall.layout.seats.length;
            else if (selectedHall.layout.rows && selectedHall.layout.cols) capacity = Number(selectedHall.layout.rows) * Number(selectedHall.layout.cols);
          }
        }
        if (capacity) payload.totalSeats = capacity;
        else {
          setError('Total seats missing and cannot be inferred from selected hall');
          return;
        }
      } else {
        payload.totalSeats = Number(payload.totalSeats);
      }

      const response = await fetch(
        `${API_BASE_URL}/showtimes/${currentShowtime._id}`,
        {
          method: "PUT",
          headers,
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update showtime");
      }

      setSuccess("Showtime updated successfully!");
      setShowEditModal(false);
      resetForm();
      fetchShowtimes();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteShowtime = async () => {
    if (!currentShowtime) return;

    try {
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(
        `${API_BASE_URL}/showtimes/${currentShowtime._id}`,
        {
          method: "DELETE",
          headers,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete showtime");
      }

      setSuccess("Showtime deleted successfully!");
      setShowDeleteModal(false);
      setCurrentShowtime(null);
      fetchShowtimes();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelShowtime = async (showtimeId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(
        `${API_BASE_URL}/showtimes/${showtimeId}/cancel`,
        {
          method: "PUT",
          headers,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to cancel showtime");
      }

      setSuccess("Showtime cancelled successfully!");
      fetchShowtimes();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      movieId: "",
      hallId: "",
      startTime: "",
      price: "",
      totalSeats: "",
    });
  };

  const openCreateModal = (preselectedMovieId = null) => {
    resetForm();
    // If this was called from a click handler without an id, ignore the event object
    if (preselectedMovieId && typeof preselectedMovieId === 'string') {
      setFormData(prev => ({ ...prev, movieId: preselectedMovieId }));
    }
    setShowCreateModal(true);
    setError("");
  };

  const openEditModal = (showtime) => {
    setCurrentShowtime(showtime);
    setFormData({
      movieId: showtime.movieId?._id || showtime.movieId,
      hallId: showtime.hallId?._id || showtime.hallId,
      startTime: showtime.startTime
        ? new Date(showtime.startTime).toISOString().slice(0, 16)
        : "",
      price: showtime.price || "",
      totalSeats: showtime.totalSeats || "",
    });
    setShowEditModal(true);
    setError("");
  };

  const openDeleteModal = (showtime) => {
    setCurrentShowtime(showtime);
    setShowDeleteModal(true);
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Invalid Date';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Group showtimes by movie
  const showtimesByMovie = showtimes.reduce((acc, showtime) => {
    const movieId = showtime.movieId?._id || showtime.movieId;
    if (!acc[movieId]) {
      // Find the movie object from the movies array, or create a placeholder
      const movieObj = movies.find(m => m._id === movieId) || showtime.movieId;
      acc[movieId] = {
        movie: typeof movieObj === 'object' ? movieObj : { _id: movieId, title: 'Unknown Movie' },
        showtimes: []
      };
    }
    acc[movieId].showtimes.push(showtime);
    return acc;
  }, {});

  // Get movies that have showtimes or all movies if no filter
  const moviesWithShowtimes = Object.values(showtimesByMovie);
  const allMoviesToShow = filters.movieId
    ? moviesWithShowtimes.filter(m => m.movie?._id === filters.movieId)
    : moviesWithShowtimes;

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-background-900 text-text-primary">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-300">
              Showtime Management
            </h1>
            <p className="text-text-secondary">
              Schedule and manage movie showtimes
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-colors duration-200 shadow-lg flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Schedule New Showtime
            </button>
          )}
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-semantic-success/20 border border-semantic-success/50 text-semantic-success rounded-lg animate-pulse">
            ✅ {success}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-semantic-error/20 border border-semantic-error/50 text-semantic-error rounded-lg">
            ❌ {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-surface-600 rounded-xl p-6 mb-8 border border-surface-400/40">
          <h2 className="text-xl font-semibold text-secondary-400 mb-4">
            Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Movie
              </label>
              <select
                name="movieId"
                value={filters.movieId}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent"
              >
                <option value="">All Movies</option>
                {movies.map((movie) => (
                  <option key={movie._id} value={movie._id}>
                    {movie.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Hall
              </label>
              <select
                name="hallId"
                value={filters.hallId}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent"
              >
                <option value="">All Halls</option>
                {halls.map((hall) => (
                  <option key={hall._id} value={hall._id}>
                    {hall.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent"
              >
                <option value="scheduled">Scheduled</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
                <option value="">All Statuses</option>
              </select>
            </div>
          </div>
        </div>

        {/* Movies with Showtimes */}
        <div className="space-y-8">
          {loading ? (
            <div className="p-8 text-center">
              <LoadingLogo size={60} text="Loading showtimes..." />
            </div>
          ) : allMoviesToShow.length === 0 ? (
            <div className="p-8 text-center bg-surface-600 rounded-xl border border-surface-400/40">
              <p className="text-text-secondary mb-4">
                No showtimes found. {filters.movieId ? 'Try selecting a different movie or clearing filters.' : 'Create your first showtime!'}
              </p>
              {isAdmin && (
                <button
                  onClick={openCreateModal}
                  className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-colors duration-200 shadow-lg"
                >
                  Schedule New Showtime
                </button>
              )}
            </div>
          ) : (
            allMoviesToShow.map(({ movie, showtimes: movieShowtimes }) => {
              if (!movie) return null; // Skip if movie is null/undefined
              return (
              <div key={movie._id || 'unknown'} className="bg-surface-600 rounded-xl border border-surface-400/40 overflow-hidden mb-6">
                {/* Movie Header */}
                <div className="bg-surface-700 px-6 py-4 border-b border-surface-400/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {movie.posterImage ? (
                        <img
                          src={movie.posterImage.startsWith('http') ? movie.posterImage : `${API_BASE_URL.replace('/api','')}${movie.posterImage}`}
                          alt={movie.title || 'Movie poster'}
                          className="w-16 h-24 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-24 bg-secondary-500 rounded-lg flex items-center justify-center">
                          <span className="text-3xl">🎬</span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-text-primary">{movie.title || 'Unknown Movie'}</h3>
                        <p className="text-text-secondary text-sm">
                          {movie.duration ? `${movie.duration} min` : ''} • {Array.isArray(movie.genre) ? movie.genre.join(', ') : (movie.genre || 'Movie')}
                        </p>
                        <p className="text-text-secondary text-sm">
                          {movieShowtimes.length} showtime{movieShowtimes.length === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => openCreateModal(movie._id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Showtime
                      </button>
                    )}
                  </div>
                </div>

                {/* Showtimes for this movie */}
                <div className="p-6">
                  {movieShowtimes.length === 0 ? (
                    <p className="text-text-secondary text-center py-8">
                      No showtimes scheduled for this movie yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {movieShowtimes.map((showtime) => (
                        <div key={showtime._id} className="bg-surface-500 rounded-lg p-4 border border-surface-400/40">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="text-lg font-semibold text-text-primary">
                                {formatDate(showtime.startTime).split(',')[0]}
                              </div>
                              <div className="text-sm text-text-secondary">
                                {formatDate(showtime.startTime).split(',')[1]?.trim()}
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              showtime.status === "scheduled"
                                ? "bg-semantic-success/20 text-semantic-success border border-semantic-success/30"
                                : showtime.status === "cancelled"
                                ? "bg-semantic-error/20 text-semantic-error border border-semantic-error/30"
                                : "bg-gray-600 text-gray-300 border border-gray-500"
                            }`}>
                              {showtime.status.charAt(0).toUpperCase() + showtime.status.slice(1)}
                            </span>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-text-secondary">Hall:</span>
                              <span className="text-text-primary">{showtime.hallId?.name || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-text-secondary">Price:</span>
                              <span className="text-text-primary">{formatCurrency(showtime.price)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-text-secondary">Seats:</span>
                              <span className="text-text-primary">{showtime.seatsAvailable || 0}/{showtime.totalSeats || 0}</span>
                            </div>
                            <div className="w-full bg-surface-400 rounded-full h-2">
                              <div
                                className="bg-primary-500 h-2 rounded-full"
                                style={{
                                  width: `${showtime.totalSeats ? ((showtime.seatsAvailable || 0) / showtime.totalSeats) * 100 : 0}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {isAdmin && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditModal(showtime)}
                                disabled={showtime.status !== "scheduled"}
                                className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                                  showtime.status === "scheduled"
                                    ? "bg-secondary-500 hover:bg-secondary-600 text-white"
                                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                                }`}
                              >
                                Edit
                              </button>

                              {showtime.status === "scheduled" && (
                                <button
                                  onClick={() => handleCancelShowtime(showtime._id)}
                                  className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-medium"
                                >
                                  Cancel
                                </button>
                              )}

                              <button
                                onClick={() => openDeleteModal(showtime)}
                                disabled={
                                  showtime.status === "scheduled" &&
                                  (showtime.totalSeats - (showtime.seatsAvailable || 0)) > 0
                                }
                                className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                                  showtime.status === "scheduled" &&
                                  (showtime.totalSeats - (showtime.seatsAvailable || 0)) === 0
                                    ? "bg-semantic-error hover:bg-semantic-error/80 text-white"
                                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                                }`}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Showtime Modal */}
      <Modal
        isOpen={showCreateModal}
        title="Schedule New Showtime"
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleCreateShowtime}
        confirmText="Create Showtime"
        confirmDisabled={
          !formData.movieId ||
          !formData.hallId ||
          !formData.startTime ||
          !formData.price ||
          !formData.totalSeats
        }
      >
        {error && (
          <div className="mb-4 p-3 bg-semantic-error/20 border border-semantic-error/50 text-semantic-error rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Guide admin to create movies/halls first */}
        {movies.length === 0 && (
          <div className="mb-4 p-3 bg-yellow-600/10 border border-yellow-600/20 text-yellow-300 rounded-lg text-sm">
            No movies found. Create a movie first in the <a href="/movies/new" className="text-accent-magenta underline">Add Movie</a> page.
          </div>
        )}
        {halls.length === 0 && (
          <div className="mb-4 p-3 bg-yellow-600/10 border border-yellow-600/20 text-yellow-300 rounded-lg text-sm">
            No halls found. Add a hall in the <a href="/halls" className="text-accent-magenta underline">Halls</a> admin section before scheduling.
          </div>
        )}

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Movie *
            </label>
            <select
              name="movieId"
              value={formData.movieId}
              onChange={handleFormChange}
              required
              className="w-full px-4 py-2 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent"
            >
              <option value="">Select a movie</option>
              {movies.map((movie) => (
                <option key={movie._id} value={movie._id}>
                  {movie.title} ({movie.duration} min)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Hall *
            </label>
            <select
              name="hallId"
              value={formData.hallId}
              onChange={handleFormChange}
              required
              className="w-full px-4 py-2 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent"
            >
              <option value="">Select a hall</option>
              {halls.map((hall) => (
                  <option key={hall._id} value={hall._id}>
                    {hall.name} ({hall.totalSeats || (hall.layout?.rows && hall.layout?.cols ? `${hall.layout.rows * hall.layout.cols}` : '0')} seats)
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleFormChange}
              required
              min={getLocalDateTimeForInput()}
              className="w-full px-4 py-2 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Price (LKR) *
              </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleFormChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder={formatCurrency(0)}
                  className="w-full px-4 py-2 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent"
                />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Total Seats *
              </label>
              <input
                type="number"
                name="totalSeats"
                value={formData.totalSeats}
                placeholder={hallCapacityPlaceholder || 'Total seats'}
                onChange={handleFormChange}
                required
                min="1"
                className="w-full px-4 py-2 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Showtime Modal */}
      <Modal
        isOpen={showEditModal}
        title="Edit Showtime"
        onClose={() => setShowEditModal(false)}
        onConfirm={handleUpdateShowtime}
        confirmText="Update Showtime"
        confirmDisabled={
          !formData.movieId ||
          !formData.hallId ||
          !formData.startTime ||
          !formData.price ||
          !formData.totalSeats
        }
      >
        {error && (
          <div className="mb-4 p-3 bg-semantic-error/20 border border-semantic-error/50 text-semantic-error rounded-lg text-sm">
            {error}
          </div>
        )}

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Movie *
            </label>
            <select
              name="movieId"
              value={formData.movieId}
              onChange={handleFormChange}
              required
              className="w-full px-4 py-2 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent"
            >
              <option value="">Select a movie</option>
              {movies.map((movie) => (
                <option key={movie._id} value={movie._id}>
                  {movie.title} ({movie.duration} min)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Hall *
            </label>
            <select
              name="hallId"
              value={formData.hallId}
              onChange={handleFormChange}
              required
              className="w-full px-4 py-2 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent"
            >
              <option value="">Select a hall</option>
              {halls.map((hall) => (
                <option key={hall._id} value={hall._id}>
                  {hall.name} ({hall.capacity} seats)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleFormChange}
              required
              className="w-full px-4 py-2 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Price ($) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleFormChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Total Seats *
              </label>
              <input
                type="number"
                name="totalSeats"
                value={formData.totalSeats}
                onChange={handleFormChange}
                required
                min="1"
                className="w-full px-4 py-2 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        title="Delete Showtime"
        message={
          currentShowtime
            ? `Are you sure you want to permanently delete the showtime for "${
                currentShowtime.movieId?.title || "Unknown Movie"
              }" on ${formatDate(
                currentShowtime.startTime
              )}? This action cannot be undone.`
            : ""
        }
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteShowtime}
        confirmText="Delete Permanently"
        theme="error"
      />
    </div>
  );
}
