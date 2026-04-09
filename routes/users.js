const router = require('express').Router();
const User   = require('../models/User');

// Middleware: require login
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Login required.' });
  next();
}

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: user.toSafeObject() });
  } catch {
    res.status(400).json({ error: 'Invalid user ID.' });
  }
});

// PUT /api/users/profile  — update own profile
router.put('/profile/update', requireAuth, async (req, res) => {
  try {
    const { username, about, location, contacts, hourlyRate, profilePic } = req.body;

    // Username uniqueness
    if (username) {
      const taken = await User.findOne({ username, _id: { $ne: req.session.userId } });
      if (taken) return res.status(409).json({ error: 'Username already taken.' });
    }

    // Keep only 2 contact channels
    const cleanContacts = {};
    let kept = 0;
    for (const k of ['whatsapp', 'instagram', 'twitter']) {
      if (contacts?.[k] && kept < 2) { cleanContacts[k] = contacts[k]; kept++; }
      else cleanContacts[k] = null;
    }

    const user = await User.findByIdAndUpdate(
      req.session.userId,
      { $set: { username, about, location, contacts: cleanContacts, hourlyRate: hourlyRate || null, profilePic: profilePic || null, profileComplete: true } },
      { new: true, runValidators: true }
    );

    res.json({ user: user.toSafeObject() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Error updating profile.' });
  }
});

// GET /api/users  — providers list
router.get('/', async (req, res) => {
  try {
    const { profession, maxRate, minRating } = req.query;
    const filter = { role: 'provider', profileComplete: true };
    if (profession) filter.profession = profession;
    if (maxRate)    filter.hourlyRate = { $lte: Number(maxRate) };
    if (minRating)  filter.avgRating  = { $gte: Number(minRating) };

    const providers = await User.find(filter).select('-password').lean();
    res.json({ providers });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
