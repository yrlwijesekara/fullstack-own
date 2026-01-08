const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getSeats,
  lockSeats,
  confirmSeats
} = require("../controllers/SeatController");

router.get("/:showId", getSeats);
router.post("/lock", auth, lockSeats);
router.post("/confirm", auth, confirmSeats);

module.exports = router;
