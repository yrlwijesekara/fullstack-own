const express = require('express');
const { createSnack, getproducts } = require('../controllers/snackController');

const router = express.Router();

router.post('/', createSnack);
router.get('/', getproducts);

module.exports = router;
