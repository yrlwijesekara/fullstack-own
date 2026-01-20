const express = require('express');
const { protect } = require('../middleware/auth');
const Review = require('../models/Review');
// Order import kept for backward-compatibility if needed in future flows
const Order = require('../models/Order');
const adminMiddleware = require('../middleware/adminMiddleware');
const Movie = require('../models/Movie');

const router = express.Router();

// Get reviews for a movie
router.get('/movie/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const reviews = await Review.find({ movieId })
      // populate user's first and last name (User schema uses firstName/lastName)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a review — authenticated users can submit a review (orderId optional)
router.post('/', protect, async (req, res) => {
  try {
    const { movieId, rating, comment } = req.body;
    const userId = req.user._id;

    // Check if user already reviewed this movie
    const existingReview = await Review.findOne({ userId, movieId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this movie' });
    }

    const review = new Review({
      userId,
      movieId,
      rating,
      comment,
    });

    await review.save();
    await review.populate('userId', 'firstName lastName email');

    res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this movie' });
    }
    console.error('Review post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a review
router.put('/:reviewId', protect, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    const review = await Review.findOneAndUpdate(
      { _id: reviewId, userId },
      { rating, comment },
      { new: true }
    ).populate('userId', 'firstName lastName email');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a review
router.delete('/:reviewId', protect, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findOneAndDelete({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes
// Get all reviews with movie information and overall ratings
router.get('/admin/all', protect, adminMiddleware, async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate('userId', 'firstName lastName email')
      .populate('movieId', 'title')
      .sort({ createdAt: -1 });

    // Get movie ratings summary
    const movieRatings = await Review.aggregate([
      {
        $group: {
          _id: '$movieId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratings: { $push: '$rating' }
        }
      },
      {
        $lookup: {
          from: 'movies',
          localField: '_id',
          foreignField: '_id',
          as: 'movie'
        }
      },
      {
        $unwind: '$movie'
      },
      {
        $project: {
          movieId: '$_id',
          title: '$movie.title',
          averageRating: { $round: ['$averageRating', 1] },
          totalReviews: 1,
          ratings: 1
        }
      },
      {
        $sort: { averageRating: -1 }
      }
    ]);

    res.json({
      reviews,
      movieRatings,
      totalReviews: reviews.length,
      totalMovies: movieRatings.length
    });
  } catch (error) {
    console.error('Admin reviews fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete review by admin
router.delete('/admin/:reviewId', protect, adminMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;