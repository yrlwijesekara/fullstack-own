const mongoose = require('mongoose');

// Define seat schema for grid layout
const seatSchema = new mongoose.Schema(
  {
    row: { type: Number, required: true },
    col: { type: Number, required: true },
    label: { type: String }, // e.g. "A1"
    type: {
      type: String,
      enum: ['regular', 'vip', 'accessible'],
      default: 'regular',
    },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const hallSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hall name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    cinema: {
      type: String,
      required: [true, 'Cinema location is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'maintenance', 'inactive', 'closed'],
      default: 'active',
    },
    layout: {
      rows: {
        type: Number,
        required: true,
        min: 1,
        max: 50,
      },
      cols: {
        type: Number,
        required: true,
        min: 1,
        max: 100,
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
    features: [
      {
        type: String,
        enum: [
          'IMAX',
          '3D',
          '4DX',
          'Dolby Atmos',
          'Recliner Seats',
          'VIP',
          'Standard',
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
hallSchema.index({ cinema: 1, name: 1 });
hallSchema.index({ status: 1 });

// Virtual for full hall identifier
hallSchema.virtual('fullName').get(function () {
  return `${this.cinema} - ${this.name}`;
});

// Ensure virtuals are included in JSON
hallSchema.set('toJSON', { virtuals: true });
hallSchema.set('toObject', { virtuals: true });

// Auto-calculate totalSeats from active seats
hallSchema.pre('save', function (next) {
  if (this.layout && Array.isArray(this.layout.seats)) {
    this.totalSeats = this.layout.seats.filter((s) => s.isActive !== false).length;
  }
  next();
});

module.exports = mongoose.model('Hall', hallSchema);
