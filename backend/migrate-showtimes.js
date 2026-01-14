require('dotenv').config();
const mongoose = require('mongoose');
const Showtime = require('./models/Showtime');
const Hall = require('./models/Hall');
const Cinema = require('./models/Cinema');

async function updateShowtimesWithCinemaId() {
  try {
    // Connect to your database
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to database');

    // Get all cinemas
    const cinemas = await Cinema.find({});
    if (cinemas.length === 0) {
      console.log('No cinemas found. Please create cinemas first.');
      return;
    }

    const defaultCinemaId = cinemas[0]._id;
    console.log(`Using default cinema: ${cinemas[0].name} (${defaultCinemaId})`);

    // Update halls without cinemaId
    const hallsWithoutCinema = await Hall.find({ cinemaId: { $exists: false } });
    console.log(`Found ${hallsWithoutCinema.length} halls without cinemaId`);

    for (const hall of hallsWithoutCinema) {
      hall.cinemaId = defaultCinemaId;
      await hall.save();
      console.log(`Updated hall ${hall._id} (${hall.name}) with cinemaId ${defaultCinemaId}`);
    }

    // Now update showtimes
    const showtimesWithoutCinema = await Showtime.find({ cinemaId: { $exists: false } }).populate('hallId');

    console.log(`Found ${showtimesWithoutCinema.length} showtimes without cinemaId`);

    for (const showtime of showtimesWithoutCinema) {
      if (showtime.hallId && showtime.hallId.cinemaId) {
        showtime.cinemaId = showtime.hallId.cinemaId;
        await showtime.save();
        console.log(`Updated showtime ${showtime._id} with cinemaId ${showtime.cinemaId}`);
      } else {
        console.log(`Showtime ${showtime._id} has no hall or hall has no cinemaId - skipping`);
      }
    }

    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the migration
updateShowtimesWithCinemaId();