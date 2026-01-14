const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie");
const Hall = require("../models/Hall");
const Cinema = require("../models/Cinema");
const mongoose = require("mongoose");

// Utility function to validate time range
const isValidTimeRange = (start, end) => {
  return start && end && start < end;
};

// Utility function to format validation errors
const formatValidationErrors = (error) => {
  if (error.name === "ValidationError") {
    return Object.values(error.errors)
      .map((err) => err.message)
      .join(", ");
  }
  return error.message;
};

/**
 * @desc    Create a new showtime with comprehensive validation
 * @route   POST /api/showtimes
 * @access  Private/Admin
 */
exports.createShowtime = async (req, res) => {
  console.log('⏺️ CreateShowtime called. body=', JSON.stringify(req.body));
  try {
    const { movieId, hallId, startTime, price, totalSeats } = req.body;
    const { cinemaId } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!movieId) missingFields.push("movieId");
    if (!hallId) missingFields.push("hallId");
    if (!cinemaId) missingFields.push("cinemaId");
    if (!startTime) missingFields.push("startTime");
    if (!price) missingFields.push("price");
    if (!totalSeats) missingFields.push("totalSeats");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
        code: "VALIDATION_ERROR",
      });
    }

    // Validate price and seats
    if (price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative",
        code: "INVALID_PRICE",
      });
    }

    if (totalSeats < 1) {
      return res.status(400).json({
        success: false,
        message: "Total seats must be at least 1",
        code: "INVALID_SEATS",
      });
    }

    // Parse and validate start time
    const parsedStartTime = new Date(startTime);
    if (isNaN(parsedStartTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start time format. Use ISO 8601 format.",
        code: "INVALID_TIME_FORMAT",
      });
    }

    // Ensure start time is in the future
    const now = new Date();
    if (parsedStartTime <= now) {
      return res.status(400).json({
        success: false,
        message: "Start time must be in the future",
        code: "PAST_TIME",
      });
    }

    // Check if movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
        code: "MOVIE_NOT_FOUND",
      });
    }

    // Check if hall exists
    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
        code: "HALL_NOT_FOUND",
      });
    }

    // Validate cinema
    const cinema = await Cinema.findById(cinemaId);
    if (!cinema) {
      return res.status(404).json({
        success: false,
        message: "Cinema not found",
        code: "CINEMA_NOT_FOUND",
      });
    }

    // Validate hall capacity
    if (totalSeats > hall.capacity) {
      return res.status(400).json({
        success: false,
        message: `Cannot schedule ${totalSeats} seats in hall '${hall.name}' with capacity ${hall.capacity}`,
        code: "EXCEEDS_CAPACITY",
      });
    }

    // Calculate end time based on movie duration
    const endTime = new Date(parsedStartTime);
    endTime.setMinutes(endTime.getMinutes() + movie.duration);

    // CRITICAL: Check for overlapping showtimes (DOUBLE-BOOKING PREVENTION)
    const overlappingShowtime = await Showtime.checkOverlap(
      hallId,
      parsedStartTime,
      endTime
    );
    if (overlappingShowtime) {
      return res.status(409).json({
        success: false,
        message: `Hall is already booked from ${overlappingShowtime.startTime.toLocaleTimeString()} to ${overlappingShowtime.endTime.toLocaleTimeString()}`,
        code: "TIME_CONFLICT",
        conflict: {
          existingStart: overlappingShowtime.startTime,
          existingEnd: overlappingShowtime.endTime,
        },
      });
    }

    // Create the showtime
    const showtime = await Showtime.create({
      movieId,
      hallId,
      cinemaId: cinema?._id || undefined,
      startTime: parsedStartTime,
      endTime,
      date: parsedStartTime,
      price: parseFloat(price),
      totalSeats: parseInt(totalSeats),
      seatsAvailable: parseInt(totalSeats),
    });

    // Populate and return response
    const populatedShowtime = await Showtime.findById(showtime._id)
      .populate("movieId", "title duration posterImage genre language rating")
      .populate("hallId", "name capacity rows columns");
      populatedShowtime && (await populatedShowtime.populate("cinemaId", "name city"));

    res.status(201).json({
      success: true,
      message: "Showtime created successfully",
      data: populatedShowtime,
      code: "CREATED",
    });
  } catch (error) {
    console.error("❌ Create showtime error:", error);

    // Handle duplicate key error (unique constraint violation)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A showtime already exists in this hall at this start time",
        code: "DUPLICATE_SHOWTIME",
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: formatValidationErrors(error),
        code: "VALIDATION_ERROR",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while creating showtime",
      code: "SERVER_ERROR",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get all showtimes with advanced filtering and pagination
 * @route   GET /api/showtimes
 * @access  Public
 */
exports.getAllShowtimes = async (req, res) => {
  try {
    const {
      date,
      movieId,
      hallId,
      status = "scheduled",
      page = 1,
      limit = 20,
      fromDate,
      toDate,
      sortBy = "startTime",
      sortOrder = "asc",
    } = req.query;

    // Build query object
    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by specific date
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      query.startTime = {
        $gte: targetDate,
        $lt: nextDate,
      };
    }

    // Filter by date range
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setDate(to.getDate() + 1); // Include the end date

      query.startTime = {
        $gte: from,
        $lt: to,
      };
    }

    // Filter by movie
    if (movieId) {
      query.movieId = movieId;
    }

    // Filter by cinema (find halls that belong to the cinema)
    if (req.query.cinemaId) {
      const cinemaId = req.query.cinemaId;

      // Try to find halls that reference the cinema in common fields
      let halls = await Hall.find({ $or: [{ cinema: cinemaId }, { cinemaId: cinemaId }] }).select("_id name");

      // Fallback: if no halls found, try fuzzy match by cinema name
      if ((!halls || halls.length === 0) && mongoose && cinemaId) {
        try {
          const cinema = await Cinema.findById(cinemaId);
          if (cinema && cinema.name) {
            const firstWord = cinema.name.split(/\s+/)[0];
            halls = await Hall.find({ name: { $regex: firstWord, $options: 'i' } }).select("_id name");
          }
        } catch (e) {
          // ignore and continue without hall filter
        }
      }

      if (halls && halls.length > 0) {
        query.hallId = { $in: halls.map((h) => h._id) };
      } else {
        // If no halls discovered, set a filter that returns no results to indicate none
        query.hallId = { $in: [] };
      }
    }

    // Filter by hall
    if (hallId) {
      query.hallId = hallId;
    }

    // Only show future showtimes by default for scheduled status
    if (status === "scheduled") {
      query.startTime = { ...query.startTime, $gte: new Date() };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with performance optimization
    const [showtimes, totalCount] = await Promise.all([
      Showtime.find(query)
        .populate("movieId", "title duration posterImage genre language")
        .populate("hallId", "name capacity")
        .populate("cinemaId", "name city")
        .sort(sort)
        .limit(limitNum)
        .skip(skip)
        .lean(), // Use lean() for better performance
      Showtime.countDocuments(query),
    ]);

    // Calculate metadata
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      data: showtimes,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        date,
        movieId,
        hallId,
        status,
        fromDate,
        toDate,
      },
    });
  } catch (error) {
    console.error(" Get showtimes error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error while fetching showtimes",
      code: "SERVER_ERROR",
    });
  }
};

