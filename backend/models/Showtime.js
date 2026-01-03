const mongoose = require("mongoose");

const showtimeSchema = new mongoose.Schema(
  {
    movieId: {
      type: String, // TEMPORARY: Change to ObjectId later
      required: true,
    },
    hallId: {
      type: String, // TEMPORARY: Change to ObjectId later
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 10.0,
    },
    availableSeats: {
      type: Number,
      default: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent double booking in same hall
showtimeSchema.index({ hallId: 1, startTime: 1, endTime: 1 }, { unique: true });

module.exports = mongoose.model("Showtime", showtimeSchema);
