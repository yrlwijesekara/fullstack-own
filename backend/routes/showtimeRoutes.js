const express = require("express");
const router = express.Router();
const {
  createShowtime,
  getAllShowtimes,
  getShowtimeById,
  updateShowtime,
  deleteShowtime,
  cancelShowtime,
  getShowtimesByMovie,
  getShowtimesByHall,
  checkAvailability,
} = require("../controllers/showtimeController");
const { protect, isAdmin } = require("../middleware/auth");

// ===================== PUBLIC ROUTES =====================
/**
 * @route   GET /api/showtimes
 * @desc    Get all showtimes with filtering and pagination
 * @access  Public
 */
router.get("/", getAllShowtimes);

/**
 * @route   GET /api/showtimes/movie/:movieId
 * @desc    Get showtimes for a specific movie
 * @access  Public
 */
router.get("/movie/:movieId", getShowtimesByMovie);

/**
 * @route   GET /api/showtimes/hall/:hallId
 * @desc    Get showtimes for a specific hall
 * @access  Public
 */
router.get("/hall/:hallId", getShowtimesByHall);

/**
 * @route   GET /api/showtimes/:id
 * @desc    Get a single showtime by ID
 * @access  Public
 */
router.get("/:id", getShowtimeById);

/**
 * @route   POST /api/showtimes/check-availability
 * @desc    Check if a hall is available for a given time range
 * @access  Public
 */
router.post("/check-availability", checkAvailability);

// ===================== PROTECTED ROUTES (Admin Only) =====================
/**
 * @route   POST /api/showtimes
 * @desc    Create a new showtime
 * @access  Private/Admin
 * @notes   Includes double-booking prevention logic
 */
router.post("/", protect, isAdmin, createShowtime);

/**
 * @route   PUT /api/showtimes/:id
 * @desc    Update a showtime
 * @access  Private/Admin
 * @notes   Includes validation and double-booking prevention
 */
router.put("/:id", protect, isAdmin, updateShowtime);

/**
 * @route   DELETE /api/showtimes/:id
 * @desc    Permanently delete a showtime
 * @access  Private/Admin
 * @notes   Only allowed if no bookings exist
 */
router.delete("/:id", protect, isAdmin, deleteShowtime);

/**
 * @route   PUT /api/showtimes/:id/cancel
 * @desc    Cancel a showtime (soft delete)
 * @access  Private/Admin
 * @notes   Marks showtime as cancelled, keeps in database
 */
router.put("/:id/cancel", protect, isAdmin, cancelShowtime);

module.exports = router;