/**
 * @desc    Get single showtime by ID with full details
 * @route   GET /api/showtimes/:id
 * @access  Public
 */
exports.getShowtimeById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({
        success: false,
        message: "Invalid showtime ID",
        code: "INVALID_ID",
      });
    }

    const showtime = await Showtime.findById(id)
      .populate("movieId")
      .populate("hallId")
      .populate("cinemaId", "name city");

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime not found",
        code: "NOT_FOUND",
      });
    }

    res.status(200).json({
      success: true,
      data: showtime,
    });
  } catch (error) {
    console.error(" Get showtime by ID error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid showtime ID format",
        code: "INVALID_ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while fetching showtime",
      code: "SERVER_ERROR",
    });
  }
};

/**
 * @desc    Update a showtime with comprehensive validation
 * @route   PUT /api/showtimes/:id
 * @access  Private/Admin
 */
exports.updateShowtime = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find existing showtime
    const existingShowtime = await Showtime.findById(id);
    if (!existingShowtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime not found",
        code: "NOT_FOUND",
      });
    }

    // Prevent updates to completed or cancelled showtimes
    if (
      existingShowtime.status === "completed" ||
      existingShowtime.status === "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot update a ${existingShowtime.status} showtime`,
        code: "IMMUTABLE_STATUS",
      });
    }

    // Validate price if provided
    if (updates.price !== undefined && updates.price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative",
        code: "INVALID_PRICE",
      });
    }

    // Validate seats if provided
    if (updates.totalSeats !== undefined) {
      if (updates.totalSeats < 1) {
        return res.status(400).json({
          success: false,
          message: "Total seats must be at least 1",
          code: "INVALID_SEATS",
        });
      }

      // Check if reducing seats below booked count
      if (
        updates.totalSeats <
        existingShowtime.totalSeats - existingShowtime.seatsAvailable
      ) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce seats below ${
            existingShowtime.totalSeats - existingShowtime.seatsAvailable
          } (already booked)`,
          code: "SEATS_BELOW_BOOKED",
        });
      }

      // Update available seats proportionally
      updates.seatsAvailable =
        updates.totalSeats -
        (existingShowtime.totalSeats - existingShowtime.seatsAvailable);
    }

    // Handle time/hall changes (requires overlap check)
    if (updates.startTime || updates.hallId) {
      const newStartTime = updates.startTime
        ? new Date(updates.startTime)
        : existingShowtime.startTime;
      const newHallId = updates.hallId || existingShowtime.hallId;

      // Validate new start time
      if (newStartTime <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Start time must be in the future",
          code: "PAST_TIME",
        });
      }

      // Get movie for duration calculation
      const movieId = updates.movieId || existingShowtime.movieId;
      const movie = await Movie.findById(movieId);
      if (!movie) {
        return res.status(404).json({
          success: false,
          message: "Movie not found",
          code: "MOVIE_NOT_FOUND",
        });
      }

      // Calculate new end time
      const newEndTime = new Date(newStartTime);
      newEndTime.setMinutes(newEndTime.getMinutes() + movie.duration);

      // Check hall capacity if hall is changing
      if (updates.hallId) {
        const newHall = await Hall.findById(newHallId);
        if (!newHall) {
          return res.status(404).json({
            success: false,
            message: "Hall not found",
            code: "HALL_NOT_FOUND",
          });
        }

        const totalSeats = updates.totalSeats || existingShowtime.totalSeats;
        if (totalSeats > newHall.capacity) {
          return res.status(400).json({
            success: false,
            message: `Cannot schedule ${totalSeats} seats in hall '${newHall.name}' with capacity ${newHall.capacity}`,
            code: "EXCEEDS_CAPACITY",
          });
        }
      }

      // CRITICAL: Check for overlapping showtimes (excluding current)
      const overlappingShowtime = await Showtime.checkOverlap(
        newHallId,
        newStartTime,
        newEndTime,
        id
      );

      if (overlappingShowtime) {
        return res.status(409).json({
          success: false,
          message: `Hall is already booked from ${overlappingShowtime.startTime.toLocaleTimeString()} to ${overlappingShowtime.endTime.toLocaleTimeString()}`,
          code: "TIME_CONFLICT",
        });
      }

      // Update times and dates
      updates.startTime = newStartTime;
      updates.endTime = newEndTime;
      updates.date = newStartTime;
    }

    // Validate cinema update if provided
    if (updates.cinemaId) {
      const newCinema = await Cinema.findById(updates.cinemaId);
      if (!newCinema) {
        return res.status(404).json({
          success: false,
          message: "Cinema not found",
          code: "CINEMA_NOT_FOUND",
        });
      }
    }

    // Apply updates
    Object.keys(updates).forEach((key) => {
      existingShowtime[key] = updates[key];
    });

    // Save the updated showtime
    await existingShowtime.save();

    // Get populated result
    const updatedShowtime = await Showtime.findById(id)
      .populate("movieId", "title duration posterImage")
      .populate("hallId", "name capacity")
      .populate("cinemaId", "name city");

    res.status(200).json({
      success: true,
      message: "Showtime updated successfully",
      data: updatedShowtime,
      code: "UPDATED",
    });
  } catch (error) {
    console.error(" Update showtime error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate showtime detected",
        code: "DUPLICATE_SHOWTIME",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: formatValidationErrors(error),
        code: "VALIDATION_ERROR",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while updating showtime",
      code: "SERVER_ERROR",
    });
  }
};

/**
 * @desc    Delete/Cancel a showtime
 * @route   DELETE /api/showtimes/:id
 * @access  Private/Admin
 */
exports.deleteShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id);

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime not found",
        code: "NOT_FOUND",
      });
    }

    // Check if showtime has bookings
    const bookedSeats = showtime.totalSeats - showtime.seatsAvailable;
    if (bookedSeats > 0 && showtime.status === "scheduled") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel showtime with ${bookedSeats} booked seats. Consider marking as cancelled instead.`,
        code: "HAS_BOOKINGS",
      });
    }

    // Actually delete from database
    await Showtime.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Showtime deleted permanently",
      code: "DELETED",
    });
  } catch (error) {
    console.error(" Delete showtime error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid showtime ID format",
        code: "INVALID_ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while deleting showtime",
      code: "SERVER_ERROR",
    });
  }
};

