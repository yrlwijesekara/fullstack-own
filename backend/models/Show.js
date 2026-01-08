const mongoose = require("mongoose");

const bookedSeatSchema = new mongoose.Schema({
  seatNumber: String,
  userId: mongoose.Schema.Types.ObjectId,
  status: {
    type: String,
    enum: ["LOCKED", "BOOKED"],
    default: "LOCKED"
  },
  lockedAt: Date
});

const showSchema = new mongoose.Schema({
  movieId: mongoose.Schema.Types.ObjectId,
  screenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Screen"
  },
  showTime: Date,
  bookedSeats: [bookedSeatSchema]
});

module.exports = mongoose.model("Show", showSchema);
