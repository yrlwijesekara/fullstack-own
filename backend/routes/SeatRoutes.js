const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  initializeSeats,
  getSeatMap,
  lockSeat,
  confirmSeat,
  syncSeatsFromHall
} = require("../controllers/SeatController");

router.post("/initialize", initializeSeats); // CREATE
router.post("/sync", syncSeatsFromHall);     // SYNC manually
router.get("/:showId", getSeatMap);           // READ
router.post("/lock", auth, lockSeat);         // UPDATE
router.post("/confirm", auth, confirmSeat);   // UPDATE

module.exports = router;
