const Hall = require('../models/Hall');

/**
 * Helper: generate a basic grid of seats (A1, A2, …)
 */
const generateSeatGrid = (rows, cols) => {
  const seats = [];
  for (let r = 0; r < rows; r++) {
    const rowLetter = String.fromCharCode(65 + r); // 65 = 'A'
    for (let c = 0; c < cols; c++) {
      seats.push({
        row: r,
        col: c,
        label: `${rowLetter}${c + 1}`,
        type: 'regular',
        isActive: true,
      });
    }
  }
  return seats;
};

// @desc    Create a new hall
// @route   POST /api/halls
// @access  Private/Admin
exports.createHall = async (req, res) => {
  try {
    const { name, description, status, layout } = req.body;

    if (!layout || !layout.rows || !layout.cols) {
      return res
        .status(400)
        .json({ message: 'Layout with rows and cols is required' });
    }

    const rows = Number(layout.rows);
    const cols = Number(layout.cols);

    if (rows <= 0 || cols <= 0) {
      return res
        .status(400)
        .json({ message: 'Rows and columns must be positive numbers' });
    }

    // If no seats provided, auto-generate grid
    let seats = layout.seats;
    if (!Array.isArray(seats) || seats.length === 0) {
      seats = generateSeatGrid(rows, cols);
    }

    const hall = await Hall.create({
      name,
      description,
      status: status || 'active',
      layout: {
        rows,
        cols,
        seats,
      },
    });

    res.status(201).json(hall);
  } catch (error) {
    console.error('Create hall error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Hall name must be unique' });
    }
    res.status(500).json({ message: 'Failed to create hall' });
  }
};

// @desc    Get all halls
// @route   GET /api/halls
// @access  Public (or restrict to admin if you want)
exports.getAllHalls = async (req, res) => {
  try {
    const halls = await Hall.find().sort({ createdAt: 1 });
    res.json(halls);
  } catch (error) {
    console.error('Get halls error:', error);
    res.status(500).json({ message: 'Failed to fetch halls' });
  }
};

// @desc    Get single hall by ID
// @route   GET /api/halls/:id
// @access  Public
exports.getHallById = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }
    res.json(hall);
  } catch (error) {
    console.error('Get hall error:', error);
    res.status(500).json({ message: 'Failed to fetch hall' });
  }
};

// @desc    Update hall (incl. status or layout)
// @route   PUT /api/halls/:id
// @access  Private/Admin
exports.updateHall = async (req, res) => {
  try {
    const { name, description, status, layout } = req.body;

    const hall = await Hall.findById(req.params.id);
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    if (name !== undefined) hall.name = name;
    if (description !== undefined) hall.description = description;
    if (status !== undefined) hall.status = status;

    if (layout) {
      // Allow updating rows/cols and/or full seat map
      if (layout.rows !== undefined) hall.layout.rows = Number(layout.rows);
      if (layout.cols !== undefined) hall.layout.cols = Number(layout.cols);

      if (Array.isArray(layout.seats) && layout.seats.length > 0) {
        hall.layout.seats = layout.seats;
      } else if (
        layout.rows !== undefined ||
        layout.cols !== undefined
      ) {
        // If grid size changed but no seats provided -> regenerate
        hall.layout.seats = generateSeatGrid(
          hall.layout.rows,
          hall.layout.cols
        );
      }
    }

    await hall.save();
    res.json(hall);
  } catch (error) {
    console.error('Update hall error:', error);
    res.status(500).json({ message: 'Failed to update hall' });
  }
};

// @desc    Delete hall
// @route   DELETE /api/halls/:id
// @access  Private/Admin
exports.deleteHall = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    await hall.deleteOne();
    res.json({ message: 'Hall deleted' });
  } catch (error) {
    console.error('Delete hall error:', error);
    res.status(500).json({ message: 'Failed to delete hall' });
  }
};