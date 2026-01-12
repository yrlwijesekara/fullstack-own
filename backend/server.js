const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const connectDB = require("./config/db");
const seatSocket = require("./sockets/seatSocket");

// Import routes (each only once)
const authRoutes = require("./routes/auth");
const movieRoutes = require("./routes/movies");
const showtimeRoutes = require("./routes/showtimeRoutes");
const bookingRoutes = require("./routes/bookings");
const snackRoutes = require("./routes/snackRoute");
const hallRoutes = require("./routes/halls");
const seatRoutes = require("./routes/SeatRoutes");
const cinemaRoutes = require("./routes/cinemas");
const purchaseRoutes = require("./routes/purchaseRoute");
const checkoutRoutes = require("./routes/checkout");

// Import models
const Show = require("./models/Show");

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: ["https://enimate.netlify.app", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    credentials: true, // Allow cookies
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Make io available across the app
app.set("io", io);
seatSocket(io);

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/halls', hallRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/cinemas', cinemaRoutes);
app.use('/api/snacks', snackRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/checkout', checkoutRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5008;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});