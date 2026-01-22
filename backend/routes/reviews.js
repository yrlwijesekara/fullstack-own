const express = require('express');
const { protect } = require('../middleware/auth');
const Review = require('../models/Review');
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