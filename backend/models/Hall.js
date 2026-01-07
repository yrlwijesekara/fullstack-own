const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hall name is required'],
      trim: true,
    },
    cinema: {
      type: String,
      required: [true, 'Cinema location is required'],
      trim: true,
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: [1, 'Total seats must be at least 1'],
      max: [1000, 'Total seats cannot exceed 1000'],
    },
    layout: {
      rows: {
        type: Number,
        required: true,
        min: 1,
        max: 50,
      },
      seatsPerRow: {
        type: Number,
        required: true,
        min: 1,
        max: 100,
      },
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
    status: {
      type: String,
      enum: ['active', 'maintenance', 'inactive'],
      default: 'active',
    },
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

module.exports = mongoose.model('Hall', hallSchema);
