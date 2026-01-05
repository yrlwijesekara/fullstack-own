import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/api";
import BackButton from "../components/BackButton";

export default function ShowtimeManagement() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState(null);
  const [error, setError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    movieId: "",
    hallId: "",
    date: "",
    startTime: "",
    endTime: "",
    price: 10.0,
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch showtimes
      const showtimesRes = await fetch(`${API_BASE_URL}/showtimes`);
      const showtimesData = await showtimesRes.json();

      // Try to fetch movies (Member 2's endpoint)
      let moviesData = { success: false, data: [] };
      try {
        const moviesRes = await fetch(`${API_BASE_URL}/movies`);
        const data = await moviesRes.json();
        moviesData = data || { success: false, data: [] };
      } catch (moviesErr) {
        console.log("Movies endpoint not ready yet:", moviesErr.message);
      }

      // Try to fetch halls (Member 3's endpoint)
      let hallsData = { success: false, data: [] };
      try {
        const hallsRes = await fetch(`${API_BASE_URL}/halls`);
        const data = await hallsRes.json();
        hallsData = data || { success: false, data: [] };
      } catch (hallsErr) {
        console.log("Halls endpoint not ready yet:", hallsErr.message);
      }

      // Set data - with proper undefined checks
      if (showtimesData && showtimesData.success) {
        setShowtimes(showtimesData.data || []);
      }

      if (moviesData && moviesData.success) {
        setMovies(moviesData.data || []);
      }

      if (hallsData && hallsData.success) {
        setHalls(hallsData.data || []);
      }

      // If endpoints not ready, use mock data temporarily
      if (
        !moviesData.success ||
        !moviesData.data ||
        moviesData.data.length === 0
      ) {
        setMovies([
          { _id: "movie1", title: "Avatar: The Way of Water", duration: 192 },
          { _id: "movie2", title: "Spider-Man: No Way Home", duration: 148 },
        ]);
      }

      if (
        !hallsData.success ||
        !hallsData.data ||
        hallsData.data.length === 0
      ) {
        setHalls([
          { _id: "hall1", name: "Screen 1 (IMAX)", capacity: 250 },
          { _id: "hall2", name: "Screen 2 (Dolby Atmos)", capacity: 180 },
        ]);
      }
    } catch (fetchError) {
      console.error("Error fetching data:", fetchError);
      setError(`Failed to load data: ${fetchError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const url = editingShowtime
        ? `${API_BASE_URL}/showtimes/${editingShowtime._id}`
        : `${API_BASE_URL}/showtimes`;

      const method = editingShowtime ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert(editingShowtime ? "Showtime updated!" : "Showtime created!");
        resetForm();
        fetchData();
      } else {
        setError(data.message || "Error occurred");
      }
    } catch (submitError) {
      console.error("Error saving showtime:", submitError);
      setError("Failed to save showtime. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      movieId: "",
      hallId: "",
      date: "",
      startTime: "",
      endTime: "",
      price: 10.0,
    });
    setEditingShowtime(null);
    setShowForm(false);
    setError("");
  };

  const handleEdit = (showtime) => {
    setEditingShowtime(showtime);
    setFormData({
      movieId: showtime.movieId || showtime.movieId,
      hallId: showtime.hallId || showtime.hallId,
      date: showtime.date
        ? new Date(showtime.date).toISOString().split("T")[0]
        : "",
      startTime: showtime.startTime
        ? new Date(showtime.startTime).toTimeString().slice(0, 5)
        : "",
      endTime: showtime.endTime
        ? new Date(showtime.endTime).toTimeString().slice(0, 5)
        : "",
      price: showtime.price || 10.0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this showtime?"))
      return;

    try {
      const response = await fetch(`${API_BASE_URL}/showtimes/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        alert("Showtime deleted!");
        fetchData();
      } else {
        setError(data.message || "Failed to delete showtime");
      }
    } catch (deleteError) {
      console.error("Error deleting showtime:", deleteError);
      setError("Failed to delete showtime");
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "N/A";
    return new Date(dateTime).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMovieTitle = (movieId) => {
    const movie = movies.find((m) => m._id === movieId);
    return movie ? movie.title : `Movie ID: ${movieId}`;
  };

  const getHallName = (hallId) => {
    const hall = halls.find((h) => h._id === hallId);
    return hall ? hall.name : `Hall ID: ${hallId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-8">
      {/* Back Button */}
      <div className="mb-6">
        <BackButton to="/" variant="round" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Showtime Management
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
          >
            + Add New Showtime
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-600/20 border border-red-500/50 text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {/* Info Message if endpoints not ready */}
        {movies.length === 2 && movies[0]._id === "movie1" && (
          <div className="mb-6 p-4 bg-blue-600/20 border border-blue-500/50 text-blue-300 rounded-lg">
            ⓘ Using mock data for movies/halls. Will switch to real data when
            Members 2 & 3 complete their endpoints.
          </div>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-purple-500/30 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingShowtime ? "Edit Showtime" : "Create New Showtime"}
            </h2>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Movie Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Movie</label>
                <select
                  name="movieId"
                  value={formData.movieId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">Select a movie</option>
                  {movies.map((movie) => (
                    <option key={movie._id} value={movie._id}>
                      {movie.title}{" "}
                      {movie.duration ? `(${movie.duration} min)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hall Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Hall</label>
                <select
                  name="hallId"
                  value={formData.hallId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">Select a hall</option>
                  {halls.map((hall) => (
                    <option key={hall._id} value={hall._id}>
                      {hall.name}{" "}
                      {hall.capacity ? `(${hall.capacity} seats)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              {/* Form Buttons */}
              <div className="md:col-span-2 flex gap-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
                >
                  {editingShowtime ? "Update Showtime" : "Create Showtime"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Showtimes List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-2"></div>
            <p>Loading showtimes...</p>
          </div>
        ) : showtimes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-4">🎬</div>
            <p className="text-xl mb-2">No showtimes found</p>
            <p className="mb-4">
              Click "Add New Showtime" to create your first showtime!
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
            >
              + Create First Showtime
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showtimes.map((showtime) => (
              <div
                key={showtime._id}
                className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-purple-500/30 hover:border-purple-400 transition hover:shadow-lg hover:shadow-purple-500/20"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {getMovieTitle(showtime.movieId)}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {getHallName(showtime.hallId)} • {showtime.availableSeats}{" "}
                      seats available
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-purple-600 rounded-full text-sm font-medium">
                    ${showtime.price}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="flex items-center gap-2">
                    <span className="text-gray-400">📅</span>
                    <span>{formatDateTime(showtime.startTime)}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-gray-400">⏰</span>
                    <span>
                      {showtime.startTime
                        ? new Date(showtime.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}{" "}
                      -
                      {showtime.endTime
                        ? new Date(showtime.endTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </span>
                  </p>
                  <p className="text-sm text-gray-400">
                    Status:{" "}
                    <span
                      className={
                        showtime.isActive ? "text-green-400" : "text-red-400"
                      }
                    >
                      {showtime.isActive ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(showtime)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(showtime._id)}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
