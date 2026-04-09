const router = require('express').Router();
const Post   = require('../models/Post');

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Login required.' });
  next();
}

// GET /api/posts?profession=Plumber
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.profession) filter.profession = req.query.profession;
    const posts = await Post.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/posts
router.post('/', requireAuth, async (req, res) => {
  try {
    const { userName, profession, description } = req.body;
    if (!profession || !description)
      return res.status(400).json({ error: 'Profession and description required.' });

    const post = await Post.create({
      userId: req.session.userId,
      userName,
      profession,
      description
    });
    res.status(201).json({ post });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await Post.findOneAndDelete({ _id: req.params.id, userId: req.session.userId });
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Delete failed.' });
  }
});

module.exports = router;
