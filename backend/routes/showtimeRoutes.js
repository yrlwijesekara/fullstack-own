const express = require("express");
const router = express.Router();
const {
  createShowtime,
  getShowtimes,
  getShowtimeById,
  updateShowtime,
  deleteShowtime,
  getShowtimesByMovie,
} = require("../controllers/showtimeController");
const { protect } = require("../middleware/auth");

// Public routes (read-only)
router.get("/", getShowtimes);
router.get("/movie/:movieId", getShowtimesByMovie);
router.get("/:id", getShowtimeById);

// Protected routes (admin only)
router.post("/", protect, createShowtime);
router.put("/:id", protect, updateShowtime);
router.delete("/:id", protect, deleteShowtime);

module.exports = router;
