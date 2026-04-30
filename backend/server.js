require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDb } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function loadRoutes() {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/projects', require('./routes/projects'));
  app.use('/api', require('./routes/tasks'));
  app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // Works both locally (node run from /backend) and on Railway (run from repo root)
  // __dirname = /path/to/backend  →  ../frontend/dist  (local)
  // __dirname = /app/backend      →  ../frontend/dist  (Railway with startCommand: node backend/server.js)
  const distCandidate1 = path.join(__dirname, '..', 'frontend', 'dist');  // always correct
  const distCandidate2 = path.join(process.cwd(), 'frontend', 'dist');    // fallback if cwd is repo root
  const dist = fs.existsSync(distCandidate1) ? distCandidate1
             : fs.existsSync(distCandidate2) ? distCandidate2
             : null;

  if (dist) {
    app.use(express.static(dist));
    app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
    console.log('📦 Serving frontend from', dist);
  } else {
    console.log('⚠️  No frontend/dist found. Run: cd frontend && npm run build');
    app.get('/', (req, res) => res.send('API is running — frontend not built yet.'));
  }

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });
}

async function start() {
  try {
    await initDb();

    const { getDb } = require('./db/database');
    const db = getDb();
    const count = db.prepare('SELECT COUNT(*) as c FROM users').get();
    if (count.c === 0) {
      console.log('🌱 Seeding demo data...');
      await require('./seed')();
    }

    loadRoutes();
    app.listen(PORT, () => console.log(`🚀 TaskFlow running on port ${PORT}`));
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

start();
