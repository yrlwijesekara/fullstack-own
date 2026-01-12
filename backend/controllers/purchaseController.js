const Purchase = require('../models/Purchase');
const Snack = require('../models/Snack');

// Create a snack purchase (protected)
exports.createPurchase = async (req, res) => {
  try {
    const { items = [] } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items provided' });
    }

    // Calculate total and validate stock
    let total = 0;
    const session = await Snack.startSession();
    session.startTransaction();

    try {
      const processedItems = [];
      for (const it of items) {
        // it: { productId or snackId, quantity }
        const snack = it.snackId ? await Snack.findById(it.snackId).session(session) : (it.productId ? await Snack.findOne({ ProductId: it.productId }).session(session) : null);
        if (!snack) {
          await session.abortTransaction();
          return res.status(404).json({ message: `Snack not found: ${it.productId || it.snackId}` });
        }
        const qty = Number(it.quantity) || 0;
        if (qty <= 0) {
          await session.abortTransaction();
          return res.status(400).json({ message: 'Invalid quantity' });
        }
        if (snack.ProductQuantity < qty) {
          await session.abortTransaction();
          return res.status(400).json({ message: `Insufficient stock for ${snack.ProductName}` });
        }

        // Decrement stock
        snack.ProductQuantity = snack.ProductQuantity - qty;
        await snack.save({ session });

        const price = Number(snack.ProductPrice) || 0;
        total += price * qty;

        processedItems.push({ snackId: snack._id, productId: snack.ProductId, name: snack.ProductName, price, quantity: qty });
      }

      // Save purchase
      const purchase = await Purchase.create([
        {
          userId: req.user._id,
          items: processedItems,
          totalPrice: total,
        },
      ], { session });

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({ success: true, purchase: purchase[0], message: 'Purchase created' });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error('Purchase creation error inner:', err);
      return res.status(500).json({ message: 'Server error processing purchase' });
    }
  } catch (err) {
    console.error('Purchase creation error:', err);
    res.status(500).json({ message: 'Server error creating purchase' });
  }
};

// Get purchases for user
exports.getUserPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({ userId: req.user._id });
    res.status(200).json({ success: true, purchases });
  } catch (err) {
    console.error('Get purchases error:', err);
    res.status(500).json({ message: 'Server error fetching purchases' });
  }
};

// Cancel a purchase and restock items
exports.cancelPurchase = async (req, res) => {
  const purchaseId = req.params.id;
  if (!purchaseId) return res.status(400).json({ message: 'Purchase id required' });

  const session = await Purchase.startSession();
  session.startTransaction();
  try {
    const purchase = await Purchase.findOne({ _id: purchaseId, userId: req.user._id }).session(session);
    if (!purchase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Purchase not found' });
    }
    if (purchase.canceled) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Purchase already canceled' });
    }

    // Restock snacks
    for (const it of purchase.items || []) {
      if (it.snackId) {
        const snack = await Snack.findById(it.snackId).session(session);
        if (snack) {
          snack.ProductQuantity = (snack.ProductQuantity || 0) + (it.quantity || 0);
          await snack.save({ session });
        }
      }
    }

    purchase.canceled = true;
    await purchase.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: 'Purchase canceled', purchase });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Cancel purchase error:', err);
    res.status(500).json({ message: 'Server error canceling purchase' });
  }
};
