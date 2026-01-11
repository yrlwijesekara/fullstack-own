import PropTypes from 'prop-types';

/**
 * Reusable Hall Layout Preview Component
 * Displays cinema hall seats with aisles, screen, and interactive seat selection
 */
const HallLayoutPreview = ({
  layout,
  onSeatClick,
  selectedSeats = [],
  bookedSeats = [],
  showScreen = true,
  showLegend = true,
  interactive = false,
  maxSeats = null,
}) => {
  if (!layout || !layout.rows || !layout.cols) {
    return (
      <div className="bg-background-900 rounded-lg p-6 text-center text-text-muted">
        No hall layout available
      </div>
    );
  }

  const { rows, cols, seats = [], partitions = [] } = layout;

  // Create a map for quick seat lookup
  const seatMap = {};
  seats.forEach((seat) => {
    const key = `${seat.row}-${seat.col}`;
    seatMap[key] = seat;
  });

  // Generate row label (A, B, C, ...)
  const getRowLabel = (rowIndex) => {
    return String.fromCharCode(65 + rowIndex);
  };

  // Build seat grid
  const seatGrid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const key = `${r}-${c}`;
      const seat = seatMap[key] || {
        row: r,
        col: c,
        label: `${getRowLabel(r)}${c + 1}`,
        type: 'regular',
        isActive: true,
      };
      row.push(seat);
    }
    seatGrid.push(row);
  }

  const handleSeatClick = (seat) => {
    if (!interactive || !onSeatClick) return;
    if (!seat.isActive) return;
    if (bookedSeats.includes(seat.label)) return;

    // Check if max seats reached
    if (maxSeats && selectedSeats.length >= maxSeats && !selectedSeats.includes(seat.label)) {
      return;
    }

    onSeatClick(seat);
  };

  const getSeatClassName = (seat) => {
    const isBooked = bookedSeats.includes(seat.label);
    const isSelected = selectedSeats.includes(seat.label);
    const isActive = seat.isActive !== false;

    let baseClasses = 'w-8 h-8 rounded-t-lg flex items-center justify-center text-xs font-medium transition-all duration-200';

    if (!isActive) {
      return `${baseClasses} bg-surface-700 border border-surface-600 text-surface-500 cursor-not-allowed opacity-50`;
    }

    if (isBooked) {
      return `${baseClasses} bg-red-600/50 border border-red-500 text-red-200 cursor-not-allowed`;
    }

    if (isSelected) {
      return `${baseClasses} bg-primary-500 border-2 border-primary-400 text-white shadow-lg shadow-primary-500/50 transform scale-105`;
    }

    if (interactive) {
      return `${baseClasses} bg-surface-500 border border-secondary-400 text-text-muted hover:bg-secondary-300 hover:text-text-primary hover:border-secondary-300 hover:scale-105 cursor-pointer`;
    }

    return `${baseClasses} bg-surface-500 border border-secondary-400 text-text-muted`;
  };

  return (
    <div className="bg-background-900 rounded-lg p-6">
      {/* Cinema Screen */}
      {showScreen && (
        <div className="mb-8">
          <div className="relative">
            <div className="h-4 bg-gradient-to-b from-secondary-300 via-secondary-400 to-secondary-500 rounded-t-3xl shadow-lg shadow-secondary-300/50 animate-pulse"></div>
            <div className="text-center mt-3 text-sm uppercase tracking-widest text-secondary-300 font-bold">
              ⬤ Screen ⬤
            </div>
          </div>
        </div>
      )}

      {/* Seat Grid */}
      <div className="space-y-2 overflow-auto max-h-[600px]">
        {seatGrid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex items-center justify-center gap-2">
            {/* Row Label - Left */}
            <div className="w-8 text-center text-sm font-bold text-secondary-300 select-none">
              {getRowLabel(rowIndex)}
            </div>

            {/* Seats with Aisles */}
            <div className="flex gap-1 items-center">
              {row.map((seat, seatIndex) => (
                <div key={seatIndex} className="flex items-center">
                  {/* Seat Button */}
                  <button
                    type="button"
                    onClick={() => handleSeatClick(seat)}
                    disabled={!interactive || !seat.isActive || bookedSeats.includes(seat.label)}
                    className={getSeatClassName(seat)}
                    title={`${seat.label} - ${
                      bookedSeats.includes(seat.label)
                        ? 'Booked'
                        : selectedSeats.includes(seat.label)
                        ? 'Selected'
                        : seat.isActive
                        ? 'Available'
                        : 'Inactive'
                    }`}
                  >
                    {seatIndex + 1}
                  </button>

                  {/* Aisle/Partition */}
                  {seatIndex < row.length - 1 && partitions.includes(seatIndex) && (
                    <div className="w-4 h-8 mx-1 bg-yellow-500/20 border border-yellow-500/50 rounded"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Row Label - Right */}
            <div className="w-8 text-center text-sm font-bold text-secondary-300 select-none">
              {getRowLabel(rowIndex)}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-8 pt-6 border-t border-secondary-400/50">
          <div className="flex justify-center gap-6 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-surface-500 border border-secondary-400 rounded-t-lg"></div>
              <span className="text-text-muted">Available</span>
            </div>
            {interactive && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary-500 border-2 border-primary-400 rounded-t-lg"></div>
                <span className="text-text-muted">Selected</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-red-600/50 border border-red-500 rounded-t-lg"></div>
              <span className="text-text-muted">Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-surface-700 border border-surface-600 rounded-t-lg opacity-50"></div>
              <span className="text-text-muted">Inactive</span>
            </div>
            {partitions.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-7 bg-yellow-500/20 border border-yellow-500/50 rounded"></div>
                <span className="text-text-muted">Aisle</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seat Count Info */}
      {interactive && maxSeats && (
        <div className="mt-4 text-center text-sm text-text-secondary">
          {selectedSeats.length} / {maxSeats} seats selected
        </div>
      )}
    </div>
  );
};

HallLayoutPreview.propTypes = {
  layout: PropTypes.shape({
    rows: PropTypes.number.isRequired,
    cols: PropTypes.number.isRequired,
    seats: PropTypes.arrayOf(
      PropTypes.shape({
        row: PropTypes.number.isRequired,
        col: PropTypes.number.isRequired,
        label: PropTypes.string.isRequired,
        type: PropTypes.string,
        isActive: PropTypes.bool,
      })
    ),
    partitions: PropTypes.arrayOf(PropTypes.number),
  }).isRequired,
  onSeatClick: PropTypes.func,
  selectedSeats: PropTypes.arrayOf(PropTypes.string),
  bookedSeats: PropTypes.arrayOf(PropTypes.string),
  showScreen: PropTypes.bool,
  showLegend: PropTypes.bool,
  interactive: PropTypes.bool,
  maxSeats: PropTypes.number,
};

export default HallLayoutPreview;
