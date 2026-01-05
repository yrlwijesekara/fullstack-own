const express = require('express');
const { createSnack, getproducts, deleteSnack } = require('../controllers/snackController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', createSnack);
router.get('/', protect, getproducts);
router.delete('/:snackid', protect, deleteSnack);

module.exports = router;

/*
{
  "firstName": "Admin",
  "email": "admin@example.com",
  "password": "Admin123!",
  "lastName": "User",
  "phone": "+1234567890",
  "role": "admin"
}
  */