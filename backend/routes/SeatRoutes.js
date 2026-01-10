const express = require("express");
const router = express.Router();
const { protect, isAdmin } = require("../middleware/auth");
const {
  initializeSeats,
  getSeatMap,
  lockSeat,
  confirmSeat,
  syncSeatsFromHall
} = require("../controllers/SeatController");

// Public routes - Get seat layout from hall/show
router.get("/:showId", getSeatMap);

// Protected routes - Authenticated users
router.post("/lock", protect, lockSeat);
router.post("/confirm", protect, confirmSeat);

// Admin routes - Seat management
router.post("/initialize", protect, isAdmin, initializeSeats);
router.post("/sync", protect, isAdmin, syncSeatsFromHall);

module.exports = router;
