import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { API_BASE_URL } from "../../utils/api";
import Modal from "../../components/Modal";
import BackButton from "../../components/BackButton";
import Navbar from "../../components/Navbar";

export default function ShowtimeManagement() {
  const { user } = useContext(AuthContext);
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter states
  const [filters, setFilters] = useState({
    date: "",
    movieId: "",
    hallId: "",
    status: "scheduled",
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

  // Fetch initial data
  useEffect(() => {
    fetchShowtimes();
    fetchMovies();
    fetchHalls();
  }, [filters]);

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
        setHalls(data.data || []);
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateShowtime = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/showtimes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(formData),
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
    e.preventDefault();
    if (!currentShowtime) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/showtimes/${currentShowtime._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify(formData),
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
      const response = await fetch(
        `${API_BASE_URL}/showtimes/${currentShowtime._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
      const response = await fetch(
        `${API_BASE_URL}/showtimes/${showtimeId}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

  const openCreateModal = () => {
    resetForm();
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
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-background-900 text-text-primary">
      <Navbar />

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

        {/* Showtimes List */}
        <div className="bg-surface-600 rounded-xl border border-surface-400/40 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-4 text-text-secondary">Loading showtimes...</p>
            </div>
          ) : showtimes.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-text-secondary">
                No showtimes found. Create your first showtime!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-surface-400">
                <thead>
                  <tr className="bg-surface-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Movie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Hall
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Seats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-400">
                  {showtimes.map((showtime) => (
                    <tr key={showtime._id} className="hover:bg-surface-500/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {showtime.movieId?.posterImage ? (
                            <img
                              src={`${API_BASE_URL.replace("/api", "")}${
                                showtime.movieId.posterImage
                              }`}
                              alt={showtime.movieId.title}
                              className="w-10 h-14 rounded object-cover mr-3"
                            />
                          ) : (
                            <div className="w-10 h-14 bg-secondary-500 rounded flex items-center justify-center mr-3">
                              <span className="text-2xl">🎬</span>
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-text-primary">
                              {showtime.movieId?.title || "Unknown Movie"}
                            </div>
                            <div className="text-xs text-text-muted">
                              {showtime.movieId?.duration || "?"} min •{" "}
                              {showtime.movieId?.genre?.[0] || "Movie"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-primary">
                          {showtime.hallId?.name || "Unknown Hall"}
                        </div>
                        <div className="text-xs text-text-muted">
                          {showtime.hallId?.capacity
                            ? `${showtime.hallId.capacity} seats`
                            : ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-primary">
                          {formatDate(showtime.startTime)}
                        </div>
                        <div className="text-xs text-text-muted">
                          Ends: {formatDate(showtime.endTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-primary">
                          ${parseFloat(showtime.price).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-primary">
                          {showtime.seatsAvailable}/{showtime.totalSeats}
                        </div>
                        <div className="w-full bg-surface-400 rounded-full h-2 mt-1">
                          <div
                            className="bg-primary-500 h-2 rounded-full"
                            style={{
                              width: `${
                                (showtime.seatsAvailable /
                                  showtime.totalSeats) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            showtime.status === "scheduled"
                              ? "bg-semantic-success/20 text-semantic-success border border-semantic-success/30"
                              : showtime.status === "cancelled"
                              ? "bg-semantic-error/20 text-semantic-error border border-semantic-error/30"
                              : "bg-gray-600 text-gray-300 border border-gray-500"
                          }`}
                        >
                          {showtime.status.charAt(0).toUpperCase() +
                            showtime.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(showtime)}
                            disabled={
                              !isAdmin || showtime.status !== "scheduled"
                            }
                            className={`px-3 py-1 rounded text-sm ${
                              isAdmin && showtime.status === "scheduled"
                                ? "bg-secondary-500 hover:bg-secondary-600 text-white"
                                : "bg-gray-600 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            Edit
                          </button>

                          {showtime.status === "scheduled" && isAdmin && (
                            <button
                              onClick={() => handleCancelShowtime(showtime._id)}
                              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                            >
                              Cancel
                            </button>
                          )}

                          <button
                            onClick={() => openDeleteModal(showtime)}
                            disabled={
                              !isAdmin ||
                              (showtime.status === "scheduled" &&
                                showtime.totalSeats - showtime.seatsAvailable >
                                  0)
                            }
                            className={`px-3 py-1 rounded text-sm ${
                              isAdmin &&
                              !(
                                showtime.status === "scheduled" &&
                                showtime.totalSeats - showtime.seatsAvailable >
                                  0
                              )
                                ? "bg-semantic-error hover:bg-semantic-error/80 text-white"
                                : "bg-gray-600 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              min={new Date().toISOString().slice(0, 16)}
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