/**
 * @desc    Cancel a showtime (soft delete)
 * @route   PUT /api/showtimes/:id/cancel
 * @access  Private/Admin
 */
exports.cancelShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id);

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: "Showtime not found",
        code: "NOT_FOUND",
      });
    }

    if (showtime.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Showtime is already cancelled",
        code: "ALREADY_CANCELLED",
      });
    }

    showtime.status = "cancelled";
    await showtime.save();

    res.status(200).json({
      success: true,
      message: "Showtime cancelled successfully",
      data: showtime,
      code: "CANCELLED",
    });
  } catch (error) {
    console.error(" Cancel showtime error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error while cancelling showtime",
      code: "SERVER_ERROR",
    });
  }
};

/**
 * @desc    Get showtimes by movie with date filtering
 * @route   GET /api/showtimes/movie/:movieId
 * @access  Public
 */
exports.getShowtimesByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { date, upcoming = true } = req.query;

    // Validate movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
        code: "MOVIE_NOT_FOUND",
      });
    }

    // Build query
    const query = {
      movieId,
      status: "scheduled",
    };

    // Filter by date if provided
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      query.startTime = {
        $gte: targetDate,
        $lt: nextDate,
      };
    }

    // Only upcoming showtimes by default
    if (upcoming === "true" || upcoming === true) {
      query.startTime = { ...query.startTime, $gte: new Date() };
    }

    const showtimes = await Showtime.find(query)
      .populate("hallId", "name capacity rows columns amenities")
      .populate("cinemaId", "name city")
      .sort({ startTime: 1 })
      .lean();

    // Group by date for better frontend display
    const groupedByDate = showtimes.reduce((acc, showtime) => {
      const dateKey = showtime.startTime.toISOString().split("T")[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(showtime);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        movie: {
          id: movie._id,
          title: movie.title,
          duration: movie.duration,
          posterImage: movie.posterImage,
          genre: movie.genre,
        },
        showtimes,
        groupedByDate,
        count: showtimes.length,
      },
    });
  } catch (error) {
    console.error(" Get showtimes by movie error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid movie ID format",
        code: "INVALID_ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while fetching showtimes",
      code: "SERVER_ERROR",
    });
  }
};

