import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import Navbar from '../components/Navbar';
import HeroCarousel from '../components/HeroCarousel';
import QuickBooking from '../components/QuickBooking';
import MovieCard from '../components/MovieCard';
import { fetchMovies } from '../services/movieService';
import { getHalls } from '../services/hallService';

export default function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [nowShowingMovies, setNowShowingMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [halls, setHalls] = useState([]);
  const [selectedCinema, setSelectedCinema] = useState('');

  useEffect(() => {
    loadMovies();
    getHalls().then(setHalls).catch(() => setHalls([]));
  }, []);

  const loadMovies = async () => {
    setLoading(true);
    try {
      // Fetch featured movies for carousel (top rated or newest)
      const featured = await fetchMovies({ status: 'Now Showing', limit: 5, sort: '-rating' });
      setFeaturedMovies(featured.movies || []);

      // Fetch now showing movies for grid
      const nowShowing = await fetchMovies({ status: 'Now Showing', limit: 8 });
      setNowShowingMovies(nowShowing.movies || []);
    } catch (error) {
      console.error('Failed to load movies:', error);
      // Set empty arrays on error to prevent UI issues
      setFeaturedMovies([]);
      setNowShowingMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = (movie) => {
    navigate(`/movies/${movie._id || movie.id}`);
  };

  const handleBooking = (bookingData) => {
    console.log('Booking:', bookingData);
    alert(`Booking for "${bookingData.movieTitle}" at ${bookingData.cinemaName} on ${bookingData.date}`);
    // TODO: Navigate to seat selection page
    // navigate(`/booking/${bookingData.movieId}?date=${bookingData.date}&cinema=${bookingData.cinemaId}`);
  };

  return (
    <div className="min-h-screen bg-background-900">
      {/* Navigation */}
      <Navbar />

      {/* Hero Carousel */}
      <HeroCarousel movies={featuredMovies} autoPlay={true} interval={5000} />

      {/* Quick Booking Widget */}
      <QuickBooking
        movies={nowShowingMovies}
        cinemas={halls.map(hall => ({
          id: hall._id,
          name: hall.name,
        }))}
        onBooking={handleBooking}
        onCinemaChange={setSelectedCinema}
      />

      {selectedCinema && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
             {halls.find(h => h._id === selectedCinema)?.name || selectedCinema}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {halls.filter(hall => hall._id === selectedCinema).map(hall => (
              <div key={hall._id} className="p-4 bg-surface-600 rounded shadow">
                <h3 className="text-lg font-bold text-text-primary">{hall.name}</h3>
                <p className="text-text-muted">{hall.description}</p>
                <p className="text-xs text-text-secondary">Status: {hall.status}</p>
                <p className="text-xs text-text-secondary">Capacity: {hall.totalSeats}</p>
              </div>
            ))}
            {halls.filter(hall => hall._id === selectedCinema).length === 0 && (
              <div className="text-text-muted">No halls found for this cinema.</div>
            )}
          </div>
        </section>
      )}

      {/* Now Showing Movies Section */}
      <section id="movies" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary uppercase tracking-widest">
            Now Showing
          </h2>
          <button
            onClick={() => navigate('/movies')}
            className="text-sm font-bold uppercase tracking-wider text-secondary-300 hover:text-secondary-400 transition flex items-center gap-2"
          >
            View All
            <span className="text-lg">→</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-surface-400 border-t-secondary-300 mb-4"></div>
            <p className="text-text-secondary uppercase tracking-widest font-bold">Loading movies...</p>
          </div>
        ) : nowShowingMovies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {nowShowingMovies.map((movie) => (
              <MovieCard
                key={movie._id || movie.id}
                movie={movie}
                onClick={() => handleMovieClick(movie)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-secondary-400 text-6xl mb-4">🎬</div>
            <p className="text-text-secondary uppercase tracking-widest font-bold mb-2">
              No Movies Currently Showing
            </p>
            <p className="text-text-muted text-sm">
              Check back later for new releases
            </p>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-text-primary text-center mb-12">
          Why Choose Us?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-surface-600 rounded-lg border border-secondary-400 hover:border-secondary-300 transition">
            <div className="text-4xl mb-4">🎫</div>
            <h3 className="text-xl font-bold text-text-primary mb-2">
              Easy Booking
            </h3>
            <p className="text-text-muted">
              Simple and fast ticket booking process with just a few clicks
            </p>
          </div>
          <div className="p-6 bg-surface-600 rounded-lg border border-secondary-400 hover:border-secondary-300 transition">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-xl font-bold text-text-primary mb-2">
              Secure Payment
            </h3>
            <p className="text-text-muted">
              Safe and encrypted payment methods for your peace of mind
            </p>
          </div>
          <div className="p-6 bg-surface-600 rounded-lg border border-secondary-400 hover:border-secondary-300 transition">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-xl font-bold text-text-primary mb-2">
              Best Experience
            </h3>
            <p className="text-text-muted">
              Premium cinemas with latest technology and comfort
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background-800 border-t border-secondary-400 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-text-muted">
          <p>&copy; 2024 Cinema Booking System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
