const Showtime = require("../models/Showtime");

// @desc    Create a new showtime
// @route   POST /api/showtimes
exports.createShowtime = async (req, res) => {
  try {
    const { movieId, hallId, startTime, endTime, date, price } = req.body;

    // Basic validation
    if (!movieId || !hallId || !startTime || !endTime || !date) {
      return res.status(400).json({
        success: false,
        message: "Please provide movieId, hallId, startTime, endTime, and date",
      });
    }

    // Convert to Date objects
    const start = new Date(startTime);
    const end = new Date(endTime);
    const showDate = new Date(date);

    // Check if end time is after start time
    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    // Check for double booking (same hall, overlapping times)
    const conflictingShowtime = await Showtime.findOne({
      hallId,
      isActive: true,
      $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
    });

    if (conflictingShowtime) {
      return res.status(400).json({
        success: false,
        message: "Hall is already booked for this time slot",
      });
    }

    // Create showtime
    const showtime = await Showtime.create({
      movieId,
      hallId,
      startTime: start,
      endTime: end,
      date: showDate,
      price: price || 10.0,
      availableSeats: 100, // Default until Hall model exists
    });

    res.status(201).json({
      success: true,
      message: "Showtime created successfully",
      data: showtime,
    });
  } catch (error) {
    console.error("Create showtime error:", error);

    // Handle duplicate key error (double booking)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Double booking detected for this hall and time",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get all showtimes
// @route   GET /api/showtimes
exports.getShowtimes = async (req, res) => {
  try {
    const { movieId, date, hallId } = req.query;

    let filter = { isActive: true };

    if (movieId) filter.movieId = movieId;
    if (hallId) filter.hallId = hallId;
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      filter.date = { $gte: startDate, $lte: endDate };
    }

    const showtimes = await Showtime.find(filter).sort({
      date: 1,
      startTime: 1,
    });

    res.status(200).json({
      success: true,
      count: showtimes.length,
      data: showtimes,
    });
  } catch (error) {
    console.error("Get showtimes error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get single showtime by ID
// @route   GET /api/showtimes/:id
exports.getShowtimeById = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id);

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime not found",
      });
    }

    res.status(200).json({
      success: true,
      data: showtime,
    });
  } catch (error) {
    console.error("Get showtime error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update showtime
// @route   PUT /api/showtimes/:id
exports.updateShowtime = async (req, res) => {
  try {
    const { movieId, hallId, startTime, endTime, date, price, isActive } =
      req.body;

    let showtime = await Showtime.findById(req.params.id);

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime not found",
      });
    }

    // Check for conflicts if updating time/hall
    if ((startTime || endTime || hallId) && showtime.isActive) {
      const start = startTime ? new Date(startTime) : showtime.startTime;
      const end = endTime ? new Date(endTime) : showtime.endTime;
      const hall = hallId || showtime.hallId;

      // Check for conflicts excluding current showtime
      const conflictingShowtime = await Showtime.findOne({
        _id: { $ne: req.params.id },
        hallId: hall,
        isActive: true,
        $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
      });

      if (conflictingShowtime) {
        return res.status(400).json({
          success: false,
          message: "Hall is already booked for this time slot",
        });
      }
    }

    // Update fields
    if (movieId !== undefined) showtime.movieId = movieId;
    if (hallId !== undefined) showtime.hallId = hallId;
    if (startTime !== undefined) showtime.startTime = new Date(startTime);
    if (endTime !== undefined) showtime.endTime = new Date(endTime);
    if (date !== undefined) showtime.date = new Date(date);
    if (price !== undefined) showtime.price = price;
    if (isActive !== undefined) showtime.isActive = isActive;

    await showtime.save();

    res.status(200).json({
      success: true,
      message: "Showtime updated successfully",
      data: showtime,
    });
  } catch (error) {
    console.error("Update showtime error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Delete showtime
// @route   DELETE /api/showtimes/:id
exports.deleteShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id);

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime not found",
      });
    }

    // Soft delete - set isActive to false
    showtime.isActive = false;
    await showtime.save();

    res.status(200).json({
      success: true,
      message: "Showtime deleted successfully",
    });
  } catch (error) {
    console.error("Delete showtime error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get showtimes by movie
// @route   GET /api/showtimes/movie/:movieId
exports.getShowtimesByMovie = async (req, res) => {
  try {
    const showtimes = await Showtime.find({
      movieId: req.params.movieId,
      isActive: true,
      date: { $gte: new Date() }, // Only future showtimes
    }).sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: showtimes.length,
      data: showtimes,
    });
  } catch (error) {
    console.error("Get showtimes by movie error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
