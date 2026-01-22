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

// Get a single order for the current user (used by frontend when opening review link)
exports.getOrderById = async (req, res) => {
  try {
    console.log(`[Review] Fetching order ${req.params.id} for user ${req.user._id} (${req.user.email})`);
    
    // First, check if the order exists at all
    const orderExists = await Order.findById(req.params.id).populate('userId', 'email firstName lastName');
    
    if (!orderExists) {
      console.log(`[Review] Order ${req.params.id} does not exist in database`);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log(`[Review] Order exists, belongs to user ${orderExists.userId?._id} (${orderExists.userId?.email})`);

    // Now check if it belongs to the current user
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id })
      .populate({ path: 'bookings', populate: { path: 'showtimeId', populate: [{ path: 'movieId' }, { path: 'cinemaId' }, { path: 'hallId' }] } })
      .populate('purchase');

    if (!order) {
      // Order exists but doesn't belong to this user
      console.log(`[Review] Order ${req.params.id} belongs to ${orderExists.userId?.email}, not ${req.user.email}`);
      return res.status(403).json({ 
        message: `This order belongs to a different account (${orderExists.userId?.email}). Please log in with the correct account.`,
        wrongAccount: true,
        correctEmail: orderExists.userId?.email
      });
    }
    
    console.log(`[Review] Successfully fetched order for correct user`);
    res.status(200).json(order);
  } catch (err) {
    console.error('[Review] Get order by id error:', err);
    res.status(500).json({ message: 'Server error fetching order' });
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

// Delete order by admin
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    await Order.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (err) {
    console.error('Delete order error:', err);
    res.status(500).json({ message: 'Server error deleting order' });
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
