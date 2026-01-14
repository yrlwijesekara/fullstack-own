import { useEffect, useState } from 'react';
import { createHall, getHall, updateHall } from '../../services/hallService';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingLogo from '../../components/LoadingLogo';

const HallForm = () => {
  const { id } = useParams();
  const isEdit = id && id !== 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'active',
    rows: 5,
    cols: 10,
    cinemaId: '',
  });
  const [partitions, setPartitions] = useState([]); // Array of column indices where partitions exist
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [cinemas, setCinemas] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch cinemas
        const cinemasRes = await fetch('/api/cinemas', { credentials: 'include' });
        if (cinemasRes.ok) {
          const cinemasData = await cinemasRes.json();
          setCinemas(cinemasData.data || []);
        }
      } catch (err) {
        console.error('Failed to load cinemas:', err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadHall = async () => {
      if (!isEdit) return;
      try {
        const hall = await getHall(id);
        setForm({
          name: hall.name || '',
          description: hall.description || '',
          status: hall.status || 'active',
          rows: hall.layout?.rows || 5,
          cols: hall.layout?.cols || 10,
          cinemaId: hall.cinemaId?._id || hall.cinemaId || '',
        });
        // Load existing partitions if any
        setPartitions(hall.layout?.partitions || []);
      } catch (err) {
        setError(err.message || 'Failed to load hall');
      } finally {
        setLoading(false);
      }
    };
    loadHall();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const togglePartition = (colIndex) => {
    setPartitions((prev) => {
      if (prev.includes(colIndex)) {
        return prev.filter((p) => p !== colIndex);
      } else {
        return [...prev, colIndex].sort((a, b) => a - b);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      name: form.name,
      cinemaId: form.cinemaId,
      description: form.description,
      status: form.status,
      layout: {
        rows: Number(form.rows),
        cols: Number(form.cols),
        partitions: partitions, // Include partitions in the payload
      },
    };

    try {
      if (isEdit) {
        await updateHall(id, payload);
      } else {
        await createHall(payload);
      }
      navigate('/admin-dashboard/halls');
    } catch (err) {
      setError(err.message || 'Failed to save hall');
    }
  };

  // Generate row labels (A, B, C, ...)
  const getRowLabel = (rowIndex) => {
    return String.fromCharCode(65 + rowIndex); // A=65 in ASCII
  };

  // Generate preview seats
  const generatePreview = () => {
    const rows = Number(form.rows) || 5;
    const cols = Number(form.cols) || 10;
    const seats = [];

    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          label: `${getRowLabel(r)}${c + 1}`,
          row: r,
          col: c,
        });
      }
      seats.push(row);
    }
    return seats;
  };

  const seatGrid = generatePreview();

  if (loading) return (
    <div className="min-h-screen bg-background-900 flex items-center justify-center">
      <LoadingLogo size={80} text="Loading hall..." />
    </div>
  );

  return (
    <div className="min-h-screen bg-background-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin-dashboard/halls')}
            className="text-secondary-300 hover:text-secondary-400 flex items-center gap-2 mb-4"
          >
            ← Back to Halls
          </button>
          <h1 className="text-3xl font-bold text-text-primary">
            {isEdit ? 'Edit Hall' : 'Create New Hall'}
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-600/20 border border-red-500 rounded text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-surface-600 rounded-lg p-6 border border-secondary-400">
            <h2 className="text-xl font-bold text-text-primary mb-6">Hall Details</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                  Hall Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-secondary-400 rounded px-4 py-3 bg-surface-500 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary-300"
                  placeholder="e.g., Screen 1, IMAX Hall"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full border border-secondary-400 rounded px-4 py-3 bg-surface-500 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary-300"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                  Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border border-secondary-400 rounded px-4 py-3 bg-surface-500 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary-300"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                  Cinema
                </label>
                <select
                  name="cinemaId"
                  value={form.cinemaId}
                  onChange={handleChange}
                  className="w-full border border-secondary-400 rounded px-4 py-3 bg-surface-500 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary-300"
                  required
                >
                  <option value="">Select a cinema</option>
                  {cinemas.map((cinema) => (
                    <option key={cinema._id} value={cinema._id}>
                      {cinema.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                    Rows
                  </label>
                  <input
                    type="number"
                    name="rows"
                    min="1"
                    max="26"
                    value={form.rows}
                    onChange={handleChange}
                    className="w-full border border-secondary-400 rounded px-4 py-3 bg-surface-500 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
                    Columns
                  </label>
                  <input
                    type="number"
                    name="cols"
                    min="1"
                    max="50"
                    value={form.cols}
                    onChange={handleChange}
                    className="w-full border border-secondary-400 rounded px-4 py-3 bg-surface-500 text-text-primary focus:outline-none focus:ring-2 focus:ring-secondary-300"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-secondary-400 pt-4">
                <label className="block text-sm font-medium mb-3 text-text-secondary uppercase tracking-wide">
                  Aisles / Partitions
                </label>
                <p className="text-xs text-text-muted mb-3">
                  Click on the preview to add/remove aisles between seat columns.
                </p>
                <div className="bg-surface-500 rounded p-3 text-xs text-text-muted">
                  {partitions.length > 0 ? (
                    <span>Aisles after columns: {partitions.map(p => p + 1).join(', ')}</span>
                  ) : (
                    <span>No aisles added yet. Click between columns in preview.</span>
                  )}
                </div>
              </div>

              <div className="text-xs text-text-muted border-t border-secondary-400 pt-4">
                <p>💡 Seat grid will be auto-generated. Preview shown on the right.</p>
                <p className="mt-1">Total seats: <span className="font-bold text-secondary-300">{form.rows * form.cols}</span></p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/admin/halls')}
                  className="px-6 py-2 border border-secondary-400 rounded text-text-primary hover:bg-surface-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-500 text-text-primary rounded font-bold uppercase tracking-wide hover:bg-primary-600 transition"
                >
                  {isEdit ? 'Save Changes' : 'Create Hall'}
                </button>
              </div>
            </form>
          </div>

          {/* Layout Preview Section */}
          <div className="bg-surface-600 rounded-lg p-6 border border-secondary-400">
            <h2 className="text-xl font-bold text-text-primary mb-6">Layout Preview</h2>
            
            <div className="bg-background-900 rounded-lg p-6">
              {/* Cinema Screen */}
              <div className="mb-8">
                <div className="relative">
                  <div className="h-3 bg-gradient-to-b from-secondary-300 to-secondary-400 rounded-t-3xl shadow-lg shadow-secondary-300/50"></div>
                  <div className="text-center mt-2 text-xs uppercase tracking-widest text-text-secondary font-bold">
                    Screen
                  </div>
                </div>
              </div>

              {/* Seat Grid */}
              <div className="space-y-3 overflow-auto max-h-[500px]">
                {seatGrid.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex items-center justify-center gap-2">
                    {/* Row Label */}
                    <div className="w-6 text-center text-xs font-bold text-secondary-300">
                      {getRowLabel(rowIndex)}
                    </div>

                    {/* Seats with Partitions */}
                    <div className="flex gap-1 items-center">
                      {row.map((seat, seatIndex) => (
                        <div key={seatIndex} className="flex items-center">
                          {/* Seat */}
                          <div
                            className="w-7 h-7 bg-surface-500 border border-secondary-400 rounded-t-lg flex items-center justify-center text-[8px] text-text-muted hover:bg-primary-500 hover:text-text-primary transition cursor-pointer"
                            title={seat.label}
                          >
                            {seatIndex + 1}
                          </div>
                          
                          {/* Partition/Aisle after this seat (clickable only on first row for visual clarity) */}
                          {seatIndex < row.length - 1 && rowIndex === 0 && (
                            <button
                              type="button"
                              onClick={() => togglePartition(seatIndex)}
                              className={`w-3 h-7 mx-0.5 transition cursor-pointer rounded ${
                                partitions.includes(seatIndex)
                                  ? 'bg-yellow-500/30 border border-yellow-500'
                                  : 'bg-transparent border border-dashed border-surface-400 hover:border-secondary-300'
                              }`}
                              title={partitions.includes(seatIndex) ? 'Remove aisle' : 'Add aisle'}
                            />
                          )}
                          
                          {/* Show partition on other rows (non-clickable, just visual) */}
                          {seatIndex < row.length - 1 && rowIndex !== 0 && partitions.includes(seatIndex) && (
                            <div className="w-3 h-7 mx-0.5 bg-yellow-500/30 border border-yellow-500 rounded" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Row Label (right side) */}
                    <div className="w-6 text-center text-xs font-bold text-secondary-300">
                      {getRowLabel(rowIndex)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-secondary-400 flex justify-center gap-4 text-xs flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-surface-500 border border-secondary-400 rounded-t-lg"></div>
                  <span className="text-text-muted">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary-500 border border-secondary-400 rounded-t-lg"></div>
                  <span className="text-text-muted">Hover</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-6 bg-yellow-500/30 border border-yellow-500 rounded"></div>
                  <span className="text-text-muted">Aisle</span>
                </div>
              </div>
              
              <p className="text-center text-xs text-text-muted mt-3">
                💡 Click the dashed lines in the first row to add/remove aisles
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HallForm;