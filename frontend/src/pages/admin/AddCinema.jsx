import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/api';
import { toast } from 'react-toastify';

export default function AddCinema() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', address: '', description: '' });
  const [imageFile, setImageFile] = useState(null);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleFile = (e) => setImageFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('city', form.city);
      fd.append('address', form.address);
      fd.append('description', form.description);
      if (imageFile) fd.append('image', imageFile);

      const res = await fetch(`${API_BASE_URL}/cinemas`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create cinema');

      toast.success('Cinema created successfully');
      navigate('/admin-dashboard/cinemas');
    } catch (err) {
      toast.error(err.message || 'Failed to create cinema');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin-dashboard/cinemas')}
          className="flex items-center gap-2 px-3 py-2 bg-surface-600 hover:bg-surface-700 text-text-primary rounded-lg"
        >
          ← Back to Cinemas
        </button>
        <h1 className="text-2xl font-bold text-text-primary">Add New Cinema</h1>
      </div>

      <div className="bg-surface-600 rounded-xl p-6 border border-surface-400/30">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full p-3 bg-surface-500 border border-surface-400 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Enter cinema name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">City *</label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                className="w-full p-3 bg-surface-500 border border-surface-400 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Enter city"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Address</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full p-3 bg-surface-500 border border-surface-400 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="Enter address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full p-3 bg-surface-500 border border-surface-400 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="Enter description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Cinema Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="w-full p-3 bg-surface-500 border border-surface-400 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-500 file:text-white hover:file:bg-primary-600"
            />
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/admin-dashboard/cinemas')}
              className="px-6 py-3 bg-surface-500 hover:bg-surface-600 text-text-primary rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </div>
              ) : (
                'Create Cinema'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}