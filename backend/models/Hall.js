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
    cinemaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cinema',
      required: function() {
        return this.isNew; // Only require for new documents
      },
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Hall name is required'],
      trim: true,
    },
    description: {
      type: String,
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
      partitions: {
        type: [Number], // Array of column indices where aisles exist
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

// Auto-sync seats to all shows when hall layout changes
hallSchema.post('save', async function(doc) {
  try {
    // Only sync if layout.seats was modified
    if (this.isModified('layout.seats')) {
      const Show = mongoose.model('Show');
      
      // Find all shows for this hall
      const shows = await Show.find({ hallId: doc._id });
      
      console.log(`Syncing ${shows.length} shows for hall ${doc.name}...`);
      
      for (const show of shows) {
        // Get existing booked/locked seats to preserve them
        const existingSeats = show.seats || [];
        const bookedSeats = existingSeats.filter(s => s.status === 'BOOKED' || s.status === 'LOCKED');
        
        // Create new seat map from hall layout
        const newSeats = doc.layout.seats.map(seat => ({
          seatLabel: seat.label,
          status: 'AVAILABLE',
          userId: null,
          lockedAt: null
        }));
        
        // Preserve booked/locked seats
        for (const bookedSeat of bookedSeats) {
          const seatIndex = newSeats.findIndex(s => s.seatLabel === bookedSeat.seatLabel);
          if (seatIndex !== -1) {
            newSeats[seatIndex] = bookedSeat;
          }
        }
        
        show.seats = newSeats;
        await show.save();
      }
      
      console.log(`✅ Synced seats for ${shows.length} shows`);
    }
  } catch (error) {
    console.error('Error syncing seats to shows:', error);
  }
});

module.exports = mongoose.model('Hall', hallSchema);
