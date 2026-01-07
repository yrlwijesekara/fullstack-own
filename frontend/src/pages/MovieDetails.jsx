import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';
import Modal from '../components/Modal';
import { fetchMovieById, deleteMovie } from '../services/movieService';

export default function MovieDetails() {
  // Get movie ID from URL path (e.g., /movies/123)
  const movieId = window.location.pathname.split('/')[2];
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (movieId) {
      loadMovie();
    }
  }, [movieId]);

  const loadMovie = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMovieById(movieId);
      setMovie(data.movie || data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading movie:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMovie(movieId);
      setDeleteModal(false);
      navigate('/movies');
    } catch (err) {
      alert('Failed to delete movie: ' + err.message);
    }
  };

  const handleBuyTickets = (showtime = null) => {
    if (!user) {
      // Redirect to login if not authenticated
      alert('Please login to book tickets');
      navigate('/login');
      return;
    }
    
    // Navigate to movie showtimes page
    navigate(`/movies/${movieId}/showtimes`);
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-surface-400 border-t-secondary-300 mb-4"></div>
          <p className="text-text-secondary uppercase tracking-widest font-bold">Loading movie details...</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-background-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="text-semantic-error text-6xl mb-4">⚠</div>
          <p className="text-semantic-error font-bold text-lg mb-4">{error || 'Movie not found'}</p>
          <button
            onClick={() => navigate('/movies')}
            className="px-6 py-2 bg-primary-500 text-text-primary font-bold uppercase tracking-wider hover:bg-primary-600 border border-secondary-400 rounded-lg shadow-lg"
          >
            Back to Movies
          </button>
        </div>
      </div>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(movie.trailerUrl);

  // Sample showtime data (in production, this would come from API)
  const showtimes = [
    {
      cinema: 'Cinema Location A - Hall 1',
      times: ['11:00 AM', '2:00 PM', '5:00 PM', '8:00 PM', '11:00 PM']
    },
    {
      cinema: 'Cinema Location B - Hall 2',
      times: ['11:00 AM', '2:00 PM', '5:00 PM', '8:00 PM']
    },
    {
      cinema: 'Cinema Location C - Hall 3',
      times: ['11:00 AM', '2:00 PM', '5:00 PM', '8:00 PM']
    }
  ];

  return (
    <div className="min-h-screen bg-background-900">
      <Navbar />

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <BackButton to="/movies" showText text="Back to Movies" />
      </div>

      {/* Trailer Section */}
      <div className="w-full bg-surface-500 relative" style={{ height: '500px' }}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="Movie Trailer"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center border-b border-secondary-400">
            <div className="text-center">
              <div className="text-6xl mb-4 text-secondary-300">▷</div>
              <p className="text-text-secondary uppercase tracking-widest font-bold">Movie Trailer Placeholder</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Movie Info */}
          <div className="lg:col-span-2">
            {/* Title and Rating */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wide text-text-primary">{movie.title}</h1>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/movies/${movie.id}/edit`)}
                      className="px-4 py-2 bg-accent-blue text-white font-bold text-sm uppercase hover:bg-accent-blue/80 rounded shadow"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteModal(true)}
                      className="px-4 py-2 bg-semantic-error text-white font-bold text-sm uppercase hover:bg-semantic-error/80 rounded shadow"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span className="px-2 py-1 border-2 border-secondary-300 font-bold text-secondary-300">{movie.rating || 'NR'}</span>
                <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
                <span>{Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre}</span>
              </div>
            </div>

            {/* Buy Tickets Button - Primary CTA */}
            <div className="mb-8">
              <button
                onClick={() => handleBuyTickets()}
                className="w-full lg:w-auto px-12 py-4 bg-primary-500 text-text-primary font-bold text-lg uppercase tracking-widest hover:bg-primary-600 transition border border-secondary-400 shadow-lg rounded-lg"
              >
                🎫 Buy Tickets
              </button>
            </div>

            {/* Synopsis */}
            <div className="mb-8">
              <h2 className="text-xl font-bold uppercase tracking-wide mb-3 text-text-primary">Synopsis</h2>
              <p className="text-text-secondary leading-relaxed">{movie.description}</p>
            </div>

            {/* Cast & Crew */}
            {movie.cast && movie.cast.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold uppercase tracking-wide mb-4 text-text-primary">Cast & Crew</h2>
                <div className="flex gap-6 overflow-x-auto pb-4">
                  {movie.cast.map((actor, index) => (
                    <div key={index} className="text-center flex-shrink-0">
                      <div className="w-20 h-20 rounded-full bg-surface-500 mx-auto mb-2 flex items-center justify-center border-2 border-secondary-400">
                        <span className="text-2xl text-secondary-300">👤</span>
                      </div>
                      <p className="text-xs font-medium uppercase max-w-[80px] truncate text-text-secondary">{actor}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Showtime Selection */}
            <div className="border-t border-secondary-400 pt-8">
              <h2 className="text-xl font-bold uppercase tracking-wide mb-6 text-text-primary">Select Showtime</h2>
              
              {showtimes.map((location, locationIndex) => (
                <div key={locationIndex} className="mb-6 p-4 border border-secondary-400 bg-surface-600 rounded-lg">
                  <h3 className="font-bold uppercase tracking-wide mb-3 text-text-primary">{location.cinema}</h3>
                  <div className="flex flex-wrap gap-3">
                    {location.times.map((time, timeIndex) => (
                      <button
                        key={timeIndex}
                        onClick={() => handleBuyTickets({ cinema: location.cinema, time })}
                        className="px-6 py-2 border border-secondary-400 bg-surface-500 font-bold text-sm hover:bg-primary-500 hover:border-primary-500 transition text-text-primary rounded"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-6 text-center">
                <button
                  onClick={() => handleBuyTickets()}
                  className="px-8 py-3 bg-primary-500 text-text-primary font-bold uppercase tracking-wider hover:bg-primary-600 transition border border-secondary-400 rounded-lg shadow-lg"
                >
                  View All Showtimes & Book
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Info & Sticky CTA */}
          <div>
            <div className="bg-surface-600 border border-secondary-400 p-6 sticky top-4 rounded-lg">
              <h2 className="text-lg font-bold uppercase tracking-wide mb-4 text-text-primary">Quick Info</h2>
              
              <div className="space-y-3 text-sm mb-6">
                <div>
                  <p className="text-text-muted uppercase text-xs tracking-wider mb-1">Director</p>
                  <p className="font-bold text-text-secondary">{movie.director || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-text-muted uppercase text-xs tracking-wider mb-1">Release Date</p>
                  <p className="font-bold text-text-secondary">
                    {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <p className="text-text-muted uppercase text-xs tracking-wider mb-1">Duration</p>
                  <p className="font-bold text-text-secondary">{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</p>
                </div>
                
                <div>
                  <p className="text-text-muted uppercase text-xs tracking-wider mb-1">Language</p>
                  <p className="font-bold text-text-secondary">{movie.language || 'English'}</p>
                </div>
                
                <div>
                  <p className="text-text-muted uppercase text-xs tracking-wider mb-1">Country</p>
                  <p className="font-bold text-text-secondary">United States</p>
                </div>

                <div>
                  <p className="text-text-muted uppercase text-xs tracking-wider mb-1">Status</p>
                  <p className="font-bold">
                    <span className={`px-2 py-1 text-xs rounded ${
                      movie.status === 'Now Showing' ? 'bg-semantic-success/20 text-semantic-success border border-semantic-success' :
                      movie.status === 'Coming Soon' ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue' :
                      'bg-surface-400 text-text-muted border border-surface-400'
                    }`}>
                      {movie.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews & Ratings Section */}
        <div className="border-t border-secondary-400 mt-12 pt-8">
          <h2 className="text-2xl font-bold uppercase tracking-wide mb-6 text-text-primary">Reviews & Ratings</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Average Rating */}
            <div className="text-center p-8 border border-secondary-400 bg-surface-600 rounded-lg">
              <div className="text-5xl font-bold mb-2 text-secondary-300">{movie.rating || '0.0'}</div>
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-2xl text-accent-gold">
                    {star <= Math.round(movie.rating || 0) ? '★' : '☆'}
                  </span>
                ))}
              </div>
              <p className="text-sm text-text-muted uppercase tracking-wide">Based on 274 ratings</p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const percentage = stars === 5 ? 65 : stars === 4 ? 20 : stars === 3 ? 10 : stars === 2 ? 3 : 2;
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="text-sm font-bold w-4 text-text-secondary">{stars}</span>
                    <span className="text-sm text-accent-gold">★</span>
                    <div className="flex-1 h-4 bg-surface-500 border border-secondary-400 rounded">
                      <div
                        className="h-full bg-primary-500 transition-all rounded"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-text-muted w-12 text-right">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Write Review Button */}
          {user && (
            <div className="mb-8">
              <button className="px-8 py-3 bg-primary-500 text-text-primary font-bold uppercase tracking-wider hover:bg-primary-600 border border-secondary-400 rounded-lg shadow-lg">
                Write a Review
              </button>
            </div>
          )}

          {/* User Reviews */}
          <div className="space-y-6 mb-8">
            {/* Sample Review 1 */}
            <div className="p-6 border border-secondary-400 bg-surface-600 rounded-lg">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-full bg-surface-500 flex items-center justify-center border-2 border-secondary-400">
                  <span className="text-xl text-secondary-300">👤</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold uppercase text-sm text-text-primary">JOHN MILLER</p>
                      <div className="flex gap-1 text-sm text-accent-gold">
                        {'★★★★★'.split('').map((star, i) => (
                          <span key={i}>{star}</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-text-muted">Dec 14, 2024</p>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Absolutely amazing movie! The visuals were stunning and the story kept me engaged throughout. Highly recommend watching it in theaters.
                  </p>
                </div>
              </div>
            </div>

            {/* Sample Review 2 */}
            <div className="p-6 border border-secondary-400 bg-surface-600 rounded-lg">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-full bg-surface-500 flex items-center justify-center border-2 border-secondary-400">
                  <span className="text-xl text-secondary-300">👤</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold uppercase text-sm text-text-primary">JANE SMITH</p>
                      <div className="flex gap-1 text-sm text-accent-gold">
                        {'★★★★☆'.split('').map((star, i) => (
                          <span key={i}>{star}</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-text-muted">Dec 11, 2024</p>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Pretty good overall. Some pacing issues in the middle but the acting made up for it. Worth watching.
                  </p>
                </div>
              </div>
            </div>

            {/* Sample Review 3 */}
            <div className="p-6 border border-secondary-400 bg-surface-600 rounded-lg">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-full bg-surface-500 flex items-center justify-center border-2 border-secondary-400">
                  <span className="text-xl text-secondary-300">👤</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold uppercase text-sm text-text-primary">BOB WILSON</p>
                      <div className="flex gap-1 text-sm text-accent-gold">
                        {'★★★☆☆'.split('').map((star, i) => (
                          <span key={i}>{star}</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-text-muted">Dec 9, 2024</p>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Great movie but nothing memorable. Worth a watch but don't go in with too high expectations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Load More Button */}
          <div className="text-center">
            <button className="px-8 py-3 border border-secondary-400 bg-surface-600 text-text-primary font-bold uppercase tracking-wider hover:bg-primary-500 hover:border-primary-500 transition rounded-lg">
              Load More Reviews
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal}
        title="Delete Movie"
        message={`Are you sure you want to delete "${movie.title}"? This action cannot be undone.`}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        confirmText="Delete"
        theme="default"
      />
    </div>
  );
}
