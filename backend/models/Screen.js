const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
  seatNumber: String, // A1, A2
  row: String,        // A
  column: Number,     // 1
  type: {
    type: String,
    enum: ["NORMAL", "PREMIUM", "VIP"],
    default: "NORMAL"
  }
});

const screenSchema = new mongoose.Schema({
  name: { type: String, required: true },
  seats: [seatSchema]
});

module.exports = mongoose.model("Screen", screenSchema);
