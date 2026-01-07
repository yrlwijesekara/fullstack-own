const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    row: {
      type: Number,
      required: true,
      min: 0,
    },
    col: {
      type: Number,
      required: true,
      min: 0,
    },
    label: {
      type: String,
      // e.g. "A1", "B10"
    },
    type: {
      type: String,
      enum: ['regular', 'vip', 'accessible'],
      default: 'regular',
    },
    isActive: {
      type: Boolean,
      default: true, // false = blocked/removed seat
    },
  },
  { _id: false }
);

const hallSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hall name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'maintenance', 'closed'],
      default: 'active',
    },
    layout: {
      rows: {
        type: Number,
        required: true,
        min: 1,
      },
      cols: {
        type: Number,
        required: true,
        min: 1,
      },
      seats: {
        type: [seatSchema],
        default: [],
      },
    },
    totalSeats: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-calc totalSeats from active seats if not provided
hallSchema.pre('save', function (next) {
  if (this.layout && Array.isArray(this.layout.seats)) {
    this.totalSeats = this.layout.seats.filter((s) => s.isActive !== false).length;
  }
  next();
});

module.exports = mongoose.model('Hall', hallSchema);