const mongoose = require('mongoose');

/**
 * Movie Schema
 * Represents a movie in the cinema management system
 */
const movieSchema = new mongoose.Schema(
  {
    /**
     * Movie title
     * @type {String}
     * @required
     * @unique
     * @indexed for search functionality
     */
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      unique: true,
      trim: true,
      index: true,
    },

    /**
     * Movie description/synopsis
     * @type {String}
     * @required
     * @minlength 50 characters
     * @indexed for search functionality
     */
    description: {
      type: String,
      required: [true, 'Movie description is required'],
      minlength: [50, 'Description must be at least 50 characters long'],
      trim: true,
    },

    /**
     * Movie duration in minutes
     * @type {Number}
     * @required
     * @min 1
     */
    duration: {
      type: Number,
      required: [true, 'Movie duration is required'],
      min: [1, 'Duration must be a positive number'],
    },

    /**
     * Movie genre(s)
     * @type {Array<String>}
     * @enum ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Western']
     */
    genre: {
      type: [String],
      enum: {
        values: ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Western'],
        message: '{VALUE} is not a valid genre',
      },
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'At least one genre must be specified',
      },
    },

    /**
     * Movie language
     * @type {String}
     * @enum ['English', 'Sinhala', 'Tamil', 'Hindi', 'Other']
     */
    language: {
      type: String,
      required: [true, 'Movie language is required'],
      enum: {
        values: ['English', 'Sinhala', 'Tamil', 'Hindi', 'Other'],
        message: '{VALUE} is not a valid language option',
      },
    },

    /**
     * Movie release date
     * @type {Date}
     * @default Current date
     */
    releaseDate: {
      type: Date,
      default: Date.now,
    },

    /**
     * Movie poster image URL or file path
     * @type {String}
     * @default Placeholder image
     */
    posterImage: {
      type: String,
      default: '/images/placeholder-poster.jpg',
    },

    /**
     * Movie trailer URL (YouTube format)
     * @type {String}
     * @optional
     * @validates YouTube URL format
     */
    trailerUrl: {
      type: String,
      validate: {
        validator: function (v) {
          if (!v) return true; // Allow empty/null values
          // Validate YouTube URL format (youtube.com/watch?v= or youtu.be/)
          const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}$/;
          return youtubeRegex.test(v);
        },
        message: 'Please provide a valid YouTube URL',
      },
    },

    /**
     * Movie rating (0-10 scale)
     * @type {Number}
     * @optional
     * @min 0
     * @max 10
     */
    rating: {
      type: Number,
      min: [0, 'Rating must be at least 0'],
      max: [10, 'Rating cannot exceed 10'],
    },

    /**
     * Cast members
     * @type {Array<String>}
     * @optional
     */
    cast: {
      type: [String],
      default: [],
    },

    /**
     * Movie director
     * @type {String}
     * @optional
     */
    director: {
      type: String,
      trim: true,
    },

    /**
     * Movie status
     * @type {String}
     * @enum ['upcoming', 'now_showing', 'archived', 'Coming Soon', 'Now Showing', 'Archived']
     * Supports both new format (lowercase with underscore) and old format (Title Case with space) for backward compatibility
     * @default 'upcoming'
     */
    status: {
      type: String,
      enum: {
        values: ['upcoming', 'now_showing', 'archived', 'Coming Soon', 'Now Showing', 'Archived'],
        message: '{VALUE} is not a valid status',
      },
      default: 'upcoming',
    },
  },
  { 
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Create text index on title and description for search functionality
movieSchema.index({ title: 'text', description: 'text' });

/**
 * Movie Model
 * @exports Movie
 */
module.exports = mongoose.model('Movie', movieSchema);
