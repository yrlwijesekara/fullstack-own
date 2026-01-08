const mongoose = require("mongoose");
const Showtime = require("../models/Showtime");
const Movie = require("../models/Movie");
const Hall = require("../models/Hall");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Showtime.deleteMany({});
  await Movie.deleteMany({});
  await Hall.deleteMany({});
});

describe("Showtime Model", () => {
  test("should create a showtime successfully", async () => {
    // Create test movie and hall
    const movie = await Movie.create({
      title: "Test Movie",
      description: "This is a test movie description used in unit tests. It is sufficiently long.",
      duration: 120,
      genre: ["Action"],
      language: "English",
    });

    const hall = await Hall.create({
      name: "Test Hall",
      layout: { rows: 10, cols: 10 },
      totalSeats: 100,
    });

    const showtimeData = {
      movieId: movie._id,
      hallId: hall._id,
      startTime: new Date("2024-12-25T18:00:00Z"),
      endTime: new Date("2024-12-25T20:00:00Z"),
      date: new Date("2024-12-25"),
      price: 12.99,
      totalSeats: 100,
      seatsAvailable: 100,
      status: "scheduled",
    };

    const showtime = await Showtime.create(showtimeData);

    expect(showtime._id).toBeDefined();
    expect(showtime.movieId.toString()).toBe(movie._id.toString());
    expect(showtime.hallId.toString()).toBe(hall._id.toString());
    expect(showtime.price).toBe(12.99);
    expect(showtime.totalSeats).toBe(100);
    expect(showtime.seatsAvailable).toBe(100);
    expect(showtime.status).toBe("scheduled");
  });

  test("should prevent duplicate showtimes in same hall at same time", async () => {
    const movie = await Movie.create({
      title: "Test Movie",
      description: "This is a test movie description used in unit tests. It is sufficiently long.",
      duration: 120,
      genre: ["Action"],
      language: "English",
    });

    const hall = await Hall.create({
      name: "Test Hall",
      layout: { rows: 10, cols: 10 },
      totalSeats: 100,
    });

    const showtimeData = {
      movieId: movie._id,
      hallId: hall._id,
      startTime: new Date("2024-12-25T18:00:00Z"),
      endTime: new Date("2024-12-25T20:00:00Z"),
      date: new Date("2024-12-25"),
      price: 12.99,
      totalSeats: 100,
      seatsAvailable: 100,
    };

    // First showtime should succeed
    await Showtime.create(showtimeData);

    // Second showtime at same time should fail
    await expect(Showtime.create(showtimeData)).rejects.toThrow();
  });

  test("should detect overlapping showtimes", async () => {
    const movie = await Movie.create({
      title: "Test Movie",
      description: "This is a test movie description used in unit tests. It is sufficiently long.",
      duration: 120,
      genre: ["Action"],
      language: "English",
    });

    const hall = await Hall.create({
      name: "Test Hall",
      layout: { rows: 10, cols: 10 },
      totalSeats: 100,
    });

    // Create first showtime
    await Showtime.create({
      movieId: movie._id,
      hallId: hall._id,
      startTime: new Date("2024-12-25T18:00:00Z"),
      endTime: new Date("2024-12-25T20:00:00Z"),
      date: new Date("2024-12-25"),
      price: 12.99,
      totalSeats: 100,
      seatsAvailable: 100,
    });

    // Check overlap with overlapping time
    const isOverlap = await Showtime.checkOverlap(
      hall._id,
      new Date("2024-12-25T19:00:00Z"), // Overlaps
      new Date("2024-12-25T21:00:00Z")
    );

    expect(isOverlap).toBeTruthy();
  });

  test("should calculate end time from movie duration", async () => {
    const movie = await Movie.create({
      title: "Test Movie",
      description: "This is a test movie description used in unit tests. It is sufficiently long.",
      duration: 150, // 2.5 hours
      genre: ["Action"],
      language: "English",
    });

    const hall = await Hall.create({
      name: "Test Hall",
      layout: { rows: 10, cols: 10 },
      totalSeats: 100,
    });

    const startTime = new Date("2024-12-25T18:00:00Z");
    const showtime = await Showtime.create({
      movieId: movie._id,
      hallId: hall._id,
      startTime: startTime,
      date: new Date("2024-12-25"),
      price: 12.99,
      totalSeats: 100,
      seatsAvailable: 100,
    });

    // End time should be start time + 150 minutes
    const expectedEndTime = new Date(startTime);
    expectedEndTime.setMinutes(expectedEndTime.getMinutes() + 150);

    expect(showtime.endTime.getTime()).toBe(expectedEndTime.getTime());
  });
});

describe("Showtime Controller", () => {
  // Add tests for controller functions here
  // You would mock the requests and test each endpoint
});
