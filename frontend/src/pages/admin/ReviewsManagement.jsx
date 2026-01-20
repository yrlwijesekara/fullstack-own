import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../utils/api';
import { toast } from 'react-toastify';
import Modal from '../../components/Modal';

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState([]);
  const [movieRatings, setMovieRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [stats, setStats] = useState({
    totalReviews: 0,
    totalMovies: 0
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/admin/all`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviews(data.reviews);
      setMovieRatings(data.movieRatings);
      setStats({
        totalReviews: data.totalReviews,
        totalMovies: data.totalMovies
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!selectedReview) return;

    try {
      const response = await fetch(`${API_BASE_URL}/reviews/admin/${selectedReview._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete review');
      }

      toast.success('Review deleted successfully');
      setShowDeleteModal(false);
      setSelectedReview(null);
      fetchReviews(); // Refresh the data
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  const getRatingDistribution = (ratings) => {
    const distribution = [0, 0, 0, 0, 0];
    ratings.forEach(rating => {
      distribution[rating - 1]++;
    });
    return distribution;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Reviews Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-600 rounded-lg p-4 border border-surface-400/30">
          <h3 className="text-lg font-semibold text-text-primary">Total Reviews</h3>
          <p className="text-3xl font-bold text-purple-400">{stats.totalReviews}</p>
        </div>
        <div className="bg-surface-600 rounded-lg p-4 border border-surface-400/30">
          <h3 className="text-lg font-semibold text-text-primary">Movies Reviewed</h3>
          <p className="text-3xl font-bold text-green-400">{stats.totalMovies}</p>
        </div>
        <div className="bg-surface-600 rounded-lg p-4 border border-surface-400/30">
          <h3 className="text-lg font-semibold text-text-primary">Average Rating</h3>
          <p className="text-3xl font-bold text-yellow-400">
            {movieRatings.length > 0
              ? (movieRatings.reduce((acc, movie) => acc + movie.averageRating, 0) / movieRatings.length).toFixed(1)
              : '0.0'
            }
          </p>
        </div>
      </div>

      {/* Movie Ratings Overview */}
      <div className="bg-surface-600 rounded-lg p-6 border border-surface-400/30">
        <h2 className="text-xl font-bold text-text-primary mb-4">Movie Ratings Overview</h2>
        <div className="space-y-4">
          {movieRatings.map((movie) => (
            <div key={movie.movieId} className="flex items-center justify-between p-4 bg-surface-500 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary">{movie.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex">{renderStars(Math.round(movie.averageRating))}</div>
                  <span className="text-text-secondary">
                    {movie.averageRating} ({movie.totalReviews} reviews)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-text-muted">Rating Distribution</div>
                <div className="flex gap-1 mt-1">
                  {getRatingDistribution(movie.ratings).map((count, index) => (
                    <div key={index} className="text-xs">
                      <div className="text-yellow-400">{index + 1}★</div>
                      <div className="text-text-secondary">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Reviews */}
      <div className="bg-surface-600 rounded-lg p-6 border border-surface-400/30">
        <h2 className="text-xl font-bold text-text-primary mb-4">All Reviews</h2>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="p-4 bg-surface-500 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="font-medium text-text-primary">
                      {review.userId?.firstName} {review.userId?.lastName}
                    </span>
                    <span className="text-text-muted text-sm">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="text-text-secondary">Movie: </span>
                    <span className="font-medium text-text-primary">{review.movieId?.title}</span>
                  </div>
                  <p className="text-text-primary">{review.comment}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedReview(review);
                    setShowDeleteModal(true);
                  }}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        title="Delete Review"
        message={`Are you sure you want to delete this review by ${selectedReview?.userId?.firstName} ${selectedReview?.userId?.lastName}?`}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedReview(null);
        }}
        onConfirm={handleDeleteReview}
        confirmText="Delete Review"
        theme="danger"
      />
    </div>
  );
}