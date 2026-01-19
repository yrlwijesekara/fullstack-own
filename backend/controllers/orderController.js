const Order = require('../models/Order');

// Get orders for current user
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'bookings', populate: { path: 'showtimeId', populate: [{ path: 'movieId' }, { path: 'cinemaId' }, { path: 'hallId' }] } })
      .populate('purchase');
    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

// Get all orders for admin
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .populate({ path: 'bookings', populate: { path: 'showtimeId', populate: { path: 'movieId' } } })
      .populate('purchase')
      .populate('userId', 'firstName lastName email');
    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error('Get all orders error:', err);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

// Cancel order by admin
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order already cancelled' });
    }
    order.status = 'cancelled';
    await order.save();
    res.status(200).json({ success: true, message: 'Order cancelled successfully' });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ message: 'Server error cancelling order' });
  }
};

// Get receipt for a specific order
exports.getOrderReceipt = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (!order.receipt) {
      return res.status(404).json({ message: 'Receipt not available for this order' });
    }
    res.status(200).json({ success: true, receipt: order.receipt });
  } catch (err) {
    console.error('Get receipt error:', err);
    res.status(500).json({ message: 'Server error fetching receipt' });
  }
};
