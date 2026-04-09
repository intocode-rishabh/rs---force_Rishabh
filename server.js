require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const mongoose   = require('mongoose');
const session    = require('express-session');
const path       = require('path');
const Message    = require('./models/Message');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*', credentials: true } });
const PORT   = process.env.PORT || 3000;

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas connected'))
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });

// Session
const sessionMiddleware = session({
  secret:            process.env.SESSION_SECRET || 'nh_secret_2024',
  resave:            false,
  saveUninitialized: false,
  cookie:            { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/users',   require('./routes/users'));
app.use('/api/posts',   require('./routes/posts'));
app.use('/api/chat',    require('./routes/chat'));
app.use('/api/ai',      require('./routes/ai'));
app.use('/api/reviews', require('./routes/reviews'));

// Page routes
const pagesDir = path.join(__dirname, 'public', 'pages');
app.get('/login',          (_, res) => res.sendFile(path.join(pagesDir, 'login.html')));
app.get('/register',       (_, res) => res.sendFile(path.join(pagesDir, 'login.html')));
app.get('/profile',        (_, res) => res.sendFile(path.join(pagesDir, 'profile.html')));
app.get('/find-service',   (_, res) => res.sendFile(path.join(pagesDir, 'find-service.html')));
app.get('/find-work',      (_, res) => res.sendFile(path.join(pagesDir, 'find-work.html')));
app.get('/how-to-service', (_, res) => res.sendFile(path.join(pagesDir, 'how-to-service.html')));
app.get('/',               (_, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Socket.io
io.use((socket, next) => sessionMiddleware(socket.request, {}, next));
io.on('connection', (socket) => {
  const userId = socket.request.session?.userId;
  if (!userId) return;
  socket.join(userId);
  socket.on('send_message', async ({ receiverId, text }) => {
    if (!receiverId || !text?.trim()) return;
    try {
      const roomId = Message.roomId(userId, receiverId);
      const msg    = await Message.create({ roomId, senderId: userId, receiverId, text: text.trim() });
      // Attach sender name for notification
      const User = require('./models/User');
      const sender = await User.findById(userId).select('name').lean();
      const payload = { ...msg.toObject(), _senderName: sender?.name || 'Someone' };
      io.to(userId).emit('new_message', payload);
      io.to(receiverId).emit('new_message', payload);
    } catch(e) { console.error(e.message); }
  });
});

app.use((req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found.' });
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => console.log(`\n🏘️  NeighbourHub → http://localhost:${PORT}\n`));
