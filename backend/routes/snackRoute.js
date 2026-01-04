const express = require('express');
const { createSnack } = require('../controllers/snackController');

const router = express.Router();

router.post('/', createSnack);

module.exports = router;
