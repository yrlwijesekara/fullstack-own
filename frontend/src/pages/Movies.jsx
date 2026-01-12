import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import Navbar from '../components/Navbar';
import QuickBooking from '../components/QuickBooking';
import MovieCard from '../components/MovieCard';
import Modal from '../components/Modal';
import LoadingLogo from '../components/LoadingLogo';
import { fetchMovies, deleteMovie } from '../services/movieService';
import { getHalls } from '../services/hallService';

/**
 * Movies Page Component - Displays list of movies with tabs for Now Showing and Coming Soon
 */
export default function Movies() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('now-showing');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, movie: null });
  const [halls, setHalls] = useState([]);

  const isAdmin = user?.role === 'admin';

  // Load halls on mount
  useEffect(() => {
    loadHalls();
  }, []);

  // Load movies when tab changes
  useEffect(() => {
    loadMovies();
  }, [activeTab]);

  const loadHalls = async () => {
    try {
      const hallsData = await getHalls();
      console.log('Halls fetched in Movies page:', hallsData);
      setHalls(Array.isArray(hallsData) ? hallsData : []);
    } catch (error) {
      console.error('Error fetching halls:', error);
      setHalls([]);
    }
  };

  const loadMovies = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch both old and new status values for backward compatibility
      const statusNew = activeTab === 'now-showing' ? 'now_showing' : 'upcoming';
      const statusOld = activeTab === 'now-showing' ? 'Now Showing' : 'Coming Soon';
      
      const [dataNew, dataOld] = await Promise.all([
        fetchMovies({ status: statusNew, limit: 100 }),
        fetchMovies({ status: statusOld, limit: 100 })
      ]);
      
      // Combine and remove duplicates
      const allMovies = [...(dataNew.movies || []), ...(dataOld.movies || [])];
      const uniqueMovies = allMovies.filter((movie, index, self) => 
        index === self.findIndex((m) => m._id === movie._id)
      );
      setMovies(uniqueMovies);
    } catch (err) {
      setError(err.message);
      console.error('Error loading movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = (movie) => {
    navigate(`/movies/${movie._id || movie.id}`);
  };

  const handleEdit = (movie) => {
    navigate(`/movies/${movie._id || movie.id}/edit`);
  };

  const handleDeleteClick = (movie) => {
    setDeleteModal({ isOpen: true, movie });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMovie(deleteModal.movie._id || deleteModal.movie.id);
      setDeleteModal({ isOpen: false, movie: null });
      loadMovies(); // Reload movies after deletion
    } catch (err) {
      alert('Failed to delete movie: ' + err.message);
      console.error('Delete error:', err);
    }
  };

  const handleBooking = (bookingData) => {
    console.log('Booking:', bookingData);
    // Navigate to seat selection or show confirmation
    alert(`Booking for "${bookingData.movieTitle}" at ${bookingData.cinemaName} on ${bookingData.date}`);
    // TODO: Navigate to seat selection page
    // navigate(`/booking/${bookingData.movieId}?date=${bookingData.date}&cinema=${bookingData.cinemaId}`);
  };

  const handleAddMovie = () => {
    navigate('/movies/new');
  };

  return (
    <div className="min-h-screen bg-background-900">
      <Navbar />

      {/* Page Header with Tabs */}
      <div className="border-b border-secondary-400 bg-background-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Tab Navigation */}
            <div className="flex gap-6 md:gap-8">
              <button
                onClick={() => setActiveTab('now-showing')}
                className={`text-sm md:text-base font-bold uppercase tracking-widest pb-2 transition ${
                  activeTab === 'now-showing'
                    ? 'border-b-4 border-secondary-300 text-secondary-300'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                Now Showing
              </button>
              <button
                onClick={() => setActiveTab('coming-soon')}
                className={`text-sm md:text-base font-bold uppercase tracking-widest pb-2 transition ${
                  activeTab === 'coming-soon'
                    ? 'border-b-4 border-secondary-300 text-secondary-300'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                Coming Soon
              </button>
            </div>

            {/* Admin: Add Movie Button */}
            {isAdmin && (
              <button
                onClick={handleAddMovie}
                className="px-6 py-2 bg-primary-500 text-text-primary font-bold uppercase tracking-wider hover:bg-primary-600 transition border border-secondary-400 text-sm rounded-lg shadow-lg"
              >
                + Add Movie
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Booking Widget */}
      <QuickBooking 
        movies={movies.map(movie => ({
          id: movie._id,
          title: movie.title,
        }))}
        cinemas={halls.map(hall => ({
          id: hall._id,
          name: hall.name,
        }))}
        onBooking={handleBooking}
        navigate={navigate}
      />

      {/* Movies Grid Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <LoadingLogo size={80} text="Loading movies..." />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-20 px-4">
            <div className="text-semantic-error text-6xl mb-4">⚠</div>
            <p className="text-semantic-error font-bold text-lg mb-2">Error Loading Movies</p>
            <p className="text-text-muted mb-4">{error}</p>
            <button
              onClick={loadMovies}
              className="px-6 py-2 bg-primary-500 text-text-primary font-bold uppercase tracking-wider hover:bg-primary-600 transition border border-secondary-400 rounded-lg shadow-lg"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && movies.length === 0 && (
          <div className="text-center py-20">
            <div className="text-secondary-400 text-6xl mb-4">🎬</div>
            <p className="text-text-secondary uppercase tracking-widest font-bold mb-2">
              No {activeTab === 'now-showing' ? 'Movies Showing' : 'Upcoming Movies'}
            </p>
            <p className="text-text-muted text-sm">
              Check back later for updates
            </p>
          </div>
        )}

        {/* Movies Grid */}
        {!loading && !error && movies.length > 0 && (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-text-muted text-sm uppercase tracking-wide">
                {movies.length} {movies.length === 1 ? 'Movie' : 'Movies'} Found
              </p>
            </div>

            {/* Grid of Movie Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  showAdminActions={isAdmin}
                  onClick={() => handleMovieClick(movie)}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        title="Delete Movie"
        message={`Are you sure you want to delete "${deleteModal.movie?.title}"? This action cannot be undone.`}
        onClose={() => setDeleteModal({ isOpen: false, movie: null })}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        theme="default"
      />
    </div>
  );
}
