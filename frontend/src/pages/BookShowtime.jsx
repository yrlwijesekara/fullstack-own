import { useState, useEffect, useContext } from 'react';
import { useNavigate } from '../hooks/useNavigate';
import { ToastContainer, toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';
import LoadingLogo from '../components/LoadingLogo';
import HallLayoutPreview from '../components/HallLayoutPreview';
import { API_BASE_URL } from '../utils/api';
import { getCart, addTicketsToCart } from '../utils/cart';

export default function BookShowtime() {
  const showtimeId = window.location.pathname.split('/')[2];
  const urlParams = new URLSearchParams(window.location.search);
  const cinemaQueryId = urlParams.get('cinemaId') || '';
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [showtime, setShowtime] = useState(null);
  const [cinema, setCinema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAdult, setSelectedAdult] = useState(1);
  const [selectedChild, setSelectedChild] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);

  // Validate showtimeId
  useEffect(() => {
    if (!showtimeId || showtimeId === 'undefined' || showtimeId === 'null') {
      toast.error('Invalid showtime ID');
      navigate('/movies');
      return;
    }
    fetchShowtime();
  }, [showtimeId]);

  useEffect(() => {
    // load cart quick summary
    const cart = getCart();
    setCartItemsCount(cart.reduce((s, i) => s + (i.qty || 0), 0));
    setCartTotal(cart.reduce((s, i) => s + (Number(i.price || 0) * (i.qty || 0)), 0));
  }, []);

  // update cart summary when returning from concessions
  useEffect(() => {
    const handleVisibility = () => {
      const cart = getCart();
      setCartItemsCount(cart.reduce((s, i) => s + (i.qty || 0), 0));
      setCartTotal(cart.reduce((s, i) => s + (Number(i.price || 0) * (i.qty || 0)), 0));
    };
    window.addEventListener('visibilitychange', handleVisibility);
    return () => window.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    const fetchCinema = async () => {
      if (!cinemaQueryId) return;
      try {
        const res = await fetch(`${API_BASE_URL}/cinemas/${cinemaQueryId}`);
        if (res.ok) {
          const data = await res.json();
          setCinema(data.data || data);
          return;
        }
        // Fallback: if individual endpoint not available, fetch list and find
        const listRes = await fetch(`${API_BASE_URL}/cinemas`);
        if (!listRes.ok) return;
        const listData = await listRes.json();
        const list = listData.data || listData.cinemas || listData;
        if (Array.isArray(list)) {
          const found = list.find(c => String(c._id) === String(cinemaQueryId));
          if (found) setCinema(found);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchCinema();
  }, [cinemaQueryId]);

  const fetchShowtime = async () => {
    // Validate showtimeId before making API call
    if (!showtimeId || showtimeId === 'undefined' || showtimeId === 'null') {
      toast.error('Invalid showtime ID');
      navigate('/movies');
      return;
    }

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

  // Validate cinema selection after showtime is loaded
  useEffect(() => {
    if (showtime && !cinemaQueryId && !showtime.cinemaId) {
      toast.error('Cinema selection is required for booking');
      navigate(`/movies/${showtime.movieId?._id || ''}/showtimes`);
    }
  }, [showtime, cinemaQueryId, navigate]);

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

  const ticketsTotal = Number(selectedAdult * showtime.price + selectedChild * showtime.price * 0.5);

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

  // update cart summary when returning from concessions
  

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
      const cinemaName = cinema?.name || showtime.cinemaId?.name || '';
      if (!cinemaName || cinemaName === 'N/A') {
        toast.error('Cinema information is required for booking');
        return;
      }

      addTicketsToCart({
        showtimeId: showtime._id || showtime.id || showtimeId,
        movieTitle: showtime.movieId?.title || 'Tickets',
        cinemaName,
        seats: selectedSeats,
        adultCount: selectedAdult,
        childCount: selectedChild,
        pricePerAdult: showtime.price,
      });
      const cart = getCart();
      setCartItemsCount(cart.reduce((s, i) => s + (i.qty || 0), 0));
      setCartTotal(cart.reduce((s, i) => s + (Number(i.price || 0) * (i.qty || 0)), 0));
      toast.success('Tickets added to cart');
      // Small delay to ensure toast is shown before navigation
      setTimeout(() => navigate('/cart'), 100);
    } catch (e) {
      console.error('Add tickets to cart failed', e);
      toast.error('Failed to add tickets to cart');
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
            {showtime.movieId?.posterImage && (
              <img
                src={showtime.movieId.posterImage}
                alt={showtime.movieId.title}
                className="w-24 h-36 object-cover rounded-lg"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold mb-2">{showtime.movieId?.title || 'Movie'}</h1>
              <div className="text-text-secondary space-y-1">
                <p>🏛️ Hall: {showtime.hallId?.name || 'N/A'}</p>
                <p>🎬 Cinema: {cinema?.name || showtime.cinemaId?.name || 'N/A'}</p>
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
                <div className="mt-3 space-y-2">
                  <div className="text-sm text-text-secondary">Cart: {cartItemsCount} item{cartItemsCount !== 1 ? 's' : ''} — {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(cartTotal)}</div>
                  <div className="text-sm text-text-secondary">Tickets total:</div>
                  <div className="text-lg font-bold text-secondary-300">{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(ticketsTotal)}</div>
                  <div className="text-sm text-text-secondary mt-1">Grand Total:</div>
                  <div className="text-2xl font-bold text-secondary-300">{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(ticketsTotal + cartTotal))}</div>

                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate(`/snacks?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}&showtimeId=${showtimeId}&cinemaId=${cinemaQueryId}`)}
                      className="px-4 py-2 bg-primary-500 text-white rounded"
                    >
                      Add Snacks
                    </button>
                    <button onClick={() => navigate('/cart')} className="px-4 py-2 bg-secondary-500 text-white rounded">View Cart ({cartItemsCount})</button>
                  </div>
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
                    ? 'Add to Cart'
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
