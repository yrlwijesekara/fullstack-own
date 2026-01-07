import { useEffect, useState } from 'react';
import { createHall, getHall, updateHall } from '../services/hallService';
import { useNavigate, useParams } from 'react-router-dom';

const HallForm = () => {
  const { id } = useParams(); // "new" or an actual ID
  const isEdit = id && id !== 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'active',
    rows: 5,
    cols: 10,
  });
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');

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
        });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      name: form.name,
      description: form.description,
      status: form.status,
      layout: {
        rows: Number(form.rows),
        cols: Number(form.cols),
        // seats omitted -> backend auto-generates
      },
    };

    try {
      if (isEdit) {
        await updateHall(id, payload);
      } else {
        await createHall(payload);
      }
      navigate('/admin/halls');
    } catch (err) {
      setError(err.message || 'Failed to save hall');
    }
  };

  if (loading) return <div className="text-white">Loading hall...</div>;

  return (
    <div className="max-w-lg mx-auto p-4 text-black">
      <h1 className="text-2xl font-semibold mb-4">
        {isEdit ? 'Edit Hall' : 'Create Hall'}
      </h1>

      {error && <div className="mb-3 text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1 text-white">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-black"
            placeholder="Screen 1, IMAX Hall"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-white">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-black"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-white">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-black"
          >
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-white">Rows</label>
            <input
              type="number"
              name="rows"
              min="1"
              value={form.rows}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-black"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-white">Columns</label>
            <input
              type="number"
              name="cols"
              min="1"
              value={form.cols}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 text-black"
              required
            />
          </div>
        </div>

        <p className="text-xs text-gray-700">
          Seat grid will be auto-generated (A1, A2, …). Member 5 can use the
          layout data to render and customize individual seats later.
        </p>

        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={() => navigate('/admin/halls')}
            className="px-4 py-2 border rounded text-black"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded"
          >
            {isEdit ? 'Save Changes' : 'Create Hall'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HallForm;