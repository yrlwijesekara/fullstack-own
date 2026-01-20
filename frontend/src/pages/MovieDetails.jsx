import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';
import Modal from '../components/Modal';
import LoadingLogo from '../components/LoadingLogo';
import { fetchMovieById, deleteMovie } from '../services/movieService';
import { API_BASE_URL } from '../utils/api';
import toast from 'react-hot-toast';

export default function MovieDetails() {
  // Get movie ID from URL path (e.g., /movies/123)
  const movieId = window.location.pathname.split('/')[2];
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [showDeleteReviewModal, setShowDeleteReviewModal] = useState(false);
  const [deleteReviewId, setDeleteReviewId] = useState(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (movieId) {
      loadMovie();
      loadReviews();
    }
    // eslint-disable-next-line
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

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/movie/${movieId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setReviewsLoading(false);
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
          <LoadingLogo size={80} text="Loading movie details..." />
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

  return (
    <div className="min-h-screen bg-background-900">
      <Navbar />

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <BackButton to="/movies" showText text="Back to Movies" />
      </div>

      {/* Trailer Section (responsive) */}
      <div className="w-full bg-surface-500 relative" style={{ aspectRatio: '16/5.4' }}>
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
            <div className="text-center px-4">
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
                      onClick={() => navigate(`/movies/${movie._id || movie.id}/edit`)}
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
                  className="w-full sm:w-auto px-6 sm:px-12 py-4 bg-primary-500 text-text-primary font-bold text-lg uppercase tracking-widest hover:bg-primary-600 transition border border-secondary-400 shadow-lg rounded-lg"
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
            {((movie.castImages && movie.castImages.length > 0) || (movie.cast && movie.cast.length > 0)) && (
              <div className="mb-8">
                <h2 className="text-xl font-bold uppercase tracking-wide mb-4 text-text-primary">Cast & Crew</h2>
                <div className="flex gap-6 overflow-x-auto pb-4">
                  {/* Display castImages if available */}
                  {movie.castImages && movie.castImages.length > 0 ? (
                    movie.castImages.map((castMember, index) => (
                      <div key={index} className="text-center flex-shrink-0">
                        {castMember.imageUrl ? (
                          <img
                            src={castMember.imageUrl}
                            alt={castMember.name}
                            className="w-20 h-20 rounded-full mx-auto mb-2 object-cover border-2 border-secondary-400"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-surface-500 mx-auto mb-2 flex items-center justify-center border-2 border-secondary-400">
                            <span className="text-2xl text-secondary-300">👤</span>
                          </div>
                        )}
                        <p className="text-xs font-medium uppercase max-w-[80px] truncate text-text-secondary">{castMember.name}</p>
                      </div>
                    ))
                  ) : (
                    /* Fallback to old cast array format */
                    movie.cast.map((actor, index) => (
                      <div key={index} className="text-center flex-shrink-0">
                        <div className="w-20 h-20 rounded-full bg-surface-500 mx-auto mb-2 flex items-center justify-center border-2 border-secondary-400">
                          <span className="text-2xl text-secondary-300">👤</span>
                        </div>
                        <p className="text-xs font-medium uppercase max-w-[80px] truncate text-text-secondary">{actor}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Quick Info & Sticky CTA */}
          <div>
            <div className="bg-surface-600 border border-secondary-400 p-6 lg:sticky lg:top-4 rounded-lg">
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
                    <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md inline-block ${
                      movie.status === 'now_showing' || movie.status === 'Now Showing'
                        ? 'bg-green-500/20 text-green-400 border border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.5)]'
                        : movie.status === 'upcoming' || movie.status === 'Coming Soon'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]'
                        : 'bg-red-500/20 text-red-400 border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.5)]'
                    }`}>
                      {movie.status === 'now_showing' ? 'Now Showing'
                        : movie.status === 'upcoming' ? 'Coming Soon'
                        : movie.status === 'archived' ? 'Archived'
                        : movie.status}
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
              <div className="text-5xl font-bold mb-2 text-secondary-300">
                {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}
              </div>
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-2xl text-accent-gold">
                    {star <= Math.round(reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0) ? '★' : '☆'}
                  </span>
                ))}
              </div>
              <p className="text-sm text-text-muted uppercase tracking-wide">
                Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviews.filter(r => r.rating === stars).length;
                const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="text-sm font-bold w-4 text-text-secondary">{stars}</span>
                    <span className="text-sm text-accent-gold">★</span>
                    <div className="flex-1 h-4 bg-surface-500 border border-secondary-400 rounded">
                      <div
                        className="h-full bg-accent-gold transition-all rounded-l"
                        style={{ width: `${percentage}%`, minWidth: percentage > 0 && percentage < 6 ? '6px' : undefined }}
                      />
                    </div>
                    <span className="text-sm text-text-muted w-12 text-right">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews are only accepted via order links — no direct review button here */}

          {/* User Reviews */}
          <div className="space-y-6 mb-8">
            {reviewsLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-text-secondary">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-bold mb-2 text-text-primary">No Reviews Yet</h3>
                <p className="text-text-secondary">Be the first to review this movie!</p>
              </div>
            ) : (
              // Show only the latest 3 reviews on the movie page; averages use full `reviews`
              reviews.slice(0, 3).map((review) => (
                <div key={review._id} className="p-6 border border-secondary-400 bg-surface-600 rounded-lg">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-12 h-12 rounded-full bg-surface-500 flex items-center justify-center border-2 border-secondary-400">
                      <span className="text-xl text-secondary-300">👤</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold uppercase text-sm text-text-primary">
                            {(
                              review.userId
                                ? ((review.userId.firstName || '') + ' ' + (review.userId.lastName || '')).trim() || review.userId.email || 'Anonymous'
                                : 'Anonymous'
                            )}
                          </p>
                          <div className="flex gap-1 text-sm text-accent-gold">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span key={i}>
                                {i < review.rating ? '★' : '☆'}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-text-muted">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {editingReviewId === review._id ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-text-muted">Rating:</label>
                            <select
                              value={editRating}
                              onChange={(e) => setEditRating(Number(e.target.value))}
                              className="bg-surface-500 border border-secondary-400 rounded px-2 py-1"
                            >
                              {[5,4,3,2,1].map((s) => (
                                <option key={s} value={s}>{s} ★</option>
                              ))}
                            </select>
                          </div>
                          <textarea
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            className="w-full bg-surface-500 border border-secondary-400 rounded p-2 text-sm text-text-secondary"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch(`${API_BASE_URL}/reviews/${editingReviewId}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify({ rating: editRating, comment: editComment }),
                                  });
                                  if (!res.ok) throw new Error('Failed to update review');
                                  const updated = await res.json();
                                  setReviews((prev) => prev.map(r => r._id === updated._id ? updated : r));
                                  setEditingReviewId(null);
                                  toast.success('Review updated successfully');
                                } catch (err) {
                                  toast.error(err.message || 'Failed to update review');
                                }
                              }}
                              className="px-3 py-1 bg-primary-500 text-text-primary rounded font-bold text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingReviewId(null)}
                              className="px-3 py-1 bg-surface-500 text-text-secondary rounded border border-secondary-400 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-text-secondary leading-relaxed">
                            {review.comment}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {/* Show edit/delete only to review author */}
                    {user && (() => {
                      const rid = review.userId?._id || review.userId;
                      if (String(rid) === String(user._id)) {
                        return (
                          <>
                            <button
                              onClick={() => {
                                setEditingReviewId(review._id);
                                setEditRating(review.rating || 5);
                                setEditComment(review.comment || '');
                              }}
                              className="px-3 py-1 bg-accent-blue text-white rounded text-sm font-bold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setDeleteReviewId(review._id);
                                setShowDeleteReviewModal(true);
                              }}
                              className="px-3 py-1 bg-semantic-error text-white rounded text-sm font-bold"
                            >
                              Delete
                            </button>
                          </>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Removed Load More Button — only latest 3 reviews are shown here */}
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

      {/* Review Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteReviewModal}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        onClose={() => { setShowDeleteReviewModal(false); setDeleteReviewId(null); }}
        onConfirm={async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/reviews/${deleteReviewId}`, {
              method: 'DELETE',
              credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to delete review');
            setReviews(prev => prev.filter(r => r._id !== deleteReviewId));
            setShowDeleteReviewModal(false);
            setDeleteReviewId(null);
            toast.success('Review deleted');
          } catch (err) {
            toast.error(err.message || 'Failed to delete review');
          }
        }}
        confirmText="Delete"
        theme="default"
      />
    </div>
  );
}