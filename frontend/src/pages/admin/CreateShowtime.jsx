import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/api';
import BackButton from '../../components/BackButton';
import LoadingLogo from '../../components/LoadingLogo';

export default function CreateShowtime() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [modalHalls, setModalHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    movieId: '',
    hallId: '',
    startTime: '',
    price: '',
    totalSeats: '',
    cinemaId: '',
    cinemaIds: [],
    hallIds: [],
  });

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const preMovie = q.get('movieId');
    if (preMovie) setFormData(prev => ({ ...prev, movieId: preMovie }));
    fetchInitial();
  }, []);

  const fetchInitial = async () => {
    setLoading(true);
    try {
      const [mRes, hRes, cRes] = await Promise.all([
        fetch(`${API_BASE_URL}/movies`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/halls`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/cinemas`, { credentials: 'include' }),
      ]);

      if (mRes.ok) {
        const mData = await mRes.json();
        setMovies(mData.movies || mData.data || []);
      }
      if (hRes.ok) {
        const hData = await hRes.json();
        setHalls(Array.isArray(hData) ? hData : (hData.data || hData.halls || []));
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setCinemas(cData.data || cData.cinemas || cData || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHallsByCinemaIds = async (cinemaIds = []) => {
    try {
      if (!Array.isArray(cinemaIds) || cinemaIds.length === 0) {
        setModalHalls([]);
        return;
      }
      const q = cinemaIds.join(',');
      const response = await fetch(`${API_BASE_URL}/halls?cinemaIds=${encodeURIComponent(q)}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const list = data.data || data;
        setModalHalls(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Failed to fetch halls for cinemas:', err);
    }
  };

  // Select all cinemas helper
  const selectAllCinemas = () => {
    const ids = (Array.isArray(cinemas) ? cinemas : []).map(c => c._id);
    setFormData(prev => ({ ...prev, cinemaIds: ids }));
    fetchHallsByCinemaIds(ids);
  };

  // Select all halls helper (only from selected cinemas)
  const selectAllHalls = () => {
    if (!Array.isArray(modalHalls) || modalHalls.length === 0) return;
    const ids = modalHalls.map(h => h._id);
    setFormData(prev => ({ ...prev, hallIds: ids }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'cinemaIds') {
      const options = Array.from(e.target.selectedOptions || []);
      const ids = options.map(o => o.value);
      setFormData(prev => ({ ...prev, cinemaIds: ids }));
      fetchHallsByCinemaIds(ids);
      return;
    }
    if (name === 'hallIds') {
      const options = Array.from(e.target.selectedOptions || []);
      const ids = options.map(o => o.value);
      setFormData(prev => ({ ...prev, hallIds: ids }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getSelectedHalls = () => {
    const ids = Array.isArray(formData.hallIds) ? formData.hallIds : (formData.hallId ? [formData.hallId] : []);
    return ids.map(id => modalHalls.find(h => String(h._id) === String(id)) || halls.find(h => String(h._id) === String(id))).filter(Boolean);
  };

  const resolveCinemaName = (hall) => {
    if (!hall) return '';
    if (hall.cinemaId && typeof hall.cinemaId === 'object' && hall.cinemaId.name) return hall.cinemaId.name;
    if (hall.cinemaId) {
      const found = cinemas.find(c => String(c._id) === String(hall.cinemaId));
      if (found) return found.name;
    }
    return '';
  };

  const getLocalDateTimeForInput = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now - tzOffset).toISOString().slice(0,16);
  };

  const formatCurrency = (amount) => {
    try { return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(amount) || 0); } catch { return `LKR ${Number(amount||0).toFixed(2)}`; }
  };

  const handleCreateShowtime = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const payloadBase = { ...formData };
      // Remove fields that are not needed for individual showtime creation
      delete payloadBase.cinemaId; // Will be set per hall
      delete payloadBase.cinemaIds; // Not needed
      delete payloadBase.hallIds; // Will be processed individually

      if (!payloadBase.movieId || !payloadBase.startTime) {
        setError('Please select a movie and start time');
        return;
      }

      const hallIds = Array.isArray(formData.hallIds)
        ? formData.hallIds
        : formData.hallId
        ? [formData.hallId]
        : [];

      if (hallIds.length === 0) {
        setError('Please select at least one hall');
        return;
      }

      const created = [];
      const errors = [];

      for (const hallId of hallIds) {
        try {
          const payload = { ...payloadBase };
          payload.hallId = hallId;
          const hallObj = modalHalls.find(h => String(h._id) === String(hallId));
          if (!hallObj) {
            errors.push({ hallId, message: 'Hall not found in selected cinemas' });
            continue;
          }
          if (hallObj && hallObj.cinemaId) {
            payload.cinemaId = hallObj.cinemaId._id || hallObj.cinemaId;
          } else {
            errors.push({ hallId, message: 'Hall does not belong to a cinema' });
            continue;
          }
          try { payload.startTime = new Date(payload.startTime).toISOString(); } catch (err) { console.debug('Invalid startTime for create', err); }
          if (!payload.totalSeats || Number(payload.totalSeats) <= 0) {
            let capacity = null;
            if (hallObj) {
              if (typeof hallObj.totalSeats === 'number' && hallObj.totalSeats > 0) capacity = hallObj.totalSeats;
              else if (hallObj.layout) {
                if (Array.isArray(hallObj.layout.seats) && hallObj.layout.seats.length > 0) capacity = hallObj.layout.seats.length;
                else if (hallObj.layout.rows && hallObj.layout.cols) capacity = Number(hallObj.layout.rows) * Number(hallObj.layout.cols);
              }
            }
            if (capacity) payload.totalSeats = capacity;
          }
          payload.price = parseFloat(payload.price) || 0;
          payload.totalSeats = Number(payload.totalSeats);
          // Ensure seatsAvailable and bookedSeats are provided so backend has correct initial seat count
          payload.seatsAvailable = Number(payload.totalSeats) || 0;
          payload.bookedSeats = [];

          const response = await fetch(`${API_BASE_URL}/showtimes`, { method: 'POST', headers, credentials: 'include', body: JSON.stringify(payload) });
          const data = await response.json();
          if (!response.ok) errors.push({ hallId, message: data.message || 'Failed to create' });
          else created.push(data.data || data);
        } catch (err) { errors.push({ hallId, message: err.message }); }
      }

      if (created.length > 0) setSuccess(`Created ${created.length} showtime${created.length>1?'s':''}`);
      if (errors.length > 0) setError(`Failed for ${errors.length} hall(s): ${errors.map(e => e.message).join('; ')}`);

      setTimeout(() => { if (created.length>0) navigate('/admin-dashboard/showtime-management'); }, 800);
    } catch (err) {
      setError(err.message || 'Failed');
    }
  };

  if (loading) return (<div className="min-h-screen bg-background-900 flex items-center justify-center"><LoadingLogo size={80} text="Loading..."/></div>);

  if (!user || user.role !== 'admin') return (<div className="p-8">Unauthorized</div>);

  return (
    <div className="min-h-screen bg-background-900 text-text-primary">
      <div className="max-w-4xl mx-auto p-6">
        <BackButton to="/admin-dashboard/showtime-management" />
        <h1 className="text-2xl font-bold mb-4">Schedule New Showtime</h1>

        {error && <div className="mb-4 p-3 bg-semantic-error/20 border border-semantic-error/50 text-semantic-error rounded-lg">{error}</div>}
        {success && <div className="mb-4 p-3 bg-semantic-success/20 border border-semantic-success/50 text-semantic-success rounded-lg">{success}</div>}

        <form onSubmit={handleCreateShowtime} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Movie *</label>
            <select name="movieId" value={formData.movieId} onChange={handleFormChange} required className="w-full px-4 py-2 bg-surface-500 border rounded">
              <option value="">Select a movie</option>
              {movies.map(m => <option key={m._id} value={m._id}>{m.title} ({m.duration||''} min)</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-text-secondary">Cinemas (multi-select)</label>
                <button type="button" onClick={selectAllCinemas} className="text-xs px-2 py-1 bg-surface-600 border rounded hover:bg-surface-500">Select all cinemas</button>
              </div>
              <select name="cinemaIds" value={formData.cinemaIds || []} onChange={handleFormChange} multiple className="w-full h-32 px-4 py-2 bg-surface-500 border rounded">
                {cinemas.length === 0 ? (
                  <option value="">No cinemas available</option>
                ) : (
                  cinemas.map(c => (
                    <option key={c._id} value={c._id}>{c.name}{c.city?` - ${c.city}`:''}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-text-secondary">Hall * (multi-select)</label>
                <button type="button" onClick={selectAllHalls} className="text-xs px-2 py-1 bg-surface-600 border rounded hover:bg-surface-500">Select all halls</button>
              </div>
              <select name="hallIds" value={formData.hallIds||[]} onChange={handleFormChange} multiple required disabled={!formData.cinemaIds || formData.cinemaIds.length === 0} className="w-full h-40 px-2 py-2 bg-surface-500 border rounded disabled:opacity-50 disabled:cursor-not-allowed">
                {formData.cinemaIds && formData.cinemaIds.length > 0 ? (
                  modalHalls.length > 0 ? modalHalls.map(h => (
                    <option key={h._id} value={h._id}>
                      {h.name} ({h.totalSeats || (h.layout?.rows && h.layout?.cols ? `${h.layout.rows*h.layout.cols}` : '0')} seats){resolveCinemaName(h) ? ` — ${resolveCinemaName(h)}` : ''}
                    </option>
                  )) : (
                    <option value="" disabled>Loading halls...</option>
                  )
                ) : (
                  <option value="" disabled>Please select cinemas first</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Start Date & Time *</label>
            <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleFormChange} required min={getLocalDateTimeForInput()} className="w-full px-4 py-2 bg-surface-500 border rounded" />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Price (LKR) *</label>
              <input type="number" name="price" value={formData.price} onChange={handleFormChange} required min="0" step="0.01" placeholder={formatCurrency(0)} className="w-full px-4 py-2 bg-surface-500 border rounded" />
            </div>
          </div>

          {/* Selected halls summary (name and cinema) */}
          {getSelectedHalls().length > 0 && (
            <div className="p-3 bg-surface-500 rounded border border-surface-400/30">
              <div className="text-sm text-text-secondary mb-2">Selected halls</div>
              <div className="flex flex-col gap-3">
                {getSelectedHalls().map((h) => {
                  const cinemaName = h.cinemaId?.name || (cinemas.find(c => String(c._id) === String(h.cinemaId))?.name) || '';
                  const seatsFromLayout = Array.isArray(h.layout?.seats) ? h.layout.seats : [];
                  const inferredTotal = h.totalSeats || (h.layout?.rows && h.layout?.cols ? Number(h.layout.rows) * Number(h.layout.cols) : seatsFromLayout.length || 0);
                  const seatLabels = seatsFromLayout.length > 0 ? seatsFromLayout.map(s => s.label || `${s.row}-${s.col}`) : [];
                  return (
                    <div key={h._id} className="text-sm">
                      <div className="font-medium">{h.name}{cinemaName ? ` — ${cinemaName}` : ''}</div>
                      <div className="text-text-secondary text-xs mt-1">Seats: {inferredTotal}{h.layout?.rows && h.layout?.cols ? ` (${h.layout.rows}×${h.layout.cols})` : ''}</div>
                      {seatLabels.length > 0 && (
                        <div className="text-xs text-text-secondary mt-2">First seats: {seatLabels.slice(0,30).join(', ')}{seatLabels.length > 30 ? `, +${seatLabels.length - 30} more` : ''}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/admin-dashboard/showtime-management')} className="px-4 py-2 bg-gray-700 text-white rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded">Create Showtime</button>
          </div>
        </form>
      </div>
    </div>
  );
}
