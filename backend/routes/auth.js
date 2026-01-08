const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, updateProfile, getAllUsers, deleteUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/users', protect, getAllUsers);
router.delete('/users/:id', protect, deleteUser);

module.exports = router;
