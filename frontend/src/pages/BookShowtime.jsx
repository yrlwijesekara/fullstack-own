import { useState, useEffect, useContext } from 'react';
import { useNavigate } from '../hooks/useNavigate';
import { ToastContainer, toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';
import LoadingLogo from '../components/LoadingLogo';
import HallLayoutPreview from '../components/HallLayoutPreview';
import { API_BASE_URL } from '../utils/api';

export default function BookShowtime() {
  const showtimeId = window.location.pathname.split('/')[2];
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [showtime, setShowtime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAdult, setSelectedAdult] = useState(1);
  const [selectedChild, setSelectedChild] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState([]);

  useEffect(() => {
    fetchShowtime();
  }, [showtimeId]);

  const fetchShowtime = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/showtimes/${showtimeId}`);
      if (!res.ok) throw new Error('Showtime not found');
      const data = await res.json();
      setShowtime(data.data);
    } catch (err) {
      toast.error(err.message || 'Unable to load showtime');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background-900 flex items-center justify-center">
      <LoadingLogo size={80} text="Loading booking..." />
    </div>
  );

  if (!showtime) return (
    <div className="min-h-screen bg-background-900 flex items-center justify-center">
      <div className="text-text-primary">Showtime not found</div>
    </div>
  );

  const totalTickets = Number(selectedAdult) + Number(selectedChild);

  const hallLayout = showtime.hallId?.layout || { rows: 0, cols: 0, seats: [] };

  const handleSeatClick = (seat) => {
    if (selectedSeats.includes(seat.label)) {
      // Deselect
      setSelectedSeats(selectedSeats.filter(s => s !== seat.label));
    } else {
      // Select
      if (selectedSeats.length >= totalTickets) {
        toast.info(`You can only select ${totalTickets} seats`);
        return;
      }
      setSelectedSeats([...selectedSeats, seat.label]);
    }
  };

  const handleConfirm = async () => {
    if (!user) {
      toast.info('Please login to complete booking');
      setTimeout(() => navigate('/login'), 600);
      return;
    }

    if (selectedSeats.length !== totalTickets) {
      toast.error('Please select seats equal to ticket count');
      return;
    }

    try {
      const body = { showtimeId, seats: selectedSeats, adultCount: selectedAdult, childCount: selectedChild };
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Booking failed');
      toast.success('Booking confirmed!');
      navigate('/profile');
    } catch (err) {
      toast.error(err.message || 'Booking failed');
    }
  };

  return (
    <div className="min-h-screen bg-background-900 text-text-primary">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <BackButton to={`/movies/${showtime.movieId?._id || ''}/showtimes`} />

        {/* Movie & Showtime Info */}
        <div className="mt-6 mb-6 bg-surface-600 p-6 rounded-lg border border-secondary-400">
          <div className="flex gap-4 items-start">
            {showtime.movieId?.posterUrl && (
              <img
                src={showtime.movieId.posterUrl}
                alt={showtime.movieId.title}
                className="w-24 h-36 object-cover rounded-lg"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold mb-2">{showtime.movieId?.title || 'Movie'}</h1>
              <div className="text-text-secondary space-y-1">
                <p>🏛️ Hall: {showtime.hallId?.name || 'N/A'}</p>
                <p>🎬 Cinema: {showtime.cinemaId?.name || 'N/A'}</p>
                <p>📅 {new Date(showtime.startTime).toLocaleString()}</p>
                <p>💰 {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(showtime.price))} per ticket</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seat Selection with Hall Layout */}
          <div className="lg:col-span-2 bg-surface-600 p-6 rounded-lg border border-secondary-400">
            <h2 className="text-2xl font-bold mb-2">Select Your Seats</h2>
            <p className="text-text-secondary mb-6">
              Choose {totalTickets} seat{totalTickets !== 1 ? 's' : ''} for your booking
            </p>

            <HallLayoutPreview
              layout={hallLayout}
              onSeatClick={handleSeatClick}
              selectedSeats={selectedSeats}
              bookedSeats={showtime.bookedSeats || []}
              showScreen={true}
              showLegend={true}
              interactive={true}
              maxSeats={totalTickets}
            />
          </div>

          {/* Booking Summary */}
          <div className="bg-surface-600 p-6 rounded-lg border border-secondary-400 h-fit">
            <h3 className="text-xl font-semibold mb-6">Booking Summary</h3>
            
            <div className="space-y-4">
              {/* Ticket Selection */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Adult Tickets
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={selectedAdult}
                  onChange={(e) => {
                    setSelectedAdult(Math.max(0, Number(e.target.value)));
                    setSelectedSeats([]); // Reset seat selection when count changes
                  }}
                  className="w-full px-4 py-3 rounded bg-surface-500 border border-secondary-400 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Child Tickets (50% off)
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={selectedChild}
                  onChange={(e) => {
                    setSelectedChild(Math.max(0, Number(e.target.value)));
                    setSelectedSeats([]); // Reset seat selection when count changes
                  }}
                  className="w-full px-4 py-3 rounded bg-surface-500 border border-secondary-400 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-secondary-400 pt-4">
                <div className="text-sm text-text-secondary mb-2">Price per Adult</div>
                <div className="text-lg font-bold text-primary-400 mb-3">
                  {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(showtime.price))}
                </div>
                <div className="text-sm text-text-secondary mb-1">
                  Total: {totalTickets} ticket{totalTickets !== 1 ? 's' : ''}
                </div>
                <div className="text-2xl font-bold text-secondary-300">
                  {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(selectedAdult * showtime.price + selectedChild * showtime.price * 0.5))}
                </div>
              </div>

              {/* Selected Seats */}
              <div className="border-t border-secondary-400 pt-4">
                <div className="text-sm font-medium text-text-secondary mb-2">
                  Selected Seats
                </div>
                <div className="min-h-[60px] p-3 bg-surface-500 rounded border border-secondary-400">
                  {selectedSeats.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedSeats.map((seat) => (
                        <span
                          key={seat}
                          className="px-3 py-1 bg-primary-500 text-white rounded-full text-sm font-medium"
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-text-muted text-sm">No seats selected</div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleConfirm}
                  disabled={selectedSeats.length !== totalTickets || totalTickets === 0}
                  className={`w-full py-3 rounded-lg font-bold uppercase tracking-wide transition ${
                    selectedSeats.length === totalTickets && totalTickets > 0
                      ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : 'bg-surface-500 text-text-muted cursor-not-allowed'
                  }`}
                >
                  {selectedSeats.length === totalTickets && totalTickets > 0
                    ? 'Confirm Booking'
                    : `Select ${totalTickets - selectedSeats.length} more seat${
                        totalTickets - selectedSeats.length !== 1 ? 's' : ''
                      }`}
                </button>

                {!user && (
                  <div className="text-center text-xs text-text-secondary">
                    💡 You'll be redirected to login to complete the booking
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
}
