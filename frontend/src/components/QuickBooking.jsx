import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * QuickBooking Component - Quick booking widget for selecting movie, date, and cinema
 * @param {Array} movies - Array of movie objects to populate the dropdown
 * @param {Array} cinemas - Array of cinema locations (optional)
 * @param {Function} onBooking - Callback function when booking is submitted
 */
export default function QuickBooking({ movies = [], cinemas = [], onBooking }) {
  const [selectedMovie, setSelectedMovie] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCinema, setSelectedCinema] = useState('');

  // Default cinema locations if none provided
  const defaultCinemas = [
    { id: 'cinema1', name: 'Cinema Location A' },
    { id: 'cinema2', name: 'Cinema Location B' },
    { id: 'cinema3', name: 'Cinema Location C' },
    { id: 'cinema4', name: 'Cinema Location D' },
  ];

  const cinemaList = cinemas.length > 0 ? cinemas : defaultCinemas;

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  const handleBooking = (e) => {
    e.preventDefault();

    // Validation
    if (!selectedMovie || !selectedDate || !selectedCinema) {
      alert('Please select all fields before booking');
      return;
    }

    // Find selected movie details
    const movie = movies.find(m => m.id === selectedMovie);
    const cinema = cinemaList.find(c => c.id === selectedCinema);

    if (onBooking) {
      onBooking({
        movieId: selectedMovie,
        movieTitle: movie?.title || 'Unknown',
        date: selectedDate,
        cinemaId: selectedCinema,
        cinemaName: cinema?.name || 'Unknown',
      });
    }

    // Reset form after booking
    setSelectedMovie('');
    setSelectedDate('');
    setSelectedCinema('');
  };

  return (
    <div className="w-full bg-surface-600 border-t border-b border-secondary-400 py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4">
        <form onSubmit={handleBooking}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Movie Dropdown */}
            <div>
              <label 
                htmlFor="movie-select" 
                className="block text-xs font-bold mb-2 uppercase tracking-wider text-text-secondary"
              >
                Select Movie
              </label>
              <select
                id="movie-select"
                value={selectedMovie}
                onChange={(e) => setSelectedMovie(e.target.value)}
                className="w-full px-4 py-3 bg-surface-500 border border-secondary-400 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300 text-text-primary rounded"
                required
              >
                <option value="">Choose a movie...</option>
                {movies.map(movie => (
                  <option key={movie.id} value={movie.id}>
                    {movie.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Input */}
            <div>
              <label 
                htmlFor="date-select" 
                className="block text-xs font-bold mb-2 uppercase tracking-wider text-text-secondary"
              >
                Select Date
              </label>
              <input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={today}
                className="w-full px-4 py-3 bg-surface-500 border border-secondary-400 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300 text-text-primary rounded"
                required
              />
            </div>

            {/* Cinema Dropdown */}
            <div>
              <label 
                htmlFor="cinema-select" 
                className="block text-xs font-bold mb-2 uppercase tracking-wider text-text-secondary"
              >
                Select Cinema
              </label>
              <select
                id="cinema-select"
                value={selectedCinema}
                onChange={(e) => setSelectedCinema(e.target.value)}
                className="w-full px-4 py-3 bg-surface-500 border border-secondary-400 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300 text-text-primary rounded"
                required
              >
                <option value="">Choose a cinema...</option>
                {cinemaList.map(cinema => (
                  <option key={cinema.id} value={cinema.id}>
                    {cinema.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Buy Tickets Button */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-6 py-3 bg-primary-500 border border-secondary-400 text-text-primary font-bold uppercase tracking-widest hover:bg-primary-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-secondary-300 rounded shadow-lg"
              >
                Buy Tickets
              </button>
            </div>
          </div>
        </form>

        {/* Info Text */}
        {movies.length === 0 && (
          <div className="mt-4 text-center text-sm text-text-muted">
            No movies available for booking at the moment.
          </div>
        )}
      </div>
    </div>
  );
}

QuickBooking.propTypes = {
  movies: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    })
  ),
  cinemas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  onBooking: PropTypes.func,
};
