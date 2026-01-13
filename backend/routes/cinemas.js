const express = require('express');
const router = express.Router();
const cinemaController = require('../controllers/cinemaController');
const { uploadSingle } = require('../middleware/upload');
const { requireAuth, requireAdmin } = require('../middleware/auth') || {};

// Public list
router.get('/', cinemaController.listCinemas);

// Create - protect for admins if auth middleware available
// Use field name 'image' for upload
router.post('/', uploadSingle('image', 'cinemas'), cinemaController.createCinema);

// Update cinema
router.put('/:id', uploadSingle('image', 'cinemas'), cinemaController.updateCinema);

// Delete cinema
router.delete('/:id', cinemaController.deleteCinema);

module.exports = router;
