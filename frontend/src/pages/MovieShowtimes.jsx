import { useState, useEffect, useContext } from "react";
import { API_BASE_URL } from "../utils/api";
import Navbar from "../components/Navbar";
import BackButton from "../components/BackButton";
import LoadingLogo from "../components/LoadingLogo";
import Modal from "../components/Modal";
import { AuthContext } from "../context/AuthContext";

export default function MovieShowtimes() {
  // Get movie ID from URL path (e.g., /movies/123/showtimes)
  const movieId = window.location.pathname.split('/')[2];
  
  // Get query parameters for pre-selection from Quick Booking
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedDate = urlParams.get('date') || '';
  const preSelectedHallId = urlParams.get('hallId') || '';
  const preSelectedCinemaId = urlParams.get('cinemaId') || '';
  
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinema, setSelectedCinema] = useState(preSelectedCinemaId);
  const [selectedHall, setSelectedHall] = useState(preSelectedHallId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(preSelectedDate);
  const [showCinemaPicker, setShowCinemaPicker] = useState(false);
  const [bookingShowtimeId, setBookingShowtimeId] = useState(null);
  const [tempCinemaSelection, setTempCinemaSelection] = useState("");
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchMovieAndShowtimes();
  }, [movieId, selectedDate, selectedCinema, selectedHall]);

  useEffect(() => {
    // Fetch cinemas for selector
    const fetchCinemas = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/cinemas`);
        if (!res.ok) return;
        const data = await res.json();
        const list = data.data || data;
        setCinemas(Array.isArray(list) ? list : []);
      } catch (e) {
        // ignore errors for now
      }
    };

    fetchCinemas();
  }, []);

  const fetchMovieAndShowtimes = async () => {
    try {
      setLoading(true);

      // Fetch movie details
      const movieResponse = await fetch(`${API_BASE_URL}/movies/${movieId}`, {
        credentials: "include",
      });

      if (!movieResponse.ok) throw new Error("Movie not found");
      const movieData = await movieResponse.json();
      setMovie(movieData.movie);

      // Fetch showtimes for this movie (optionally filtered by cinema or hall)
      const queryParams = new URLSearchParams();
      queryParams.append("movieId", movieId);
      if (selectedDate) queryParams.append("date", selectedDate);
      if (selectedHall) {
        queryParams.append("hallId", selectedHall); // Use hallId if selected from Quick Booking
      } else if (selectedCinema) {
        queryParams.append("cinemaId", selectedCinema); // Otherwise use cinemaId
      }

      const showtimesResponse = await fetch(`${API_BASE_URL}/showtimes?${queryParams}`, {
        credentials: "include",
      });

      if (showtimesResponse.ok) {
        const showtimesData = await showtimesResponse.json();
        const list = showtimesData.data?.showtimes || showtimesData.data || showtimesData;
        setShowtimes(Array.isArray(list) ? list : []);
      }

      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (value) => {
    const amount = Number(value) || 0;
    try {
      return new Intl.NumberFormat('si-LK', { style: 'currency', currency: 'LKR' }).format(amount);
    } catch (e) {
      return `LKR ${amount.toFixed(2)}`;
    }
  };

  const handleBookNow = (showtimeId, showtime = null) => {
    // If a cinema is already selected globally, use it
    if (selectedCinema) {
      const suffix = `?cinemaId=${selectedCinema}`;
      window.location.href = `/showtimes/${showtimeId}/book${suffix}`;
      return;
    }

    // If the showtime itself carries a cinemaId, use it
    const showtimeCinemaId = showtime?.cinemaId?._id || showtime?.cinemaId;
    if (showtimeCinemaId) {
      window.location.href = `/showtimes/${showtimeId}/book?cinemaId=${showtimeCinemaId}`;
      return;
    }

    // Always prompt the user to choose a cinema before booking
    setBookingShowtimeId(showtimeId);
    setTempCinemaSelection("");
    setShowCinemaPicker(true);
  };

  const confirmCinemaAndBook = () => {
    if (!bookingShowtimeId) return setShowCinemaPicker(false);
    if (!tempCinemaSelection) {
      alert('Please select a cinema to proceed with booking');
      return;
    }
    const suffix = `?cinemaId=${tempCinemaSelection}`;
    window.location.href = `/showtimes/${bookingShowtimeId}/book${suffix}`;
    setShowCinemaPicker(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-900 flex items-center justify-center">
        <LoadingLogo size={80} text="Loading showtimes..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h1 className="text-2xl text-text-primary mb-2">Movie Not Found</h1>
          <p className="text-text-secondary mb-6">{error}</p>
          <BackButton to="/" text="Back to Home" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-900 text-text-primary">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton to="/" />
        </div>

        {/* Movie Header */}
        <div className="bg-surface-600 rounded-xl p-6 mb-8 border border-surface-400/40">
          <div className="flex flex-col md:flex-row gap-6">
            {movie?.posterImage && (
              <img
                src={movie.posterImage.startsWith('http') ? movie.posterImage : `${API_BASE_URL.replace('/api', '')}${movie.posterImage}`}
                alt={movie.title}
                className="w-36 h-52 sm:w-48 sm:h-72 rounded-lg object-cover flex-shrink-0"
              />
            )}

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-secondary-300 mb-2">
                {movie?.title}
              </h1>
              <div className="flex flex-wrap gap-2 mb-4">
                {movie?.genre?.map((g, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-secondary-500/20 text-secondary-300 rounded-full text-sm"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <div className="text-sm text-text-secondary">Duration</div>
                  <div className="text-lg font-semibold">
                    {movie?.duration} minutes
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-secondary">Language</div>
                  <div className="text-lg font-semibold">{movie?.language}</div>
                </div>
                <div>
                  <div className="text-sm text-text-secondary">Rating</div>
                  <div className="text-lg font-semibold">
                    {movie?.rating || "N/A"}/10
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-secondary">Status</div>
                  <div className="text-lg font-semibold">
                    {movie?.status || "Now Showing"}
                  </div>
                </div>
              </div>

              <p className="text-text-secondary">{movie?.description}</p>
            </div>
          </div>
        </div>

        {/* Showtimes Section */}
        <div className="bg-surface-600 rounded-xl p-6 border border-surface-400/40">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-secondary-300">
              Available Showtimes
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <label className="text-text-secondary">Cinema:</label>
              <select
                value={selectedCinema}
                onChange={(e) => setSelectedCinema(e.target.value)}
                className="min-w-0 text-sm px-3 py-2 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent"
                style={{width: 'max-content'}}
              >
                <option value="">All cinemas</option>
                {cinemas.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}{c.city ? ` - ${c.city}` : ''}</option>
                ))}
              </select>

              <label className="text-text-secondary">Filter by date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="min-w-0 text-sm px-3 py-2 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent"
                style={{width: 'max-content'}}
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate("")}
                  className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 rounded-lg"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          {showtimes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl text-text-primary mb-2">No Showtimes Available</h3>
              <p className="text-text-secondary mb-4">
                {selectedDate
                  ? `No showtimes scheduled for ${formatDate(selectedDate)}`
                  : "No upcoming showtimes scheduled for this movie"}
              </p>
              {/* Admin instruction removed per request */}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {showtimes.map((showtime) => (
                <div
                  key={showtime._id}
                  className="bg-surface-500 rounded-lg p-3 sm:p-4 border border-surface-400 hover:border-secondary-400 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-lg font-semibold text-text-primary">
                        {formatTime(showtime.startTime)}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {formatDate(showtime.startTime)}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        showtime.status === "scheduled"
                          ? "bg-semantic-success/20 text-semantic-success"
                          : "bg-gray-600 text-gray-300"
                      }`}
                    >
                      {showtime.status}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-text-secondary mb-1">
                      Cinema: {showtime.cinemaId?.name}{showtime.cinemaId?.city ? ` - ${showtime.cinemaId.city}` : ''}
                    </div>
                    <div className="text-sm text-text-secondary mb-1">
                      Hall: {showtime.hallId?.name}
                    </div>
                    <div className="text-sm text-text-secondary">
                      Available Seats: {showtime.seatsAvailable}/
                      {showtime.totalSeats}
                    </div>
                    <div className="w-full bg-surface-400 rounded-full h-2 mt-1">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{
                          width: `${
                            (showtime.seatsAvailable / showtime.totalSeats) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="text-xl font-bold text-secondary-300 text-center sm:text-left">
                      {formatCurrency(showtime.price)}
                    </div>
                    <button
                      onClick={() => handleBookNow(showtime._id, showtime)}
                      disabled={
                        showtime.status !== "scheduled" ||
                        showtime.seatsAvailable === 0
                      }
                      className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium ${
                        showtime.status === "scheduled" &&
                        showtime.seatsAvailable > 0
                          ? "bg-primary-500 hover:bg-primary-600 text-white"
                          : "bg-gray-600 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {showtime.seatsAvailable === 0 ? "Sold Out" : "Book Now"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cinema picker modal shown when user tries to book without a selected cinema */}
      <Modal
        isOpen={showCinemaPicker}
        title="Choose Cinema"
        onClose={() => setShowCinemaPicker(false)}
        onConfirm={confirmCinemaAndBook}
        confirmText="Book"
        confirmDisabled={!tempCinemaSelection}
      >
        <div className="mb-4 text-text-secondary">Please choose a cinema to continue booking.</div>
        <div>
          <select
            value={tempCinemaSelection}
            onChange={(e) => setTempCinemaSelection(e.target.value)}
            className="w-full px-3 py-2 bg-surface-500 border border-surface-400 rounded-lg"
          >
            <option value="">Select a cinema</option>
            {cinemas.map((c) => (
              <option key={c._id} value={c._id}>{c.name}{c.city ? ` - ${c.city}` : ''}</option>
            ))}
          </select>
        </div>
      </Modal>

    </div>
  );
}
