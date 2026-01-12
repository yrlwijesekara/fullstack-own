const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const Snack = require('../models/Snack');
const Purchase = require('../models/Purchase');

// Helper to render a PDF receipt into base64
function generateReceiptBase64({ user, bookings = [], purchase = null }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(result.toString('base64'));
      });

      doc.fontSize(20).text('Enimate Receipt', { align: 'center' });
      doc.moveDown();
      if (user) {
        doc.fontSize(10).text(`User: ${user.name || user.email || user._id}`);
      }
      doc.text(`Date: ${new Date().toLocaleString()}`);
      doc.moveDown();

      let grandTotal = 0;

      if (bookings && bookings.length) {
        doc.fontSize(14).text('Bookings', { underline: true });
        bookings.forEach((b, idx) => {
          doc.fontSize(11).text(`${idx + 1}. Movie: ${b.showtimeId?.movieTitle || (b.showtimeId?.title || b.showtimeId)}\n   Showtime: ${new Date(b.showtimeId?.startTime || b.createdAt || Date.now()).toLocaleString()}\n   Seats: ${b.seats?.join(', ') || ''}\n   Price: ${b.totalPrice}`);
          doc.moveDown(0.3);
          grandTotal += Number(b.totalPrice || 0);
        });
        doc.moveDown();
      }

      if (purchase) {
        doc.fontSize(14).text('Snacks / Purchases', { underline: true });
        purchase.items.forEach((it, idx) => {
          doc.fontSize(11).text(`${idx + 1}. ${it.name} x${it.quantity} — ${it.price * it.quantity}`);
          grandTotal += Number(it.price || 0) * Number(it.quantity || 0);
        });
        doc.moveDown();
      }

      doc.fontSize(12).text(`Grand Total: ${grandTotal}`, { align: 'right' });
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

exports.checkout = async (req, res) => {
  const user = req.user;
  const { items = [] } = req.body;

  if (!user) return res.status(401).json({ message: 'Authentication required' });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'No items provided' });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const ticketItems = items.filter(i => i.type === 'ticket');
    const snackItems = items.filter(i => i.type !== 'ticket');

    const createdBookings = [];

    // Process tickets: validate showtime and seats, reserve seats, create bookings
    for (const t of ticketItems) {
      const meta = t.meta || {};
      const showtimeId = meta.showtimeId;
      if (!showtimeId) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'ticket missing showtimeId' });
      }

      const showtime = await Showtime.findById(showtimeId).session(session);
      if (!showtime) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Showtime not found' });
      }

      const seats = meta.seats || [];
      const totalTickets = Number(meta.adultCount || 0) + Number(meta.childCount || 0);
      if (seats.length !== totalTickets) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Seat count must match ticket count' });
      }

      // Check seat conflicts
      const conflict = seats.find(s => showtime.bookedSeats.includes(s));
      if (conflict) {
        await session.abortTransaction();
        return res.status(409).json({ message: `Seat ${conflict} already booked` });
      }

      if (showtime.seatsAvailable < totalTickets) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Not enough seats available' });
      }

      const adultPrice = Number(showtime.price) || 0;
      const childPrice = adultPrice * 0.5;
      const totalPrice = Number(meta.adultCount || 0) * adultPrice + Number(meta.childCount || 0) * childPrice;

      // Reserve seats and update showtime
      showtime.bookedSeats.push(...seats);
      showtime.seatsAvailable = showtime.seatsAvailable - totalTickets;
      await showtime.save({ session });

      const bookingDocs = await Booking.create([
        {
          userId: user._id,
          showtimeId: showtime._id,
          seats,
          adultCount: meta.adultCount || 0,
          childCount: meta.childCount || 0,
          totalPrice,
        },
      ], { session });

      createdBookings.push(bookingDocs[0]);
    }

    let purchaseDoc = null;
    if (snackItems.length > 0) {
      let total = 0;
      const processedItems = [];
      for (const it of snackItems) {
        // find by snackId or productId
        const snack = it.snackId ? await Snack.findById(it.snackId).session(session) : (it.productId ? await Snack.findOne({ ProductId: it.productId }).session(session) : null);
        if (!snack) {
          await session.abortTransaction();
          return res.status(404).json({ message: `Snack not found: ${it.productId || it.snackId}` });
        }
        const qty = Number(it.quantity) || it.qty || 0;
        if (qty <= 0) {
          await session.abortTransaction();
          return res.status(400).json({ message: 'Invalid snack quantity' });
        }
        if (snack.ProductQuantity < qty) {
          await session.abortTransaction();
          return res.status(400).json({ message: `Insufficient stock for ${snack.ProductName}` });
        }

        snack.ProductQuantity = snack.ProductQuantity - qty;
        await snack.save({ session });

        const price = Number(snack.ProductPrice) || 0;
        total += price * qty;
        processedItems.push({ snackId: snack._id, productId: snack.ProductId, name: snack.ProductName, price, quantity: qty });
      }

      const purchaseDocs = await Purchase.create([
        {
          userId: user._id,
          items: processedItems,
          totalPrice: total,
        },
      ], { session });
      purchaseDoc = purchaseDocs[0];
    }

    await session.commitTransaction();
    session.endSession();

    // Generate PDF receipt
    const receiptBase64 = await generateReceiptBase64({ user, bookings: createdBookings, purchase: purchaseDoc });

    res.status(201).json({ success: true, bookings: createdBookings, purchase: purchaseDoc, receipt: receiptBase64 });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Checkout error:', err);
    res.status(500).json({ message: 'Server error during checkout' });
  }
};
