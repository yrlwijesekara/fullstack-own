const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const Order = require('../models/Order');
const Purchase = require('../models/Purchase');
const Snack = require('../models/Snack');

// Create a booking (protected)
exports.createBooking = async (req, res) => {
  const { showtimeId, seats = [], adultCount = 0, childCount = 0 } = req.body;

  if (!showtimeId) return res.status(400).json({ message: 'showtimeId is required' });
  const totalTickets = Number(adultCount) + Number(childCount);
  if (totalTickets <= 0) return res.status(400).json({ message: 'At least one ticket required' });
  if (seats.length !== totalTickets) return res.status(400).json({ message: 'Number of seats must match ticket count' });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const showtime = await Showtime.findById(showtimeId).session(session);
    if (!showtime) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Showtime not found' });
    }

    if (!showtime.cinemaId) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Showtime is missing cinema information. Please contact support.' });
    }

    // Check seat conflicts
    const conflict = seats.find((s) => showtime.bookedSeats.includes(s));
    if (conflict) {
      await session.abortTransaction();
      return res.status(409).json({ message: `Seat ${conflict} is already booked` });
    }

    if (showtime.seatsAvailable < totalTickets) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Not enough seats available' });
    }

    // Price calculation: adult = full, child = 50% (simple rule)
    const adultPrice = Number(showtime.price) || 0;
    const childPrice = adultPrice * 0.5;
    const totalPrice = adultCount * adultPrice + childCount * childPrice;

    // Reserve seats
    showtime.bookedSeats.push(...seats);
    showtime.seatsAvailable = showtime.seatsAvailable - totalTickets;
    await showtime.save({ session });

    const booking = await Booking.create([
      {
        userId: req.user._id,
        showtimeId,
        seats,
        adultCount,
        childCount,
        totalPrice,
      },
    ], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, booking: booking[0], message: 'Booking created' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Booking creation error:', error);
    res.status(500).json({ message: 'Server error creating booking' });
  }
};

// Get bookings for current user
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id }).populate('showtimeId');
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
};

// Cancel a booking (protected)
exports.cancelBooking = async (req, res) => {
  const bookingId = req.params.id;
  if (!bookingId) return res.status(400).json({ message: 'Booking id required' });

  const session = await Booking.startSession();
  session.startTransaction();
  try {
    const booking = await Booking.findOne({ _id: bookingId, userId: req.user._id }).session(session);
    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.canceled) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Booking already canceled' });
    }

    const showtime = await Showtime.findById(booking.showtimeId).session(session);
    if (!showtime) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Associated showtime not found' });
    }

    // Remove seats from bookedSeats
    const seatsToRelease = booking.seats || [];
    showtime.bookedSeats = showtime.bookedSeats.filter(s => !seatsToRelease.includes(s));
    showtime.seatsAvailable = (showtime.seatsAvailable || 0) + seatsToRelease.length;
    await showtime.save({ session });

    booking.canceled = true;
    await booking.save({ session });

    // Find the order containing this booking and cancel the entire order
    const order = await Order.findOne({ 
      userId: req.user._id, 
      bookings: bookingId 
    }).session(session);

    if (order) {
      // Cancel all bookings in the order
      if (order.bookings && order.bookings.length > 0) {
        for (const bId of order.bookings) {
          const b = await Booking.findById(bId).session(session);
          if (b && !b.canceled) {
            // Release seats back to showtime
            const st = await Showtime.findById(b.showtimeId).session(session);
            if (st) {
              const seatsToRelease = b.seats || [];
              st.bookedSeats = st.bookedSeats.filter(s => !seatsToRelease.includes(s));
              st.seatsAvailable = (st.seatsAvailable || 0) + seatsToRelease.length;
              await st.save({ session });
            }
            b.canceled = true;
            await b.save({ session });
          }
        }
      }

      // Cancel the purchase if exists
      if (order.purchase) {
        const purchase = await Purchase.findById(order.purchase).session(session);
        if (purchase && !purchase.canceled) {
          // Restock non-canceled snacks
          for (const it of purchase.items || []) {
            if (!it.canceled && it.snackId) {
              const snack = await Snack.findById(it.snackId).session(session);
              if (snack) {
                snack.ProductQuantity = (snack.ProductQuantity || 0) + (it.quantity || 0);
                await snack.save({ session });
              }
            }
          }
          // Mark all non-canceled items as canceled
          purchase.items = purchase.items.map(it => ({ ...it, canceled: true }));
          purchase.canceled = true;
          await purchase.save({ session });
        }
      }

      // Mark the order as cancelled
      order.status = 'cancelled';
      await order.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: 'Booking and entire order canceled', booking });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Cancel booking error:', err);
    res.status(500).json({ message: 'Server error canceling booking' });
  }
};
