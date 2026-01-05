const express = require('express');
const router = express.Router();
const {
  createMovie,
  getAllMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
  searchMovies,
} = require('../controllers/movieController');
const { protect, isAdmin } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// Public routes
/**
 * @route   GET /api/movies
 * @desc    Get all movies with pagination, filters, and sorting
 * @access  Public
 */
router.get('/', getAllMovies);

/**
 * @route   GET /api/movies/search
 * @desc    Advanced search for movies
 * @access  Public
 * @note    Must be before /:id route to avoid conflicts
 */
router.get('/search', searchMovies);

/**
 * @route   GET /api/movies/:id
 * @desc    Get single movie by ID
 * @access  Public
 */
router.get('/:id', getMovieById);

// Protected routes (Admin only)
/**
 * @route   POST /api/movies
 * @desc    Create a new movie
 * @access  Private/Admin
 */
router.post('/', protect, isAdmin, uploadSingle('posterImage'), createMovie);

/**
 * @route   PUT /api/movies/:id
 * @desc    Update a movie
 * @access  Private/Admin
 */
router.put('/:id', protect, isAdmin, uploadSingle('posterImage'), updateMovie);

/**
 * @route   DELETE /api/movies/:id
 * @desc    Delete a movie
 * @access  Private/Admin
 */
router.delete('/:id', protect, isAdmin, deleteMovie);

module.exports = router;
