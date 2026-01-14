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
    const { name, description, status, layout, cinemaId } = req.body;

    // Validate required fields
    if (!name || !layout || !layout.rows || !layout.cols || !cinemaId) {
      return res.status(400).json({ 
        message: 'Name, rows, columns, and cinema are required' 
      });
    }

    const rows = Number(layout.rows);
    const cols = Number(layout.cols);
    const partitions = layout.partitions || [];

    // Generate seats using helper function
    const seats = generateSeatGrid(rows, cols);

    // Create hall with partitions
    const hall = await Hall.create({
      name,
      cinemaId,
      description,
      status: status || 'active',
      layout: {
        rows,
        cols,
        seats,
        partitions,
      },
    });

    res.status(201).json(hall);
  } catch (error) {
    console.error('Create hall error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to create hall' 
    });
  }
};

// @desc    Get all halls
// @route   GET /api/halls
// @access  Public
exports.getAllHalls = async (req, res) => {
  try {
    const { cinemaId, cinemaIds } = req.query;
    const query = {};
    if (cinemaId) query.cinemaId = cinemaId;
    if (cinemaIds) {
      const arr = String(cinemaIds).split(',').map((s) => s.trim()).filter(Boolean);
      if (arr.length) query.cinemaId = { $in: arr };
    }
    const halls = await Hall.find(query).sort({ createdAt: -1 });
    res.json(halls);
  } catch (error) {
    console.error('Get halls error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to fetch halls' 
    });
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
    res.status(500).json({ 
      message: error.message || 'Failed to fetch hall' 
    });
  }
};

// @desc    Update hall
// @route   PUT /api/halls/:id
// @access  Private/Admin
exports.updateHall = async (req, res) => {
  try {
    const { name, description, status, layout } = req.body;

    const hall = await Hall.findById(req.params.id);
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    // Update basic fields
    if (name) hall.name = name;
    if (description !== undefined) hall.description = description;
    if (status) hall.status = status;

    // Update layout if provided
    if (layout) {
      const rows = Number(layout.rows);
      const cols = Number(layout.cols);
      const partitions = layout.partitions || [];

      // Regenerate seats if dimensions changed
      if (rows !== hall.layout.rows || cols !== hall.layout.cols) {
        hall.layout.seats = generateSeatGrid(rows, cols);
      }

      hall.layout.rows = rows;
      hall.layout.cols = cols;
      hall.layout.partitions = partitions;
    }

    await hall.save();
    res.json(hall);
  } catch (error) {
    console.error('Update hall error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to update hall' 
    });
  }
};

// @desc    Delete hall
// @route   DELETE /api/halls/:id
// @access  Private/Admin
exports.deleteHall = async (req, res) => {
  try {
    const hall = await Hall.findByIdAndDelete(req.params.id);
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }
    res.json({ message: 'Hall deleted successfully' });
  } catch (error) {
    console.error('Delete hall error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to delete hall' 
    });
  }
};