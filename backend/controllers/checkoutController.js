const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendEmail } = require('../config/email');
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const Snack = require('../models/Snack');
const Purchase = require('../models/Purchase');
const Order = require('../models/Order');

// Generate HTML email receipt
function generateEmailReceipt(user, order, receiptBase64) {
  const orderId = order._id.toString().slice(-8);
  const reviewUrl = `${process.env.FRONTEND_URL}/review/${order._id}`;

  const displayName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name || user?.email || 'Customer';

  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: #35003B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">ENIMATE Cinema</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Your Ultimate Movie Experience</p>
      </div>
      
      <div style="background-color: white; padding: 20px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #35003B; margin-top: 0;">Order Receipt #${orderId}</h2>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #35003B;">Customer Information</h3>
          <p><strong>Name:</strong> ${displayName}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        </div>`;

  let totalAmount = 0;

  if (order.bookings && order.bookings.length > 0) {
    html += `
        <div style="margin: 20px 0;">
          <h3 style="color: #35003B;">Movie Tickets</h3>`;
    
    order.bookings.forEach(booking => {
      const showtime = booking.showtimeId;
      const movie = showtime?.movieId;
      totalAmount += booking.totalPrice || 0;
      
      html += `
          <div style="border: 1px solid #e9ecef; border-radius: 5px; padding: 15px; margin: 10px 0; background-color: #f8f9fa;">
            <h4 style="margin-top: 0; color: #35003B;">${movie?.title || 'Movie'}</h4>
            <p><strong>Cinema:</strong> ${showtime?.cinemaId?.name || showtime?.cinemaName || 'N/A'}</p>
            <p><strong>Hall:</strong> ${showtime?.hallId?.name || showtime?.hallName || 'N/A'}</p>
            <p><strong>Showtime:</strong> ${showtime ? new Date(showtime.startTime).toLocaleString() : 'N/A'}</p>
            <p><strong>Seats:</strong> ${booking.seats?.join(', ') || 'N/A'}</p>
            <p><strong>Tickets:</strong> ${booking.adultCount || 0} Adult${(booking.adultCount || 0) !== 1 ? 's' : ''}, ${booking.childCount || 0} Child${(booking.childCount || 0) !== 1 ? 'ren' : ''}</p>
            <p style="font-weight: bold; color: #35003B;">Price: LKR ${booking.totalPrice?.toLocaleString() || '0'}</p>
          </div>`;
    });
  }

  if (order.purchase && order.purchase.items && order.purchase.items.length > 0) {
    html += `
        <div style="margin: 20px 0;">
          <h3 style="color: #35003B;">Concessions</h3>`;
    
    order.purchase.items.forEach(item => {
      totalAmount += (item.price || 0) * (item.quantity || 0);
      
      html += `
          <div style="border: 1px solid #e9ecef; border-radius: 5px; padding: 15px; margin: 10px 0; background-color: #f8f9fa;">
            <h4 style="margin-top: 0; color: #35003B;">${item.name || 'Snack'}</h4>
            <p><strong>Quantity:</strong> ${item.quantity || 0}</p>
            <p><strong>Price per item:</strong> LKR ${(item.price || 0).toLocaleString()}</p>
            <p style="font-weight: bold; color: #35003B;">Subtotal: LKR ${((item.price || 0) * (item.quantity || 0)).toLocaleString()}</p>
          </div>`;
    });
  }

  html += `
        <div style="background-color: #35003B; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <h3 style="margin: 0;">Total Amount: LKR ${totalAmount.toLocaleString()}</h3>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${reviewUrl}" style="background-color: #F4C95D; color: #35003B; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Write a Review</a>
        </div>
        
        <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 12px; color: #6c757d;">
          <p><strong>Important:</strong> Please keep this receipt for your records. Show this receipt at the cinema entrance for movie tickets.</p>
          <p>For any inquiries, contact us at support@enimate.lk</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 12px;">
          <p>Thank you for choosing ENIMATE Cinema!</p>
          <p>© 2024 ENIMATE. All rights reserved.</p>
        </div>
      </div>
    </div>`;

  return html;
}

// Helper to render a PDF receipt into base64
function generateReceiptBase64({ user, bookings = [], purchase = null, paymentMethod = 'cash' }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40
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
        const pdfName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.email || 'N/A';
        doc.fontSize(10).font('Helvetica').fillColor(textColor);
        doc.text(`Name: ${pdfName}`, 60, yPos + 30);
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
          doc.rect(40, yPos, doc.page.width - 80, 90).fill('white').stroke(borderColor);
          doc.fillColor(textColor).fontSize(11).font('Helvetica-Bold').text(`Booking #${booking._id.toString().slice(-8)}`, 50, yPos + 8);

          doc.fontSize(10).font('Helvetica').fillColor(textColor);
          doc.text(`Movie: ${showInfo.movieTitle || 'N/A'}`, 50, yPos + 25);
          doc.text(`Cinema: ${showInfo.cinemaName || 'N/A'}`, 50, yPos + 35);
          doc.text(`Hall: ${showInfo.hallName || 'N/A'}`, 50, yPos + 45);
          doc.text(`Showtime: ${new Date(showInfo.startTime || booking.createdAt || Date.now()).toLocaleString()}`, 50, yPos + 55);
          if (booking.seats && booking.seats.length) {
            doc.text(`Seats: ${booking.seats.join(', ')}`, 50, yPos + 65);
          }

          doc.fontSize(12).font('Helvetica-Bold').fillColor(accentColor).text(`LKR ${Number(booking.totalPrice || 0).toLocaleString()}`, 0, yPos + 25, { align: 'right', width: doc.page.width - 50 });

          grandTotal += Number(booking.totalPrice || 0);
          yPos += 100;
        });
      }

      // Snacks Section
      if (purchase && purchase.items && purchase.items.length) {
        if (bookings && bookings.length) yPos += 5; // Reduce space between sections

        doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('CONCESSION ITEMS', 40, yPos);
        yPos += 20;

        purchase.items.forEach((item, idx) => {
          const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);

          // Item box
          doc.rect(40, yPos, doc.page.width - 80, 45).fill('white').stroke(borderColor); // Reduced height
          doc.fillColor(textColor).fontSize(11).font('Helvetica-Bold').text(item.name, 50, yPos + 8);
          doc.fontSize(10).font('Helvetica').fillColor(secondaryColor);
          doc.text(`Quantity: ${item.quantity} × LKR ${Number(item.price || 0).toLocaleString()}`, 50, yPos + 25);
          doc.fontSize(11).font('Helvetica-Bold').fillColor(accentColor).text(`LKR ${lineTotal.toLocaleString()}`, 0, yPos + 25, { align: 'right', width: doc.page.width - 50 });

          grandTotal += lineTotal;
          yPos += 50; // Reduced increment
        });

        // Purchase ID
        if (purchase._id) {
          doc.fontSize(8).font('Helvetica').fillColor(secondaryColor).text(`Purchase ID: ${purchase._id}`, 40, yPos);
          yPos += 10; // Reduced
        }
      }

      // Total section with professional styling
      yPos += 10; // Reduced
      doc.rect(40, yPos, doc.page.width - 80, 35).fill(primaryColor).stroke(primaryColor); // Reduced height
      doc.fillColor('white').fontSize(16).font('Helvetica-Bold').text('TOTAL AMOUNT', 50, yPos + 10);
      doc.fontSize(18).font('Helvetica-Bold').fillColor('white').text(`LKR ${grandTotal.toLocaleString()}`, 0, yPos + 8, { align: 'right', width: doc.page.width - 50 });

      // Payment Method
      yPos += 45;
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text(`PAYMENT METHOD: ${paymentMethod.toUpperCase()}`, 40, yPos);

      // Professional footer
      yPos += 20; // Position footer after total
      doc.rect(0, yPos, doc.page.width, 50).fill(primaryColor); // Reduced height
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold').text('Thank you for choosing Enimate Cinema!', 0, yPos + 10, { align: 'center' });
      doc.fontSize(7).font('Helvetica').text('For inquiries: support@enimate.com | www.enimate.com', 0, yPos + 25, { align: 'center' });
      doc.fontSize(6).text('Terms: Tickets are non-refundable. Valid only for the specified showtime. No shows after 24 hours.', 0, yPos + 35, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

exports.checkout = async (req, res) => {
  const user = req.user;
  const { items = [], paymentMethod = 'cash' } = req.body;

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
      const showtime = await Showtime.findById(showtimeId).populate('movieId').populate('cinemaId').populate('hallId').session(session);
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
        hallName: showtime.hallId?.name || showtime.hallId || '',
        cinemaName: showtime.cinemaId?.name || showtime.cinemaId || '',
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
    const receiptBase64 = await generateReceiptBase64({ user, bookings: createdBookings, purchase: purchaseDoc, paymentMethod });

    const orderDocs = await Order.create([
      {
        userId: user._id,
        bookings: createdBookingIds,
        purchase: purchaseDoc ? purchaseDoc._id : null,
        totalPrice: orderTotal,
        receipt: receiptBase64,
        paymentMethod,
      },
    ], { session });
    const orderDoc = orderDocs[0];

    await session.commitTransaction();
    session.endSession();

    // Populate order for response
    // Populate bookings -> showtimeId -> movieId, cinemaId and hallId so email/PDF have full info
    const populatedOrder = await Order.findById(orderDoc._id)
      .populate({
        path: 'bookings',
        populate: {
          path: 'showtimeId',
          populate: [
            { path: 'movieId' },
            { path: 'cinemaId' },
            { path: 'hallId' }
          ]
        }
      })
      .populate('purchase');

    // Send email receipt
    try {
      const emailHtml = generateEmailReceipt(user, populatedOrder, receiptBase64);
      await sendEmail(user.email, `ENIMATE - Order Receipt #${orderDoc._id.toString().slice(-8)}`, emailHtml);
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Don't fail the order if email fails
    }

    res.status(201).json({ success: true, order: populatedOrder, receipt: receiptBase64 });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Checkout error:', err);
    res.status(500).json({ message: 'Server error during checkout' });
  }
};

exports.createPaymentIntent = async (req, res) => {
  const { amount } = req.body; // amount in cents
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'lkr',
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
