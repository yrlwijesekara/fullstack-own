const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require('path');
const fs = require('fs');
require("dotenv").config();
const connectDB = require("./config/db");

// Import routes (each only once)
const authRoutes = require("./routes/auth");
const movieRoutes = require("./routes/movies");
const showtimeRoutes = require("./routes/showtimeRoutes");
const snackRoutes = require("./routes/snackRoute");
const hallRoutes = require("./routes/halls");

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
// Configure CORS origins via environment variable `CORS_ORIGINS`
// Example: CORS_ORIGINS="https://your-site.netlify.app,https://admin.example.com"
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // Allow cookies
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/halls',hallRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Always respond on root with a simple JSON so root doesn't 404
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Backend running' });
});

// If a frontend build exists (frontend/dist), serve it as static files
const clientDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  // Serve index.html for any non-API route (SPA fallback)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  // Simple API landing at root when no frontend build is present
  app.get('/', (req, res) => {
    res.status(200).json({ message: 'CinemaBookingSystem API', health: '/api/health' });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5008;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});