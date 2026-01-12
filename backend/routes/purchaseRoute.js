const express = require('express');
const { createPurchase, getUserPurchases, cancelPurchase } = require('../controllers/purchaseController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createPurchase);
router.get('/', protect, getUserPurchases);
router.delete('/:id', protect, cancelPurchase);

module.exports = router;
