const express = require('express');
const { protect } = require('../middleware/auth');
const Review = require('../models/Review');
const Order = require('../models/Order');

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

// Add a review — require an orderId proving the user purchased/watched the movie
router.post('/', protect, async (req, res) => {
  try {
    const { movieId, rating, comment, orderId } = req.body;
    const userId = req.user._id;

    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required to submit a review' });
    }

    // Ensure the order belongs to the user and contains a booking for this movie
    const order = await Order.findOne({ _id: orderId, userId }).populate({ path: 'bookings', populate: { path: 'showtimeId', populate: { path: 'movieId' } } });
    if (!order) {
      return res.status(403).json({ message: 'Order not found or does not belong to user' });
    }

    const bookingForMovie = order.bookings.find(b => String(b.showtimeId?.movieId?._id || b.showtimeId?.movieId) === String(movieId));
    if (!bookingForMovie) {
      return res.status(403).json({ message: 'You can only review movies you purchased in this order' });
    }

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

module.exports = router;