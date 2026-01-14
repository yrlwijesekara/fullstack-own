const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const Snack = require('../models/Snack');
const Purchase = require('../models/Purchase');
const Order = require('../models/Order');

// Helper to render a PDF receipt into base64
function generateReceiptBase64({ user, bookings = [], purchase = null }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true
      });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(result.toString('base64'));
      });

      // Professional color scheme
      const primaryColor = '#35003B'; // Dark purple
      const secondaryColor = '#5A1E66'; // Medium purple
      const accentColor = '#6A2A7A'; // Light purple
      const textColor = '#1a202c'; // Dark gray
      const lightGray = '#f7fafc'; // Light background
      const borderColor = '#e2e8f0'; // Light border

      // Header section with logo and company info
      doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);

      // Company logo and branding
      try {
        const logoPath = path.join(__dirname, '..', 'logo.jpeg');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 40, 25, { width: 60 });
          doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('ENIMATE', 120, 35);
          doc.fontSize(10).font('Helvetica').text('CINEMA & ENTERTAINMENT', 120, 60);
          doc.fontSize(8).text('Your Ultimate Movie Experience', 120, 75);
        } else {
          doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('ENIMATE', 40, 35);
          doc.fontSize(10).font('Helvetica').text('CINEMA & ENTERTAINMENT', 40, 60);
          doc.fontSize(8).text('Your Ultimate Movie Experience', 40, 75);
        }
      } catch (err) {
        console.error('Error loading logo:', err);
        doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('ENIMATE', 40, 35);
        doc.fontSize(10).font('Helvetica').text('CINEMA & ENTERTAINMENT', 40, 60);
        doc.fontSize(8).text('Your Ultimate Movie Experience', 40, 75);
      }

      // Receipt title
      doc.fillColor('white').fontSize(18).font('Helvetica-Bold').text('OFFICIAL RECEIPT', 0, 95, { align: 'center' });

      let yPos = 140;

      // Customer information box
      doc.rect(40, yPos, doc.page.width - 80, 50).fill(lightGray).stroke(borderColor);
      doc.fillColor(textColor).fontSize(12).font('Helvetica-Bold').text('CUSTOMER INFORMATION', 50, yPos + 10);
      doc.moveTo(50, yPos + 25).lineTo(doc.page.width - 50, yPos + 25).stroke(borderColor);

      if (user) {
        doc.fontSize(10).font('Helvetica').fillColor(textColor);
        doc.text(`Name: ${user.name || 'N/A'}`, 60, yPos + 30);
        doc.text(`Email: ${user.email || 'N/A'}`, 300, yPos + 30);
      }
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 60, yPos + 45);
      doc.text(`Time: ${new Date().toLocaleTimeString()}`, 300, yPos + 45);

      yPos += 70;

      let grandTotal = 0;

      // Movie Tickets Section
      if (bookings && bookings.length) {
        doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('MOVIE TICKETS', 40, yPos);
        yPos += 20;

        bookings.forEach((booking, idx) => {
          const showInfo = booking.showtimeInfo || {};

          // Booking item box
          doc.rect(40, yPos, doc.page.width - 80, 80).fill('white').stroke(borderColor);
          doc.fillColor(textColor).fontSize(11).font('Helvetica-Bold').text(`Booking #${booking._id.toString().slice(-8)}`, 50, yPos + 8);

          doc.fontSize(10).font('Helvetica').fillColor(textColor);
          doc.text(`Movie: ${showInfo.movieTitle || 'N/A'}`, 50, yPos + 25);
          doc.text(`Showtime: ${new Date(showInfo.startTime || booking.createdAt || Date.now()).toLocaleString()}`, 50, yPos + 40);
          if (booking.seats && booking.seats.length) {
            doc.text(`Seats: ${booking.seats.join(', ')}`, 50, yPos + 55);
          }

          doc.fontSize(12).font('Helvetica-Bold').fillColor(accentColor).text(`LKR ${Number(booking.totalPrice || 0).toLocaleString()}`, 0, yPos + 25, { align: 'right', width: doc.page.width - 50 });

          grandTotal += Number(booking.totalPrice || 0);
          yPos += 90;
        });
      }

      // Snacks Section
      if (purchase && purchase.items && purchase.items.length) {
        if (bookings && bookings.length) yPos += 10; // Add space between sections

        doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('CONCESSION ITEMS', 40, yPos);
        yPos += 20;

        purchase.items.forEach((item, idx) => {
          const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);

          // Item box
          doc.rect(40, yPos, doc.page.width - 80, 50).fill('white').stroke(borderColor);
          doc.fillColor(textColor).fontSize(11).font('Helvetica-Bold').text(item.name, 50, yPos + 8);
          doc.fontSize(10).font('Helvetica').fillColor(secondaryColor);
          doc.text(`Quantity: ${item.quantity} × LKR ${Number(item.price || 0).toLocaleString()}`, 50, yPos + 25);
          doc.fontSize(11).font('Helvetica-Bold').fillColor(accentColor).text(`LKR ${lineTotal.toLocaleString()}`, 0, yPos + 25, { align: 'right', width: doc.page.width - 50 });

          grandTotal += lineTotal;
          yPos += 60;
        });

        // Purchase ID
        if (purchase._id) {
          doc.fontSize(8).font('Helvetica').fillColor(secondaryColor).text(`Purchase ID: ${purchase._id}`, 40, yPos);
          yPos += 15;
        }
      }

      // Total section with professional styling
      yPos += 20;
      doc.rect(40, yPos, doc.page.width - 80, 40).fill(primaryColor).stroke(primaryColor);
      doc.fillColor('white').fontSize(16).font('Helvetica-Bold').text('TOTAL AMOUNT', 50, yPos + 12);
      doc.fontSize(18).font('Helvetica-Bold').fillColor('white').text(`LKR ${grandTotal.toLocaleString()}`, 0, yPos + 10, { align: 'right', width: doc.page.width - 50 });

      // Professional footer
      const footerY = doc.page.height - 60;
      doc.rect(0, footerY, doc.page.width, 60).fill(primaryColor);
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold').text('Thank you for choosing Enimate Cinema!', 0, footerY + 15, { align: 'center' });
      doc.fontSize(7).font('Helvetica').text('For inquiries: support@enimate.com | www.enimate.com', 0, footerY + 30, { align: 'center' });
      doc.fontSize(6).text('Terms: Tickets are non-refundable. Valid only for the specified showtime. No shows after 24 hours.', 0, footerY + 42, { align: 'center' });

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
    const createdBookingIds = [];
    let bookingsTotal = 0;

    // Process tickets: validate showtime and seats, reserve seats, create bookings
    for (const t of ticketItems) {
      const meta = t.meta || {};
      const showtimeId = meta.showtimeId;
      if (!showtimeId) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'ticket missing showtimeId' });
      }

      // populate movie for receipt display
      const showtime = await Showtime.findById(showtimeId).populate('movieId').session(session);
      if (!showtime) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Showtime not found' });
      }

      if (!showtime.cinemaId) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Showtime is missing cinema information. Please contact support.' });
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
      // attach showtime/movie info for receipt
      const bd = bookingDocs[0].toObject();
      bd.showtimeInfo = {
        startTime: showtime.startTime,
        movieTitle: showtime.movieId?.title || showtime.movieId || '',
        hallName: showtime.hallId || '',
        cinemaName: showtime.cinemaId || '',
      };
      createdBookings.push(bd);
      createdBookingIds.push(bookingDocs[0]._id);
      bookingsTotal += Number(totalPrice || 0);
    }

    let purchaseDoc = null;
    if (snackItems.length > 0) {
      let total = 0;
      const processedItems = [];
      for (const it of snackItems) {
        // find by snackId, productId or id (cart uses `id`)
        const identifier = it.snackId || it.productId || it.id;
        let snack = null;
        if (identifier) {
          // if looks like a Mongo ObjectId (24 hex chars) try findById first
          const maybeObjectId = typeof identifier === 'string' && /^[0-9a-fA-F]{24}$/.test(identifier);
          if (maybeObjectId) {
            snack = await Snack.findById(identifier).session(session);
          }
          // fallback to ProductId match
          if (!snack) {
            snack = await Snack.findOne({ ProductId: identifier }).session(session);
          }
        }
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
    // Create Order linking bookings and purchase within the same transaction
    const orderTotal = bookingsTotal + (purchaseDoc ? Number(purchaseDoc.totalPrice || 0) : 0);

    // Generate PDF receipt
    const receiptBase64 = await generateReceiptBase64({ user, bookings: createdBookings, purchase: purchaseDoc });

    const orderDocs = await Order.create([
      {
        userId: user._id,
        bookings: createdBookingIds,
        purchase: purchaseDoc ? purchaseDoc._id : null,
        totalPrice: orderTotal,
        receipt: receiptBase64,
      },
    ], { session });
    const orderDoc = orderDocs[0];

    await session.commitTransaction();
    session.endSession();

    // Populate order for response
    const populatedOrder = await Order.findById(orderDoc._id).populate({ path: 'bookings', populate: { path: 'showtimeId', populate: { path: 'movieId' } } }).populate('purchase');

    res.status(201).json({ success: true, order: populatedOrder, receipt: receiptBase64 });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Checkout error:', err);
    res.status(500).json({ message: 'Server error during checkout' });
  }
};
