const mongoose = require("mongoose");

const showtimeSchema = new mongoose.Schema({
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    required: [true, "Movie ID is required"],
    index: true,
  },
  hallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hall",
    required: [true, "Hall ID is required"],
    index: true,
  },
  startTime: {
    type: Date,
    required: [true, "Start time is required"],
    index: true,
  },
  endTime: {
    type: Date,
    required: [true, "End time is required"],
  },
  date: {
    type: Date,
    required: [true, "Date is required"],
    index: true,
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
  },
  status: {
    type: String,
    enum: ["scheduled", "cancelled", "completed"],
    default: "scheduled",
  },
  seatsAvailable: {
    type: Number,
    required: true,
    default: 0,
  },
  totalSeats: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for double-booking prevention (UNIQUE constraint)
showtimeSchema.index({ hallId: 1, startTime: 1 }, { unique: true });

// Index for performance
showtimeSchema.index({ movieId: 1, date: 1 });
showtimeSchema.index({ date: 1, status: 1 });

// Pre-save middleware to calculate endTime and validate
showtimeSchema.pre("save", async function (next) {
  try {
    // Update timestamp
    this.updatedAt = Date.now();

    // Calculate end time if not provided
    if (!this.endTime && this.startTime && this.movieId) {
      const Movie = mongoose.model("Movie");
      const movie = await Movie.findById(this.movieId);
      if (movie && movie.duration) {
        this.endTime = new Date(this.startTime);
        this.endTime.setMinutes(this.endTime.getMinutes() + movie.duration);
      }
    }

    // Extract date from startTime if not provided
    if (this.startTime && !this.date) {
      const dateOnly = new Date(this.startTime);
      dateOnly.setHours(0, 0, 0, 0);
      this.date = dateOnly;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Static method to check for overlapping showtimes (CRITICAL FOR DOUBLE-BOOKING PREVENTION)
showtimeSchema.statics.checkOverlap = async function (
  hallId,
  newStartTime,
  newEndTime,
  excludeId = null
) {
  const query = {
    hallId,
    status: "scheduled",
    $or: [
      // Case 1: New showtime starts during existing showtime
      { startTime: { $lt: newEndTime }, endTime: { $gt: newStartTime } },
      // Case 2: New showtime ends during existing showtime
      { startTime: { $lte: newStartTime }, endTime: { $gte: newStartTime } },
      // Case 3: New showtime completely contains existing showtime
      { startTime: { $gte: newStartTime }, endTime: { $lte: newEndTime } },
    ],
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return await this.findOne(query);
};

// Instance method to check if showtime is bookable
showtimeSchema.methods.isBookable = function () {
  const now = new Date();
  return (
    this.status === "scheduled" &&
    this.seatsAvailable > 0 &&
    this.startTime > now
  );
};

// Virtual for duration (in minutes)
showtimeSchema.virtual("duration").get(function () {
  if (this.startTime && this.endTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  return 0;
});

module.exports = mongoose.model("Showtime", showtimeSchema);
