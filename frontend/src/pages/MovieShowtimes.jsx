import { useState, useEffect, useParams } from "react";
import { API_BASE_URL } from "../utils/api";
import Navbar from "../components/Navbar";
import BackButton from "../components/BackButton";

export default function MovieShowtimes() {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    fetchMovieAndShowtimes();
  }, [movieId, selectedDate]);

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

      // Fetch showtimes for this movie
      const queryParams = new URLSearchParams();
      queryParams.append("movieId", movieId);
      if (selectedDate) queryParams.append("date", selectedDate);

      const showtimesResponse = await fetch(
        `${API_BASE_URL}/showtimes/movie/${movieId}?${queryParams}`,
        {
          credentials: "include",
        }
      );

      if (showtimesResponse.ok) {
        const showtimesData = await showtimesResponse.json();
        setShowtimes(showtimesData.data?.showtimes || []);
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

  const handleBookNow = (showtimeId) => {
    // This would navigate to seat selection (Member 5's work)
    alert(`Booking showtime ${showtimeId} - This would go to seat selection`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading showtimes...</p>
        </div>
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
                src={`${API_BASE_URL.replace("/api", "")}${movie.posterImage}`}
                alt={movie.title}
                className="w-48 h-72 rounded-lg object-cover"
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

            <div className="flex items-center gap-4">
              <label className="text-text-secondary">Filter by date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 bg-surface-500 border border-surface-400 rounded-lg focus:ring-2 focus:ring-secondary-400 focus:border-transparent"
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
              <h3 className="text-xl text-text-primary mb-2">
                No Showtimes Available
              </h3>
              <p className="text-text-secondary">
                {selectedDate
                  ? `No showtimes scheduled for ${formatDate(selectedDate)}`
                  : "No upcoming showtimes scheduled for this movie"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {showtimes.map((showtime) => (
                <div
                  key={showtime._id}
                  className="bg-surface-500 rounded-lg p-4 border border-surface-400 hover:border-secondary-400 transition-colors"
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

                  <div className="flex justify-between items-center">
                    <div className="text-xl font-bold text-secondary-300">
                      ${parseFloat(showtime.price).toFixed(2)}
                    </div>
                    <button
                      onClick={() => handleBookNow(showtime._id)}
                      disabled={
                        showtime.status !== "scheduled" ||
                        showtime.seatsAvailable === 0
                      }
                      className={`px-4 py-2 rounded-lg font-medium ${
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
    </div>
  );
}
