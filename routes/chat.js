const router  = require('express').Router();
const Message = require('../models/Message');
const User    = require('../models/User');

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Login required.' });
  next();
}

// GET /api/chat/conversations  — list of people I've chatted with
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const myId = req.session.userId;

    // Find all messages where I'm sender or receiver
    const msgs = await Message.find({
      $or: [{ senderId: myId }, { receiverId: myId }]
    }).sort({ createdAt: -1 }).lean();

    // Collect unique other-user IDs, keep latest message per convo
    const convMap = {};
    for (const m of msgs) {
      const otherId = m.senderId.toString() === myId ? m.receiverId.toString() : m.senderId.toString();
      if (!convMap[otherId]) convMap[otherId] = m;
    }

    // Fetch user details
    const otherIds = Object.keys(convMap);
    const users = await User.find({ _id: { $in: otherIds } }).select('-password').lean();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const conversations = otherIds.map(id => ({
      user: userMap[id] || { _id: id, name: 'Unknown' },
      lastMessage: convMap[id]
    })).filter(c => c.user);

    res.json({ conversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/chat/messages/:otherUserId  — full chat history with one user
router.get('/messages/:otherUserId', requireAuth, async (req, res) => {
  try {
    const myId = req.session.userId;
    const roomId = Message.roomId(myId, req.params.otherUserId);
    const messages = await Message.find({ roomId }).sort({ createdAt: 1 }).lean();
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/chat/send  — REST fallback (socket is primary)
router.post('/send', requireAuth, async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    if (!receiverId || !text) return res.status(400).json({ error: 'receiverId and text required.' });

    const roomId = Message.roomId(req.session.userId, receiverId);
    const msg = await Message.create({
      roomId,
      senderId: req.session.userId,
      receiverId,
      text: text.trim()
    });
    res.status(201).json({ message: msg });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
