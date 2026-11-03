const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const path = require('path');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dept_portal';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dept-portal-secret-key-2026';
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI, collectionName: 'sessions' }),
  cookie: { maxAge: 1000 * 60 * 60 * 24, secure: isProduction, sameSite: 'lax' }
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/auth', authRoutes);

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ message: 'Not found' });
  if (req.method !== 'GET') return next();
  const page = req.path === '/' ? 'index.html' : req.path.slice(1) + '.html';
  res.sendFile(path.join(__dirname, 'public', page), err => {
    if (err) res.status(404).send('Page not found');
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
