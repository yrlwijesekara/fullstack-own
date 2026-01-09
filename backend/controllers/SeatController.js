const Show = require("../models/Show");
const Hall = require("../models/Hall");

/**
 * CREATE – Initialize seats for a showtime
 */
exports.initializeSeats = async (req, res) => {
  try {
    const { showId } = req.body;

    if (!showId) {
      return res.status(400).json({ message: "showId is required" });
    }

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    const hall = await Hall.findById(show.hallId);
    if (!hall) {
      return res.status(404).json({ message: "Hall not found" });
    }

    show.seats = hall.layout.seats.map(seat => ({
      seatLabel: seat.label,
      status: "AVAILABLE",
    }));

    await show.save();
    res.json({ message: "Seats initialized", totalSeats: show.seats.length });
  } catch (error) {
    console.error("Error initializing seats:", error);
    res.status(500).json({ message: "Error initializing seats", error: error.message });
  }
};

/**
 * READ – Get seat map
 */
exports.getSeatMap = async (req, res) => {
  const show = await Show.findById(req.params.showId);
  res.json(show.seats);
};

/**
 * UPDATE – Lock seat (REAL-TIME)
 */
exports.lockSeat = async (req, res) => {
  const { showId, seatLabel } = req.body;
  const userId = req.user.id;
  const io = req.app.get("io");

  const show = await Show.findById(showId);
  const seat = show.seats.find(s => s.seatLabel === seatLabel);

  if (!seat || seat.status !== "AVAILABLE") {
    return res.status(409).json({ message: "Seat not available" });
  }

  seat.status = "LOCKED";
  seat.userId = userId;
  seat.lockedAt = new Date();

  await show.save();

  // 🔥 REAL-TIME UPDATE
  io.to(showId).emit("seatUpdate", {
    seatLabel,
    status: "LOCKED",
  });

  res.json({ message: "Seat locked" });
};

/**
 * UPDATE – Confirm booking
 */
exports.confirmSeat = async (req, res) => {
  const { showId, seatLabel } = req.body;
  const userId = req.user.id;
  const io = req.app.get("io");

  const show = await Show.findById(showId);
  const seat = show.seats.find(s => s.seatLabel === seatLabel);

  if (!seat || seat.userId.toString() !== userId) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  seat.status = "BOOKED";
  await show.save();

  io.to(showId).emit("seatUpdate", {
    seatLabel,
    status: "BOOKED",
  });

  res.json({ message: "Seat booked" });
};

/**
 * SYNC – Manually sync seats from hall to show
 */
exports.syncSeatsFromHall = async (req, res) => {
  try {
    const { showId } = req.body;

    if (!showId) {
      return res.status(400).json({ message: "showId is required" });
    }

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    const hall = await Hall.findById(show.hallId);
    if (!hall) {
      return res.status(404).json({ message: "Hall not found" });
    }

    // Preserve booked/locked seats
    const existingSeats = show.seats || [];
    const bookedSeats = existingSeats.filter(s => s.status === 'BOOKED' || s.status === 'LOCKED');
    
    // Create new seat map from hall layout
    const newSeats = hall.layout.seats.map(seat => ({
      seatLabel: seat.label,
      status: 'AVAILABLE',
      userId: null,
      lockedAt: null
    }));
    
    // Preserve booked/locked seats
    for (const bookedSeat of bookedSeats) {
      const seatIndex = newSeats.findIndex(s => s.seatLabel === bookedSeat.seatLabel);
      if (seatIndex !== -1) {
        newSeats[seatIndex] = bookedSeat;
      }
    }
    
    show.seats = newSeats;
    await show.save();

    res.json({ 
      message: "Seats synced successfully", 
      totalSeats: newSeats.length,
      preservedBookings: bookedSeats.length
    });
  } catch (error) {
    console.error("Error syncing seats:", error);
    res.status(500).json({ message: "Error syncing seats", error: error.message });
  }
};
