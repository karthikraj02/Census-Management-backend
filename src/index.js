require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const censusRoutes = require('./routes/census');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', censusRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Run DB migrations then start server
async function bootstrap() {
  try {
    console.log('Running database migrations...');
    await db.migrate.latest();
    console.log('Migrations complete.');

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

bootstrap();
