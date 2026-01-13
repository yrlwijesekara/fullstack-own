const Order = require('../models/Order');

// Get orders for current user
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'bookings', populate: { path: 'showtimeId', populate: { path: 'movieId' } } })
      .populate('purchase');
    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};
