const Screen = require("../models/Screen");
const Show = require("../models/Show");

// Get seat layout + availability
exports.getSeats = async (req, res) => {
  const show = await Show.findById(req.params.showId);
  const screen = await Screen.findById(show.screenId);

  const bookedSeats = show.bookedSeats.map(s => ({
    seatNumber: s.seatNumber,
    status: s.status
  }));

  res.json({ seats: screen.seats, bookedSeats });
};

// Lock selected seats
exports.lockSeats = async (req, res) => {
  const { showId, seatNumbers } = req.body;
  const userId = req.user.id;

  const show = await Show.findById(showId);

  const alreadyTaken = show.bookedSeats.some(seat =>
    seatNumbers.includes(seat.seatNumber)
  );

  if (alreadyTaken)
    return res.status(400).json({ message: "Seat already taken" });

  seatNumbers.forEach(seat => {
    show.bookedSeats.push({
      seatNumber: seat,
      userId,
      status: "LOCKED",
      lockedAt: new Date()
    });
  });

  await show.save();
  res.json({ message: "Seats locked successfully" });
};

// Confirm booking
exports.confirmSeats = async (req, res) => {
  const { showId, seatNumbers } = req.body;
  const userId = req.user.id;

  const show = await Show.findById(showId);

  show.bookedSeats.forEach(seat => {
    if (
      seatNumbers.includes(seat.seatNumber) &&
      seat.userId.toString() === userId
    ) {
      seat.status = "BOOKED";
    }
  });

  await show.save();
  res.json({ message: "Seats booked successfully" });
};
