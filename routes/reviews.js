const router = require('express').Router();
const Review = require('../models/Review');
const User   = require('../models/User');

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Login required.' });
  next();
}

// GET /api/reviews/:providerId  — get all reviews for a provider
router.get('/:providerId', async (req, res) => {
  try {
    const reviews = await Review.find({ providerId: req.params.providerId })
      .sort({ createdAt: -1 }).lean();
    // Compute average rating
    const avg = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;
    res.json({ reviews, avgRating: avg, count: reviews.length });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/reviews/:providerId  — submit a review (customers only)
router.post('/:providerId', requireAuth, async (req, res) => {
  try {
    const { rating, text, customerName } = req.body;
    if (!rating || !text) return res.status(400).json({ error: 'Rating and text are required.' });

    // Check requester is a customer
    const me = await User.findById(req.session.userId);
    if (!me || me.role !== 'customer')
      return res.status(403).json({ error: 'Only customers can leave reviews.' });

    // Upsert — update if already reviewed
    const review = await Review.findOneAndUpdate(
      { providerId: req.params.providerId, customerId: req.session.userId },
      { rating: Number(rating), text, customerName: me.name },
      { upsert: true, new: true }
    );

    // Recompute avg and update provider's avgRating field
    const all = await Review.find({ providerId: req.params.providerId });
    const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
    await User.findByIdAndUpdate(req.params.providerId, { avgRating: avg });

    res.status(201).json({ review });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ error: 'You have already reviewed this provider.' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
