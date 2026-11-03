const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, department, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ fullName, email, department, password });
    req.session.userId = user._id;

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: { id: user._id, fullName: user.fullName, email: user.email, department: user.department }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    req.session.userId = user._id;

    res.json({
      success: true,
      message: 'Login successful',
      user: { id: user._id, fullName: user.fullName, email: user.email, department: user.department }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  User.findById(req.session.userId).select('-password')
    .then(user => {
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      res.json({ success: true, user });
    })
    .catch(() => res.status(500).json({ success: false, message: 'Server error' }));
});

router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ success: false, message: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

module.exports = router;
