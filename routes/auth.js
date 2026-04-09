const router  = require('express').Router();
const User    = require('../models/User');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, profession } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ error: 'All fields are required.' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered.' });

    const user = await User.create({
      name, email, password, role,
      profession: role === 'provider' ? profession : null
    });

    req.session.userId = user._id.toString();
    res.status(201).json({ user: user.toSafeObject() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

    req.session.userId = user._id.toString();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// GET /api/auth/me  — check current session
router.get('/me', async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.json({ user: null });
    res.json({ user: user.toSafeObject() });
  } catch {
    res.json({ user: null });
  }
});

module.exports = router;
