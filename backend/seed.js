const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Movie = require('./models/Movie');

// Load environment variables
dotenv.config();

// Sample movie data
const movies = [
  {
    title: 'Inception',
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.',
    duration: 148,
    genre: ['Action', 'Sci-Fi', 'Thriller'],
    language: 'English',
    releaseDate: new Date('2010-07-16'),
    posterImage: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
    rating: 8.8,
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Ellen Page', 'Tom Hardy'],
    director: 'Christopher Nolan',
    status: 'Now Showing',
  },
  {
    title: 'The Dark Knight',
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    duration: 152,
    genre: ['Action', 'Drama', 'Thriller'],
    language: 'English',
    releaseDate: new Date('2008-07-18'),
    posterImage: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
    rating: 9.0,
    cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart', 'Michael Caine'],
    director: 'Christopher Nolan',
    status: 'Now Showing',
  },
  {
    title: 'Interstellar',
    description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival. A journey beyond the stars to discover the limits of human experience.',
    duration: 169,
    genre: ['Adventure', 'Drama', 'Sci-Fi'],
    language: 'English',
    releaseDate: new Date('2014-11-07'),
    posterImage: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    rating: 8.6,
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
    director: 'Christopher Nolan',
    status: 'Now Showing',
  },
  {
    title: 'Parasite',
    description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan in this darkly comedic thriller.',
    duration: 132,
    genre: ['Drama', 'Thriller'],
    language: 'Other',
    releaseDate: new Date('2019-05-30'),
    posterImage: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=5xH0HfJHsaY',
    rating: 8.6,
    cast: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong', 'Choi Woo-shik'],
    director: 'Bong Joon-ho',
    status: 'Now Showing',
  },
  {
    title: 'Avatar: The Way of Water',
    description: 'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na\'vi race to protect their home.',
    duration: 192,
    genre: ['Action', 'Adventure', 'Sci-Fi'],
    language: 'English',
    releaseDate: new Date('2022-12-16'),
    posterImage: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
    rating: 7.8,
    cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver', 'Kate Winslet'],
    director: 'James Cameron',
    status: 'Now Showing',
  },
  {
    title: 'Spider-Man: No Way Home',
    description: 'With Spider-Man\'s identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear, forcing Peter to discover what it truly means to be Spider-Man.',
    duration: 148,
    genre: ['Action', 'Adventure', 'Sci-Fi'],
    language: 'English',
    releaseDate: new Date('2021-12-17'),
    posterImage: 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=JfVOs4VSpmA',
    rating: 8.2,
    cast: ['Tom Holland', 'Zendaya', 'Benedict Cumberbatch', 'Willem Dafoe'],
    director: 'Jon Watts',
    status: 'Now Showing',
  },
  {
    title: 'The Shawshank Redemption',
    description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency. A story of hope, friendship, and perseverance against all odds.',
    duration: 142,
    genre: ['Drama'],
    language: 'English',
    releaseDate: new Date('1994-09-23'),
    posterImage: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=6hB3S9bIaco',
    rating: 9.3,
    cast: ['Tim Robbins', 'Morgan Freeman', 'Bob Gunton', 'William Sadler'],
    director: 'Frank Darabont',
    status: 'Now Showing',
  },
  {
    title: 'Dune: Part Two',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he must prevent a terrible future.',
    duration: 166,
    genre: ['Action', 'Adventure', 'Sci-Fi'],
    language: 'English',
    releaseDate: new Date('2024-03-01'),
    posterImage: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    rating: 8.7,
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Austin Butler'],
    director: 'Denis Villeneuve',
    status: 'Coming Soon',
  },
  {
    title: 'Oppenheimer',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II. A riveting exploration of the man behind one of history\'s most profound moments.',
    duration: 180,
    genre: ['Drama', 'Documentary'],
    language: 'English',
    releaseDate: new Date('2023-07-21'),
    posterImage: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
    rating: 8.4,
    cast: ['Cillian Murphy', 'Emily Blunt', 'Robert Downey Jr.', 'Matt Damon'],
    director: 'Christopher Nolan',
    status: 'Now Showing',
  },
  {
    title: 'Deadpool & Wolverine',
    description: 'Deadpool and Wolverine team up in an explosive adventure filled with action, humor, and unexpected twists. The unlikely duo must work together to save the multiverse from a catastrophic threat.',
    duration: 128,
    genre: ['Action', 'Comedy', 'Adventure'],
    language: 'English',
    releaseDate: new Date('2024-07-26'),
    posterImage: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=73_1biulkYk',
    rating: 8.1,
    cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin', 'Matthew Macfadyen'],
    director: 'Shawn Levy',
    status: 'Coming Soon',
  },
  {
    title: 'The Batman',
    description: 'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city\'s hidden corruption and question his family\'s involvement.',
    duration: 176,
    genre: ['Action', 'Drama', 'Thriller'],
    language: 'English',
    releaseDate: new Date('2022-03-04'),
    posterImage: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=mqqft2x_Aa4',
    rating: 7.9,
    cast: ['Robert Pattinson', 'Zoë Kravitz', 'Paul Dano', 'Jeffrey Wright'],
    director: 'Matt Reeves',
    status: 'Now Showing',
  },
  {
    title: 'Everything Everywhere All at Once',
    description: 'An aging Chinese immigrant is swept up in an insane adventure, where she alone can save the world by exploring other universes connecting with the lives she could have led.',
    duration: 139,
    genre: ['Action', 'Adventure', 'Comedy'],
    language: 'English',
    releaseDate: new Date('2022-03-25'),
    posterImage: 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=wxN1T1uxQ2g',
    rating: 8.0,
    cast: ['Michelle Yeoh', 'Stephanie Hsu', 'Ke Huy Quan', 'Jamie Lee Curtis'],
    director: 'Daniel Kwan',
    status: 'Now Showing',
  },
];

// Connect to MongoDB and seed data
const seedDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing movies
    console.log('🗑️  Clearing existing movies...');
    await Movie.deleteMany({});
    console.log('✅ Existing movies cleared');

    // Insert sample movies
    console.log('📽️  Inserting sample movies...');
    const insertedMovies = await Movie.insertMany(movies);
    console.log(`✅ Successfully inserted ${insertedMovies.length} movies`);

    // Display inserted movies
    console.log('\n📋 Inserted Movies:');
    insertedMovies.forEach((movie, index) => {
      console.log(`${index + 1}. ${movie.title} (${movie.status}) - ${movie.genre.join(', ')}`);
    });

    console.log('\n🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