/**
 * @desc    Get showtimes by hall
 * @route   GET /api/showtimes/hall/:hallId
 * @access  Public/Admin
 */
exports.getShowtimesByHall = async (req, res) => {
  try {
    const { hallId } = req.params;
    const { date, status } = req.query;

    // Validate hall exists
    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
        code: "HALL_NOT_FOUND",
      });
    }

    // Build query
    const query = { hallId };

    if (status) {
      query.status = status;
    }

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      query.startTime = {
        $gte: targetDate,
        $lt: nextDate,
      };
    }

    const showtimes = await Showtime.find(query)
      .populate("movieId", "title duration posterImage")
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      data: {
        hall: {
          id: hall._id,
          name: hall.name,
          capacity: hall.capacity,
        },
        showtimes,
        count: showtimes.length,
      },
    });
  } catch (error) {
    console.error(" Get showtimes by hall error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error while fetching showtimes",
      code: "SERVER_ERROR",
    });
  }
};

/**
 * @desc    Check hall availability for a time range
 * @route   POST /api/showtimes/check-availability
 * @access  Public/Admin
 */
exports.checkAvailability = async (req, res) => {
  try {
    const { hallId, startTime, endTime, excludeShowtimeId } = req.body;

    if (!hallId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "hallId, startTime, and endTime are required",
        code: "MISSING_FIELDS",
      });
    }

    const parsedStart = new Date(startTime);
    const parsedEnd = new Date(endTime);

    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
        code: "INVALID_DATE_FORMAT",
      });
    }

    // Check for overlapping showtimes
    const overlapping = await Showtime.checkOverlap(
      hallId,
      parsedStart,
      parsedEnd,
      excludeShowtimeId
    );

    res.status(200).json({
      success: true,
      data: {
        hallId,
        startTime: parsedStart,
        endTime: parsedEnd,
        isAvailable: !overlapping,
        conflictingShowtime: overlapping
          ? {
              id: overlapping._id,
              startTime: overlapping.startTime,
              endTime: overlapping.endTime,
              movie: overlapping.movieId?.title || "Unknown Movie",
            }
          : null,
      },
    });
  } catch (error) {
    console.error(" Check availability error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error while checking availability",
      code: "SERVER_ERROR",
    });
  }
};
