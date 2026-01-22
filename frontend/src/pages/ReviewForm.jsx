import { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import LoadingLogo from '../components/LoadingLogo';

export default function ReviewForm() {
  const { orderId, movieId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState({});

  const fetchOrder = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');

      if (orderId) {
        // Fetch order details for email-based review
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 401) {
            toast.error('Please log in to write a review');
            // Store the intended destination to redirect after login
            localStorage.setItem('redirectAfterLogin', `/review/${orderId}`);
            navigate('/login');
            return;
          } else if (response.status === 403) {
            // Order belongs to different account
            const errorData = await response.json().catch(() => ({}));
            const message = errorData.message || 'This order belongs to a different account';
            toast.error(message, { duration: 5000 });
            // Show additional helpful message
            toast('Please check the email that received this review link and log in with that account', { 
              duration: 6000,
              icon: 'ℹ️'
            });
            setTimeout(() => {
              localStorage.removeItem('redirectAfterLogin');
              navigate('/login');
            }, 2000);
            return;
          } else if (response.status === 404) {
            throw new Error('Order not found');
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to load order details');
          }
        }

        const data = await response.json();
        setOrder(data);

        // Initialize reviews object for each movie in the order
        const initialReviews = {};
        data.bookings?.forEach(booking => {
          const movieId = booking.showtimeId?.movieId?._id;
          if (movieId) {
            initialReviews[movieId] = { rating: 5, comment: '', movie: booking.showtimeId.movieId };
          }
        });
        setReviews(initialReviews);
      } else if (movieId) {
        // Fetch movie details for direct review
        const response = await fetch(`${API_BASE_URL}/movies/${movieId}`);
        if (!response.ok) throw new Error('Movie not found');

        const movieData = await response.json();

        // Initialize review for this single movie
        setReviews({
          [movieId]: { rating: 5, comment: '', movie: movieData }
        });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [orderId, movieId, navigate]);

  useEffect(() => {
    if (!user) {
      // Store redirect path before navigating to login
      if (orderId) {
        localStorage.setItem('redirectAfterLogin', `/review/${orderId}`);
      } else if (movieId) {
        localStorage.setItem('redirectAfterLogin', `/review/movie/${movieId}`);
      }
      navigate('/login');
      return;
    }
    fetchOrder();
  }, [user, fetchOrder, navigate, orderId, movieId]);

  const handleReviewChange = (movieId, field, value) => {
    setReviews(prev => ({
      ...prev,
      [movieId]: {
        ...prev[movieId],
        [field]: value,
      },
    }));
  };

  const submitReview = async (movieId) => {
    const review = reviews[movieId];
    if (!review.comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          movieId,
          rating: review.rating,
          comment: review.comment,
        }),
      });

      if (!response.ok) {
        const errResp = await response.json();
        throw new Error(errResp.message || 'Failed to submit review');
      }

      toast.success('Review submitted successfully!');
      // Remove this movie from reviews
      setReviews(prev => {
        const newReviews = { ...prev };
        delete newReviews[movieId];
        return newReviews;
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-900 flex items-center justify-center">
        <LoadingLogo />
      </div>
    );
  }

  // Only show Order Not Found if REVIEW is order-based
  if (orderId && !order) {
    return (
      <div className="min-h-screen bg-background-900 text-text-primary">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
            <button
              onClick={() => navigate('/')}
              className="bg-primary-500 text-white px-6 py-2 rounded-md hover:bg-primary-600"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const moviesToReview = Object.keys(reviews);

  return (
    <div className="min-h-screen bg-background-900 text-text-primary">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Write Reviews</h1>
          <p className="text-center mb-8 text-text-secondary">
            Share your experience with the movies you watched
          </p>

          {moviesToReview.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎬</div>
              <h2 className="text-2xl font-bold mb-4">All Reviews Submitted!</h2>
              <p className="text-text-secondary mb-6">
                Thank you for sharing your feedback. Your reviews help other movie lovers!
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-primary-500 text-white px-6 py-3 rounded-md hover:bg-primary-600 transition-colors"
              >
                Back to Home
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {moviesToReview.map(mid => {
                const review = reviews[mid];
                const movieObj = review.movie;

                return (
                  <div key={mid} className="bg-surface-500 p-6 rounded-lg shadow-lg">
                    <div className="flex items-center mb-4">
                      {movieObj.poster && (
                        <img
                          src={movieObj.poster}
                          alt={movieObj.title}
                          className="w-16 h-24 object-cover rounded-md mr-4"
                        />
                      )}
                      <div>
                        <h3 className="text-xl font-bold">{movieObj.title}</h3>
                        <p className="text-text-secondary">{Array.isArray(movieObj.genre) ? movieObj.genre.join(', ') : movieObj.genre}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Rating</label>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleReviewChange(mid, 'rating', star)}
                              className={`text-2xl ${
                                star <= review.rating ? 'text-accent-gold' : 'text-surface-400'
                              } hover:text-accent-gold transition-colors`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Your Review</label>
                        <textarea
                          value={review.comment}
                          onChange={(e) => handleReviewChange(mid, 'comment', e.target.value)}
                          placeholder="Share your thoughts about this movie..."
                          className="w-full p-3 bg-surface-600 border border-surface-400 rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary-500"
                          rows={4}
                          maxLength={500}
                        />
                        <p className="text-xs text-text-secondary mt-1">
                          {review.comment.length}/500 characters
                        </p>
                      </div>

                      <button
                        onClick={() => submitReview(mid)}
                        disabled={submitting || !review.comment.trim()}
                        className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Submitting...
                          </>
                        ) : (
                          'Submit Review'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}